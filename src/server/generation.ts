import { createServerFn } from '@tanstack/react-start'

import {
  generationRequestSchema,
  parseCardGenerationResponse,
} from '../generation/contracts'
import { getConfiguredAiProvider } from './ai-provider'
import { observe } from './observability'

export const generateCards = createServerFn({ method: 'POST' })
  .validator((input: unknown) => generationRequestSchema.parse(input))
  .handler(async ({ data }) =>
    observe('card_generation', async () => {
      const providerResponse = await getConfiguredAiProvider().generateCards(data)
      const parsedResponse = parseCardGenerationResponse(providerResponse)

      if (!parsedResponse.success) {
        throw new Error(
          `AI provider returned invalid cards: ${parsedResponse.errors.join('; ')}`,
        )
      }

      return parsedResponse.data
    }),
  )
