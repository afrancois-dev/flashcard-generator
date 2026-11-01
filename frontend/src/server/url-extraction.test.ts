import { describe, expect, it, vi } from 'vitest'

import {
  UrlExtractionError,
  fetchSourceUrl,
  validateSourceUrl,
} from './url-extraction'

describe('URL extraction', () => {
  it('rejects local URLs', () => {
    expect(() => validateSourceUrl('http://127.0.0.1:3000')).toThrow(
      UrlExtractionError,
    )
  })

  it('extracts readable article text', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        '<article><h1>Title</h1><p>Useful content.</p><script>ignore</script></article>',
        {
          status: 200,
          headers: { 'content-type': 'text/html' },
        },
      ),
    )

    await expect(fetchSourceUrl('https://example.com/page', fetcher)    ).resolves.toBe('Title Useful content.')
  })

  it('rejects oversized pages', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response('x'.repeat(2_000_001), {
        status: 200,
        headers: { 'content-type': 'text/html' },
      }),
    )

    await expect(fetchSourceUrl('https://example.com/page', fetcher)).rejects.toThrow(
      UrlExtractionError,
    )
  })
})
