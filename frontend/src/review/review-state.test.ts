import { describe, expect, it } from 'vitest'

import { createReviewState, reviewReducer } from './review-state'

const card = {
  id: 'basic-1',
  type: 'basic' as const,
  front: 'Front',
  back: 'Back',
  tags: [],
}

describe('reviewReducer', () => {
  it('tracks edits, deletions, and selections', () => {
    const state = createReviewState({ cards: [card] })
    const edited = { ...card, back: 'Updated' }
    const afterEdit = reviewReducer(state, { type: 'update', card: edited })
    const afterSelect = reviewReducer(afterEdit, {
      type: 'toggleSelected',
      id: card.id,
    })
    const afterDelete = reviewReducer(afterSelect, {
      type: 'delete',
      id: card.id,
    })

    expect(afterEdit).toMatchObject({ cards: [edited], dirty: true })
    expect(afterSelect.selectedIds).toEqual([card.id])
    expect(afterDelete.cards).toEqual([])
    expect(afterDelete.selectedIds).toEqual([])
  })

  it('resets to the initially loaded collection', () => {
    const state = createReviewState({ cards: [card] })
    const edited = reviewReducer(state, {
      type: 'update',
      card: { ...card, front: 'Changed' },
    })

    expect(reviewReducer(edited, { type: 'reset' })).toEqual(state)
  })
})
