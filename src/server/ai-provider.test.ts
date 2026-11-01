import { describe, expect, it, vi } from 'vitest'

import { AiProviderError, OpenAiCompatibleProvider } from './ai-provider'

describe('OpenAiCompatibleProvider', () => {
  const request = {
    source: { mode: 'text' as const, content: 'Notes' },
    cardTypes: ['basic' as const],
    requestedCount: 1,
  }

  it('returns the model content from a successful response', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [{ message: { content: '{"cards":[]}' } }],
        }),
        { status: 200 },
      ),
    )
    const provider = new OpenAiCompatibleProvider({
      apiKey: 'test-key',
      apiUrl: 'https://example.test/v1/chat/completions',
      model: 'test-model',
      fetcher,
    })

    await expect(provider.generateCards(request)).resolves.toBe('{"cards":[]}')
    expect(fetcher).toHaveBeenCalledOnce()
  })

  it('surfaces provider failures', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response('unavailable', { status: 503 }),
    )
    const provider = new OpenAiCompatibleProvider({
      apiKey: 'test-key',
      apiUrl: 'https://example.test/v1/chat/completions',
      model: 'test-model',
      fetcher,
    })

    await expect(provider.generateCards(request)).rejects.toThrow(AiProviderError)
  })
})
