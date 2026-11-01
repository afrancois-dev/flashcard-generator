import { describe, expect, it } from 'vitest'

import { exportCardsToDeck } from './apkg-export'

describe('APKG export', () => {
  it('maps basic and cloze cards to the Anki deck API', () => {
    const calls: string[] = []
    const deck = {
      addCard: (front: string, back: string) => calls.push(`basic:${front}:${back}`),
      addCloze: (text: string) => calls.push(`cloze:${text}`),
    }

    exportCardsToDeck(deck, {
      cards: [
        {
          id: 'basic-1',
          type: 'basic',
          front: 'Question',
          back: 'Answer',
          tags: [],
        },
        {
          id: 'cloze-1',
          type: 'cloze',
          text: 'A {{c1::cloze}} card.',
          tags: [],
        },
      ],
    })

    expect(calls).toEqual([
      'basic:Question:Answer',
      'cloze:A {{c1::cloze}} card.',
    ])
  })
})
