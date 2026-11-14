import { describe, expect, it } from 'vitest'

import { validateSourceInput } from '../input/input-validation'
import { parseCardGenerationResponse } from '../generation/contracts'
import { exportCardsToDeck } from '../export/apkg-export'
import { serializeCsv } from '../export/text-export'
import { createReviewState, reviewReducer } from '../review/review-state'
import { refineCardWithProvider } from '../server/refinement'

describe('MVP workflow', () => {
  it('moves source input through generation, editing, refinement, and exports', async () => {
    const source = 'Photosynthesis converts light energy into chemical energy.'
    expect(validateSourceInput('text', source)).toBeNull()

    const generated = parseCardGenerationResponse({
      cards: [
        {
          id: 'card-1',
          type: 'basic',
          front: 'What does photosynthesis convert?',
          back: 'Light energy into chemical energy.',
          tags: ['biology'],
        },
      ],
    })
    expect(generated.success).toBe(true)
    if (!generated.success) return

    const state = createReviewState(generated.data)
    const edited = reviewReducer(state, {
      type: 'update',
      card: {
        ...state.cards[0],
        ...(state.cards[0].type === 'basic'
          ? { back: 'Light into chemical energy.' }
          : {}),
      } as (typeof state.cards)[0],
    })

    const refined = await refineCardWithProvider(
      {
        generateCards: async () => ({
          cards: [
            {
              id: 'refined',
              type: 'basic',
              front: 'What does photosynthesis convert?',
              back: 'Light into chemical energy.',
              tags: ['biology'],
            },
          ],
        }),
      },
      {
        card: edited.cards[0],
        instruction: 'Make the answer concise.',
      },
    )
    const finalState = reviewReducer(edited, { type: 'update', card: refined })

    expect(serializeCsv({ cards: finalState.cards })).toContain(
      '"Light into chemical energy."',
    )

    const apkgCalls: string[] = []
    exportCardsToDeck(
      {
        addCard: (front, back) => apkgCalls.push(`${front}:${back}`),
        addCloze: () => undefined,
      },
      { cards: finalState.cards },
    )
    expect(apkgCalls).toEqual([
      'What does photosynthesis convert?:Light into chemical energy.',
    ])
  })
})
