import { useReducer } from 'react'

import type { Card, CardCollection } from '../domain/cards'

export type ReviewState = {
  cards: Card[]
  initialCards: Card[]
  dirty: boolean
  selectedIds: string[]
}

export type ReviewAction =
  | { type: 'replace'; collection: CardCollection }
  | { type: 'update'; card: Card }
  | { type: 'delete'; id: string }
  | { type: 'add'; card: Card }
  | { type: 'toggleSelected'; id: string }
  | { type: 'reset' }

export function createReviewState(collection: CardCollection): ReviewState {
  return {
    cards: collection.cards,
    initialCards: collection.cards,
    dirty: false,
    selectedIds: [],
  }
}

export function reviewReducer(
  state: ReviewState,
  action: ReviewAction,
): ReviewState {
  switch (action.type) {
    case 'replace':
      return createReviewState(action.collection)
    case 'update':
      return {
        ...state,
        cards: state.cards.map((card) =>
          card.id === action.card.id ? action.card : card,
        ),
        dirty: true,
      }
    case 'delete':
      return {
        ...state,
        cards: state.cards.filter((card) => card.id !== action.id),
        selectedIds: state.selectedIds.filter((id) => id !== action.id),
        dirty: true,
      }
    case 'add':
      return {
        ...state,
        cards: [...state.cards, action.card],
        dirty: true,
      }
    case 'toggleSelected':
      return {
        ...state,
        selectedIds: state.selectedIds.includes(action.id)
          ? state.selectedIds.filter((id) => id !== action.id)
          : [...state.selectedIds, action.id],
      }
    case 'reset':
      return createReviewState({ cards: state.initialCards })
  }
}

export function useReviewState(collection: CardCollection) {
  return useReducer(reviewReducer, collection, createReviewState)
}
