import { z } from 'zod'

import { cardSchema, type Card } from '../domain/cards'

export const refinementRequestSchema = z.object({
  card: cardSchema,
  instruction: z.string().trim().min(1).max(2000),
})

export const bulkRefinementRequestSchema = z.object({
  cards: z.array(cardSchema).min(1),
  instruction: z.string().trim().min(1).max(2000),
})

export type RefinementRequest = z.infer<typeof refinementRequestSchema>
export type BulkRefinementRequest = z.infer<typeof bulkRefinementRequestSchema>
export type RefinementResult = { card: Card }
