import type { GenerationRequest } from '../generation/contracts'

export interface AiProvider {
  generateCards(request: GenerationRequest): Promise<unknown>
}

type OpenAiResponse = {
  choices?: Array<{
    message?: {
      content?: string
    }
  }>
}

export class AiProviderError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AiProviderError'
  }
}

export class OpenAiCompatibleProvider implements AiProvider {
  constructor(
    private readonly config: {
      apiKey: string
      apiUrl: string
      model: string
      fetcher?: typeof fetch
    },
  ) {}

  async generateCards(request: GenerationRequest): Promise<unknown> {
    const fetcher = this.config.fetcher ?? fetch
    const response = await fetcher(this.config.apiUrl, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${this.config.apiKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: [
          {
            role: 'user',
            content: JSON.stringify(request),
          },
        ],
        response_format: { type: 'json_object' },
      }),
    })

    if (!response.ok) {
      throw new AiProviderError(
        `AI provider request failed with status ${response.status}.`,
      )
    }

    const payload = (await response.json()) as OpenAiResponse
    const content = payload.choices?.[0]?.message?.content

    if (!content) {
      throw new AiProviderError('AI provider returned an empty response.')
    }

    return content
  }
}

export function getConfiguredAiProvider(): AiProvider {
  const { AI_API_KEY: apiKey, AI_API_URL: apiUrl, AI_MODEL: model } = process.env

  if (!apiKey || !apiUrl || !model) {
    throw new AiProviderError(
      'AI provider is not configured. Set AI_API_KEY, AI_API_URL, and AI_MODEL.',
    )
  }

  return new OpenAiCompatibleProvider({ apiKey, apiUrl, model })
}
