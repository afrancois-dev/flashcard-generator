import { z } from 'zod'

const tagsSchema = z.array(z.string().trim().min(1)).superRefine((tags, context) => {
  if (new Set(tags).size !== tags.length) {
    context.addIssue({
      code: 'custom',
      message: 'Tags must be unique.',
    })
  }
})

const basicCardSchema = z.object({
  id: z.string().trim().min(1),
  type: z.literal('basic'),
  front: z.string().trim().min(1),
  back: z.string().trim().min(1),
  tags: tagsSchema,
})

const clozeCardSchema = z
  .object({
    id: z.string().trim().min(1),
    type: z.literal('cloze'),
    text: z.string().trim().min(1),
    tags: tagsSchema,
  })
  .superRefine((card, context) => {
    if (!/{{c\d+::[^{}]+}}/.test(card.text)) {
      context.addIssue({
        code: 'custom',
        path: ['text'],
        message: 'Cloze cards must contain at least one cloze deletion.',
      })
    }
  })

export const cardSchema = z.discriminatedUnion('type', [
  basicCardSchema,
  clozeCardSchema,
])

export const cardCollectionSchema = z.object({
  cards: z.array(cardSchema),
})

export type BasicCard = z.infer<typeof basicCardSchema>
export type ClozeCard = z.infer<typeof clozeCardSchema>
export type Card = z.infer<typeof cardSchema>
export type CardCollection = z.infer<typeof cardCollectionSchema>

export function validateCardCollection(
  value: unknown,
):
  | { success: true; data: CardCollection }
  | { success: false; errors: string[] } {
  const result = cardCollectionSchema.safeParse(value)

  if (result.success) {
    return result
  }

  return {
    success: false,
    errors: result.error.issues.map(
      (issue) => `${issue.path.join('.') || 'value'}: ${issue.message}`,
    ),
  }
}
