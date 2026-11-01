import { z } from 'zod'

import {
  cardCollectionSchema,
  type CardCollection,
} from '../domain/cards'

export const generationRequestSchema = z.object({
  source: z.object({
    mode: z.enum(['text', 'prompt']),
    content: z.string().trim().min(1),
  }),
  cardTypes: z
    .array(z.enum(['basic', 'cloze']))
    .min(1)
    .refine((types) => new Set(types).size === types.length, {
      message: 'Card types must be unique.',
    }),
  requestedCount: z.number().int().positive().max(100),
})

export type GenerationRequest = z.infer<typeof generationRequestSchema>

export function parseCardGenerationResponse(
  response: unknown,
):
  | { success: true; data: CardCollection }
  | { success: false; errors: string[] } {
  let value = response

  if (typeof response === 'string') {
    try {
      value = JSON.parse(response)
    } catch {
      return {
        success: false,
        errors: ['response: AI output is not valid JSON.'],
      }
    }
  }

  const result = cardCollectionSchema.safeParse(value)

  if (result.success) {
    return result
  }

  return {
    success: false,
    errors: result.error.issues.map(
      (issue) => `${issue.path.join('.') || 'response'}: ${issue.message}`,
    ),
  }
}
