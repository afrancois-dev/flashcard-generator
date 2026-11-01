import { useEffect, useMemo, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'

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

function ReviewPage() {
  const [state, dispatch] = useReviewState(useMemo(() => ({ cards: [] }), []))
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
    <section className="page">
      <div className="page-header split">
        <div><h1>Review cards</h1><p className="muted">Edit, refine, and save your generated cards.</p></div>
        <div className="cluster">
        <button className="button-primary" onClick={addCard} type="button">
        Add card
      </button>
      <button className="button-secondary" onClick={handleSave} type="button">
        Save cards
      </button>
        </div>
      </div>
      <div className="surface stack">
      {persistenceStatus ? <p className="status" role="status">{persistenceStatus}</p> : null}
      <div className="cluster">
      <label htmlFor="bulk-instruction">Refine all cards</label>
      <input className="field"
        id="bulk-instruction"
        onChange={(event) => setInstruction(event.target.value)}
        placeholder="Make answers more concise"
        value={instruction}
      />
      <button className="button-secondary" disabled={bulkRefining} onClick={handleBulkRefine} type="button">
        {bulkRefining ? 'Refining...' : 'Refine all'}
      </button>
      </div>
      {bulkStatus ? <p className="status" role="status">{bulkStatus}</p> : null}
      </div>
      <div className="review-grid">
      <div className="surface">
      {state.cards.length > 0 ? (
        <CardTable
          cards={state.cards}
          onToggleSelected={(id) => dispatch({ type: 'toggleSelected', id })}
          selectedIds={state.selectedIds}
        />
      ) : null}
      </div>
      <div className="stack">
      {state.cards.length === 0 ? (
        <p>No cards are ready for review yet.</p>
      ) : (
        state.cards.map((card) => (
          <CardEditor
            card={card}
            key={card.id}
            onDelete={() => dispatch({ type: 'delete', id: card.id })}
            onSave={(updatedCard) =>
              dispatch({ type: 'update', card: updatedCard })
            }
          />
        ))
      )}
      </div>
      </div>
    </section>
  )
}
