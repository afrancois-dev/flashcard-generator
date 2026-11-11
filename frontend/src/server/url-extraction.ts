import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

import { MAX_FETCHED_HTML_CHARS } from './limits'
import { extractUrlWithFastApi } from './fastapi-client'
export class UrlExtractionError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'UrlExtractionError'
  }
}

export function validateSourceUrl(value: string): URL {
  let url: URL
  try {
    url = new URL(value)
  } catch {
    throw new UrlExtractionError('Enter a valid web page URL.')
  }

  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new UrlExtractionError('Only HTTP and HTTPS URLs are supported.')
  }

  const hostname = url.hostname.toLowerCase()
  const isPrivateIpv4 =
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname) ||
    hostname.startsWith('169.254.')
  if (
    hostname === 'localhost' ||
    hostname === '::1' ||
    hostname === '127.0.0.1' ||
    hostname.startsWith('10.') ||
    hostname.startsWith('192.168.') ||
    isPrivateIpv4 ||
    hostname.startsWith('fc') ||
    hostname.startsWith('fd') ||
    hostname.startsWith('fe80:') ||
    hostname.endsWith('.local')
  ) {
    throw new UrlExtractionError('Local and private network URLs are not supported.')
  }

  return url
}

function extractReadableText(html: string): string {
  const article = html.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i)?.[1] ?? html
  const text = article
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim()

  if (!text) {
    throw new UrlExtractionError('The page did not contain readable text.')
  }

  return text
}

export async function fetchSourceUrl(
  value: string,
  fetcher: typeof fetch = fetch,
): Promise<string> {
  const url = validateSourceUrl(value)
  const response = await fetcher(url, {
    headers: { accept: 'text/html,application/xhtml+xml' },
  })

  if (!response.ok) {
    throw new UrlExtractionError(
      `Could not fetch the page (status ${response.status}).`,
    )
  }

  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
    throw new UrlExtractionError('The URL did not return an HTML page.')
  }

  const html = await response.text()
  if (html.length > MAX_FETCHED_HTML_CHARS) {
    throw new UrlExtractionError(
      `Fetched pages must be ${MAX_FETCHED_HTML_CHARS.toLocaleString()} characters or smaller.`,
    )
  }

  return extractReadableText(html)
}

const sourceUrlSchema = z.object({ url: z.string().trim().min(1) })

export const extractSourceUrl = createServerFn({ method: 'POST' })
  .validator((input: unknown) => sourceUrlSchema.parse(input))
  .handler(({ data }) => extractUrlWithFastApi(data.url))
