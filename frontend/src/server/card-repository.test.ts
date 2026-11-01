import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

import { CardRepository } from './card-repository'

describe('CardRepository', () => {
  it('saves and reloads a collection from the database', () => {
    const directory = mkdtempSync(join(tmpdir(), 'flashcards-'))
    const repository = new CardRepository(join(directory, 'cards.db'))
    const collection = {
      cards: [
        {
          id: 'basic-1',
          type: 'basic' as const,
          front: 'Front',
          back: 'Back',
          tags: ['study'],
        },
        {
          id: 'cloze-1',
          type: 'cloze' as const,
          text: 'A {{c1::cloze}} card.',
          tags: [],
        },
      ],
    }

    repository.save('collection-1', collection)
    repository.close()

    const restarted = new CardRepository(join(directory, 'cards.db'))
    expect(restarted.load('collection-1')).toEqual(collection)
    restarted.close()
  })

  it('returns null for an unknown collection', () => {
    const directory = mkdtempSync(join(tmpdir(), 'flashcards-'))
    const repository = new CardRepository(join(directory, 'cards.db'))

    expect(repository.load('missing')).toBeNull()
    repository.close()
  })
})
