import { createServerFn } from '@tanstack/react-start'

import {
  bulkRefinementRequestSchema,
  refinementRequestSchema,
  type RefinementRequest,
} from '../refinement/contracts'
import { parseCardGenerationResponse } from '../generation/contracts'
import type { Card } from '../domain/cards'
import { getConfiguredAiProvider, type AiProvider } from './ai-provider'
import { refineBulkWithFastApi, refineWithFastApi } from './fastapi-client'

async function refineOneCard(
  provider: AiProvider,
  request: RefinementRequest,
): Promise<Card> {
  const providerResponse = await provider.generateCards({
    source: {
      mode: 'prompt',
      content: `Refine this card according to the instruction.\nInstruction: ${request.instruction}\nCard: ${JSON.stringify(request.card)}`,
    },
    cardTypes: [request.card.type],
    requestedCount: 1,
  })
  const parsedResponse = parseCardGenerationResponse(providerResponse)
  const refinedCard = parsedResponse.success ? parsedResponse.data.cards[0] : undefined

  if (!refinedCard) {
    throw new Error(
      parsedResponse.success
        ? 'AI provider returned no refined card.'
        : `AI provider returned invalid cards: ${parsedResponse.errors.join('; ')}`,
    )
  }

  return { ...refinedCard, id: request.card.id }
}

export async function refineCardWithProvider(
  provider: AiProvider,
  request: RefinementRequest,
) {
  return refineOneCard(provider, request)
}

export const refineCard = createServerFn({ method: 'POST' })
  .validator((input: unknown) => refinementRequestSchema.parse(input))
  .handler(({ data }) => refineWithFastApi(data.card, data.instruction))

export const refineCards = createServerFn({ method: 'POST' })
  .validator((input: unknown) => bulkRefinementRequestSchema.parse(input))
  .handler(({ data }) => refineBulkWithFastApi(data.cards, data.instruction))
