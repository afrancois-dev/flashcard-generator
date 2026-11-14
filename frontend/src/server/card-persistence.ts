import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

import { cardCollectionSchema } from '../domain/cards'
import { observe } from './observability'
import {
  loadFromFastApi,
  saveWithFastApi,
  listCollectionsWithFastApi,
  createCollectionWithFastApi,
  deleteCollectionWithFastApi,
  renameCollectionWithFastApi,
  duplicateCollectionWithFastApi,
} from './fastapi-client'

const collectionRequestSchema = z.object({
  id: z.string().trim().min(1).max(100),
  collection: cardCollectionSchema,
})

const collectionIdSchema = z.object({
  id: z.string().trim().min(1).max(100),
})

const collectionNameSchema = z.object({
  name: z.string().trim().max(100).optional(),
})

const renameSchema = z.object({
  id: z.string().trim().min(1).max(100),
  newName: z.string().trim().min(1).max(100),
})

const duplicateSchema = z.object({
  id: z.string().trim().min(1).max(100),
  newName: z.string().trim().max(100).optional(),
})

export const saveCardCollection = createServerFn({ method: 'POST' })
  .validator((input: unknown) => collectionRequestSchema.parse(input))
  .handler(({ data }) =>
    observe('card_persistence_save', async () => {
      return saveWithFastApi(data.id, data.collection)
    }),
  )

export const loadCardCollection = createServerFn({ method: 'GET' })
  .validator((input: unknown) => collectionIdSchema.parse(input))
  .handler(({ data }) =>
    observe('card_persistence_load', async () =>
      loadFromFastApi(data.id),
    ),
  )

export const listCardCollections = createServerFn({ method: 'GET' })
  .handler(() =>
    observe('card_persistence_list', async () => listCollectionsWithFastApi()),
  )

export const createCardCollection = createServerFn({ method: 'POST' })
  .validator((input: unknown) => collectionNameSchema.parse(input))
  .handler(({ data }) =>
    observe('card_persistence_create', async () =>
      createCollectionWithFastApi(data.name),
    ),
  )

export const deleteCardCollection = createServerFn({ method: 'POST' })
  .validator((input: unknown) => collectionIdSchema.parse(input))
  .handler(({ data }) =>
    observe('card_persistence_delete', async () =>
      deleteCollectionWithFastApi(data.id),
    ),
  )

export const renameCardCollection = createServerFn({ method: 'POST' })
  .validator((input: unknown) => renameSchema.parse(input))
  .handler(({ data }) =>
    observe('card_persistence_rename', async () =>
      renameCollectionWithFastApi(data.id, data.newName),
    ),
  )

export const duplicateCardCollection = createServerFn({ method: 'POST' })
  .validator((input: unknown) => duplicateSchema.parse(input))
  .handler(({ data }) =>
    observe('card_persistence_duplicate', async () =>
      duplicateCollectionWithFastApi(data.id, data.newName),
    ),
  )
