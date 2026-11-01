import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

import { cardCollectionSchema } from '../domain/cards'
import { getCardRepository } from './card-repository'
import { observe } from './observability'

const collectionRequestSchema = z.object({
  id: z.string().trim().min(1).max(100),
  collection: cardCollectionSchema,
})

const collectionIdSchema = z.object({
  id: z.string().trim().min(1).max(100),
})

export const saveCardCollection = createServerFn({ method: 'POST' })
  .validator((input: unknown) => collectionRequestSchema.parse(input))
  .handler(({ data }) =>
    observe('card_persistence_save', async () => {
      getCardRepository().save(data.id, data.collection)
      return { saved: true, id: data.id }
    }),
  )

export const loadCardCollection = createServerFn({ method: 'GET' })
  .validator((input: unknown) => collectionIdSchema.parse(input))
  .handler(({ data }) =>
    observe('card_persistence_load', async () =>
      getCardRepository().load(data.id),
    ),
  )
