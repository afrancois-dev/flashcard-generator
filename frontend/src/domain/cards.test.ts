import { describe, expect, it } from 'vitest'

import { validateCardCollection } from './cards'

describe('validateCardCollection', () => {
  it('accepts basic and cloze cards without changing their content', () => {
    const collection = {
      cards: [
        {
          id: 'basic-1',
          type: 'basic',
          front: 'What is Anki?',
          back: 'A spaced-repetition flashcard application.',
          tags: ['study'],
        },
        {
          id: 'cloze-1',
          type: 'cloze',
          text: 'Anki uses {{c1::spaced repetition}}.',
          tags: [],
        },
      ],
    }

    const result = validateCardCollection(collection)

    expect(result).toEqual({ success: true, data: collection })
  })

  it('reports malformed card data explicitly', () => {
    const result = validateCardCollection({
      cards: [
        {
          id: 'cloze-1',
          type: 'cloze',
          text: 'Anki uses spaced repetition.',
          tags: ['study', 'study'],
        },
      ],
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.errors).toEqual(
        expect.arrayContaining([
          'cards.0.tags: Tags must be unique.',
          'cards.0.text: Cloze cards must contain at least one cloze deletion.',
        ]),
      )
    }
  })
})
