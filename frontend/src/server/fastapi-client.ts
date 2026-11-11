import type { CardCollection, Card } from '../domain/cards'

const backendUrl =
  process.env.FASTAPI_URL ?? process.env.BACKEND_URL ?? 'http://127.0.0.1:8000'

export class FastApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message)
    this.name = 'FastApiError'
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${backendUrl}${path}`, {
    ...init,
    headers: { 'content-type': 'application/json', ...init?.headers },
  })
  const payload = (await response.json().catch(() => undefined)) as
    | { message?: string }
    | undefined
  if (!response.ok) {
    throw new FastApiError(
      payload?.message ?? 'The FastAPI backend could not complete the request.',
      response.status,
    )
  }
  return payload as T
}

export function generateWithFastApi(input: {
  sourceText: string
  cardTypes: Array<'basic' | 'cloze'>
  requestedCount: number
}) {
  return request<CardCollection & { correlation_id: string }>(
    '/api/v1/flashcards/generate',
    {
      method: 'POST',
      body: JSON.stringify({
        source_text: input.sourceText,
        card_types: input.cardTypes,
        requested_count: input.requestedCount,
      }),
    },
  )
}

export function refineWithFastApi(card: Card, instruction: string) {
  return request<Card>('/api/v1/flashcards/refine', {
    method: 'POST',
    body: JSON.stringify({ card, instruction }),
  })
}

export function refineBulkWithFastApi(cards: Card[], instruction: string) {
  return request<Card[]>('/api/v1/flashcards/refine/bulk', {
    method: 'POST',
    body: JSON.stringify({ cards, instruction }),
  })
}

export function saveWithFastApi(id: string, collection: CardCollection) {
  return request<{ saved: true; id: string }>(`/api/v1/collections/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(collection),
  })
}

export function loadFromFastApi(id: string) {
  return request<CardCollection | null>(
    `/api/v1/collections/${encodeURIComponent(id)}`,
  )
}

export async function extractUrlWithFastApi(url: string) {
  const result = await request<{ text: string }>('/api/v1/sources/url', {
    method: 'POST',
    body: JSON.stringify({ url }),
  })
  return result.text
}

export async function extractDocumentWithFastApi(input: {
  name: string
  mimeType: string
  data: number[]
}) {
  const result = await request<{ text: string }>('/api/v1/sources/document', {
    method: 'POST',
    body: JSON.stringify({
      name: input.name,
      mime_type: input.mimeType,
      data: input.data,
    }),
  })
  return result.text
}
