import { useEffect, useMemo, useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'

import { CardDeck } from '../review/card-deck'
import { CardEditor } from '../review/card-editor'
import { CardTable } from '../review/card-table'
import { useReviewState } from '../review/review-state'
import { refineCards } from '../server/refinement'
import {
  loadCardCollection,
  saveCardCollection,
} from '../server/card-persistence'

export const Route = createFileRoute('/review')({
  component: ReviewPage,
})

type ReviewView = 'deck' | 'edit'

function ReviewPage() {
  const [state, dispatch] = useReviewState(useMemo(() => ({ cards: [] }), []))
  const [view, setView] = useState<ReviewView>('deck')
  const [instruction, setInstruction] = useState('')
  const [bulkStatus, setBulkStatus] = useState<string | null>(null)
  const [bulkRefining, setBulkRefining] = useState(false)
  const [persistenceStatus, setPersistenceStatus] = useState<string | null>(null)

  useEffect(() => {
    void loadCardCollection({ data: { id: 'default' } })
      .then((collection) => {
        if (collection) dispatch({ type: 'replace', collection })
      })
      .catch(() => setPersistenceStatus('Could not load the saved collection.'))
  }, [dispatch])

  function addCard() {
    dispatch({
      type: 'add',
      card: {
        id: `card-${Date.now()}`,
        type: 'basic',
        front: '',
        back: '',
        tags: [],
      },
    })
    setView('edit')
  }

  async function handleBulkRefine() {
    if (!instruction.trim() || state.cards.length === 0) {
      setBulkStatus('Add cards and enter an instruction before refining.')
      return
    }

    setBulkStatus('Refining cards...')
    setBulkRefining(true)
    try {
      const refinedCards = await refineCards({
        data: { cards: state.cards, instruction },
      })
      refinedCards.forEach((card) => dispatch({ type: 'update', card }))
      setBulkStatus(`Refined ${refinedCards.length} cards.`)
      setInstruction('')
    } catch (refinementError) {
      setBulkStatus(
        refinementError instanceof Error
          ? refinementError.message
          : 'Could not refine the cards.',
      )
    } finally {
      setBulkRefining(false)
    }
  }

  async function handleSave() {
    setPersistenceStatus('Saving cards...')
    try {
      await saveCardCollection({
        data: { id: 'default', collection: { cards: state.cards } },
      })
      setPersistenceStatus('Cards saved.')
    } catch (saveError) {
      setPersistenceStatus(
        saveError instanceof Error
          ? saveError.message
          : 'Could not save the cards.',
      )
    }
  }

  return (
    <section className="page review-page">
      <div className="page-header split review-header">
        <div>
          <p className="eyebrow">Your study set</p>
          <h1>Review your deck</h1>
          <p className="muted">
            Preview each card, make your final edits, and export with confidence.
          </p>
        </div>
        <div className="cluster">
          <button className="button-secondary" onClick={addCard} type="button">
            <span aria-hidden="true">+</span> Add card
          </button>
          <button
            className="button-primary"
            disabled={state.cards.length === 0}
            onClick={handleSave}
            type="button"
          >
            Save deck
          </button>
        </div>
      </div>

      {persistenceStatus ? (
        <p className="status review-status" role="status">
          {persistenceStatus}
        </p>
      ) : null}

      {state.cards.length > 0 ? (
        <>
          <div className="review-toolbar">
            <div aria-label="Review view" className="view-switcher" role="group">
              <button
                aria-pressed={view === 'deck'}
                className="view-switcher-button"
                onClick={() => setView('deck')}
                type="button"
              >
                <svg aria-hidden="true" viewBox="0 0 24 24">
                  <rect height="14" rx="2" width="12" x="7" y="5" />
                  <path d="M5 8H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h1m14-11h1a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-1" />
                </svg>
                Deck preview
              </button>
              <button
                aria-pressed={view === 'edit'}
                className="view-switcher-button"
                onClick={() => setView('edit')}
                type="button"
              >
                <svg aria-hidden="true" viewBox="0 0 24 24">
                  <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />
                </svg>
                Edit cards
              </button>
            </div>
            <span className="review-card-total">
              <strong>{state.cards.length}</strong>{' '}
              {state.cards.length === 1 ? 'card' : 'cards'} in this deck
            </span>
          </div>

          {view === 'deck' ? (
            <div className="deck-layout">
              <CardDeck cards={state.cards} />
              <aside className="deck-sidebar">
                <div className="deck-sidebar-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24">
                    <path d="m12 3 1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7Z" />
                    <path d="m19 16 .8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8Z" />
                  </svg>
                </div>
                <p className="eyebrow">Make it yours</p>
                <h2>A deck that feels like you.</h2>
                <p>
                  Fine-tune the wording, simplify an answer, or add the context
                  that helps an idea stick.
                </p>
                <button
                  className="button-secondary"
                  onClick={() => setView('edit')}
                  type="button"
                >
                  Edit this deck
                  <span aria-hidden="true">→</span>
                </button>
                <div className="deck-sidebar-note">
                  <span aria-hidden="true">✓</span>
                  Your edits stay in this workspace until you save.
                </div>
              </aside>
            </div>
          ) : (
            <div className="stack stack-lg">
              <div className="surface refine-panel">
                <div>
                  <p className="eyebrow">AI assistance</p>
                  <h2>Refine the whole deck</h2>
                  <p className="muted">
                    Apply one clear instruction to every card in this collection.
                  </p>
                </div>
                <div className="refine-controls">
                  <label htmlFor="bulk-instruction">Refinement instruction</label>
                  <div className="refine-input-row">
                    <input
                      className="field"
                      id="bulk-instruction"
                      onChange={(event) => setInstruction(event.target.value)}
                      placeholder="e.g. Make answers more concise"
                      value={instruction}
                    />
                    <button
                      className="button-secondary"
                      disabled={bulkRefining}
                      onClick={handleBulkRefine}
                      type="button"
                    >
                      {bulkRefining ? 'Refining…' : 'Refine all'}
                    </button>
                  </div>
                </div>
                {bulkStatus ? (
                  <p className="status" role="status">
                    {bulkStatus}
                  </p>
                ) : null}
              </div>
              <CardTable
                cards={state.cards}
                onToggleSelected={(id) =>
                  dispatch({ type: 'toggleSelected', id })
                }
                selectedIds={state.selectedIds}
              />
              <div className="editor-list">
                {state.cards.map((card) => (
                  <CardEditor
                    card={card}
                    key={card.id}
                    onDelete={() => dispatch({ type: 'delete', id: card.id })}
                    onSave={(updatedCard) =>
                      dispatch({ type: 'update', card: updatedCard })
                    }
                  />
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="surface empty-deck">
          <div className="empty-deck-visual" aria-hidden="true">
            <span />
            <span />
            <span>?</span>
          </div>
          <p className="eyebrow">A fresh start</p>
          <h2>Your next great deck starts here.</h2>
          <p className="muted">
            Add a card manually or generate a complete set from notes, a document,
            a web page, or a prompt.
          </p>
          <div className="cluster empty-deck-actions">
            <Link className="button button-primary" to="/input">
              Generate a deck <span aria-hidden="true">→</span>
            </Link>
            <button className="button-secondary" onClick={addCard} type="button">
              Add a blank card
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
