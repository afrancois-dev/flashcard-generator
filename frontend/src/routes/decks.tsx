import { useEffect, useMemo, useState } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'

import { CardDeck } from '../review/card-deck'
import { CardEditor } from '../review/card-editor'

import { useReviewState } from '../review/review-state'
import { refineCards } from '../server/refinement'
import {
  loadCardCollection,
  saveCardCollection,
  listCardCollections,
  createCardCollection,
  deleteCardCollection,
  renameCardCollection,
  duplicateCardCollection,
} from '../server/card-persistence'
import { createApkgBlob, downloadApkg } from '../export/apkg-export'
import {
  downloadTextFile,
  serializeCsv,
  serializeTxt,
} from '../export/text-export'

export const Route = createFileRoute('/decks')({
  component: DecksPage,
  validateSearch: (search: Record<string, unknown>) => ({
    deck: typeof search.deck === 'string' ? search.deck : undefined,
  }),
})

type ReviewView = 'deck' | 'edit'
type CollectionSummary = {
  id: string
  updated_at: string
  card_count: number
}

function DecksPage() {
  const navigate = useNavigate()
  const search = Route.useSearch()
  const [decks, setDecks] = useState<CollectionSummary[]>([])
  const [currentDeckId, setCurrentDeckId] = useState<string>(
    search.deck ?? 'default',
  )
  const [state, dispatch] = useReviewState(useMemo(() => ({ cards: [] }), []))
  const [view, setView] = useState<ReviewView>('deck')
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null)
  const [instruction, setInstruction] = useState('')
  const [bulkStatus, setBulkStatus] = useState<string | null>(null)
  const [bulkRefining, setBulkRefining] = useState(false)
  const [persistenceStatus, setPersistenceStatus] = useState<string | null>(null)
  const [exportStatus, setExportStatus] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)
  const [newDeckName, setNewDeckName] = useState('')
  const [creating, setCreating] = useState(false)

  async function refreshDecks() {
    try {
      const list = await listCardCollections()
      setDecks(list)
      if (list.length > 0 && !list.some((deck) => deck.id === currentDeckId)) {
        setCurrentDeckId(list[0].id)
      }
    } catch {
      setPersistenceStatus('Could not load deck list.')
    }
  }

  useEffect(() => {
    void refreshDecks()
  }, [])

  useEffect(() => {
    if (search.deck && search.deck !== currentDeckId) {
      setCurrentDeckId(search.deck)
    }
  }, [search.deck])

  useEffect(() => {
    if (currentDeckId && currentDeckId !== search.deck) {
      void navigate({ to: '/decks', search: { deck: currentDeckId }, replace: true })
    }
  }, [currentDeckId])

  useEffect(() => {
    void loadCardCollection({ data: { id: currentDeckId } })
      .then((collection) => {
        if (collection) dispatch({ type: 'replace', collection })
        else dispatch({ type: 'replace', collection: { cards: [] } })
      })
      .catch(() => setPersistenceStatus('Could not load the selected deck.'))
  }, [currentDeckId, dispatch])

  useEffect(() => {
    if (view === 'edit' && state.cards.length > 0) {
      if (!selectedCardId || !state.cards.some((card) => card.id === selectedCardId)) {
        setSelectedCardId(state.cards[0].id)
      }
    }
  }, [view, state.cards, selectedCardId])

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
    setPersistenceStatus('Saving deck...')
    try {
      await saveCardCollection({
        data: { id: currentDeckId, collection: { cards: state.cards } },
      })
      setPersistenceStatus('Deck saved.')
      setExportStatus('Deck ready to download.')
      await refreshDecks()
    } catch (saveError) {
      setPersistenceStatus(
        saveError instanceof Error
          ? saveError.message
          : 'Could not save the deck.',
      )
    }
  }

  async function handleCreateDeck(event: React.FormEvent) {
    event.preventDefault()
    const name = newDeckName.trim()
    setCreating(true)
    try {
      const result = await createCardCollection({ data: { name: name || undefined } })
      setCurrentDeckId(result.id)
      setNewDeckName('')
      await refreshDecks()
      setPersistenceStatus(`Created deck "${result.id}".`)
    } catch (createError) {
      setPersistenceStatus(
        createError instanceof Error
          ? createError.message
          : 'Could not create the deck.',
      )
    } finally {
      setCreating(false)
    }
  }

  async function handleDeleteDeck(id: string) {
    if (!window.confirm(`Delete deck "${id}"? This cannot be undone.`)) return
    try {
      await deleteCardCollection({ data: { id } })
      await refreshDecks()
      if (id === currentDeckId) {
        setCurrentDeckId('default')
      }
      setPersistenceStatus(`Deleted deck "${id}".`)
    } catch (deleteError) {
      setPersistenceStatus(
        deleteError instanceof Error
          ? deleteError.message
          : 'Could not delete the deck.',
      )
    }
  }

  async function handleRenameDeck(id: string) {
    const newName = window.prompt('New name for this deck:', id)
    if (!newName || newName.trim() === '' || newName.trim() === id) return
    try {
      const result = await renameCardCollection({
        data: { id, newName: newName.trim() },
      })
      if (id === currentDeckId) setCurrentDeckId(result.id)
      await refreshDecks()
      setPersistenceStatus(`Renamed deck to "${result.id}".`)
    } catch (renameError) {
      setPersistenceStatus(
        renameError instanceof Error
          ? renameError.message
          : 'Could not rename the deck.',
      )
    }
  }

  async function handleDuplicateDeck(id: string) {
    try {
      const result = await duplicateCardCollection({ data: { id } })
      await refreshDecks()
      setCurrentDeckId(result.id)
      setPersistenceStatus(`Duplicated deck as "${result.id}".`)
    } catch (duplicateError) {
      setPersistenceStatus(
        duplicateError instanceof Error
          ? duplicateError.message
          : 'Could not duplicate the deck.',
      )
    }
  }

  async function handleExportApkg() {
    setExporting(true)
    setExportStatus('Building APKG export...')
    try {
      const blob = await createApkgBlob({ cards: state.cards })
      downloadApkg(blob, `${currentDeckId}.apkg`)
      setExportStatus('Downloaded APKG export.')
    } catch (exportError) {
      setExportStatus(
        exportError instanceof Error
          ? exportError.message
          : 'Could not create APKG export.',
      )
    } finally {
      setExporting(false)
    }
  }

  function handleExportText(format: 'csv' | 'txt') {
    const content =
      format === 'csv'
        ? serializeCsv({ cards: state.cards })
        : serializeTxt({ cards: state.cards })
    downloadTextFile(
      content,
      `${currentDeckId}.${format}`,
      format === 'csv' ? 'text/csv' : 'text/plain',
    )
    setExportStatus(`Downloaded ${format.toUpperCase()} export.`)
  }

  return (
    <section className="page decks-page">
      <div className="page-header split review-header">
        <div>
          <p className="eyebrow">Your decks</p>
          <h1>Decks</h1>
          <p className="muted">
            Manage your saved decks, review cards, and export when ready.
          </p>
        </div>
      </div>

      <div className="decks-layout">
        <aside className="deck-list-panel">
          <div className="deck-list-header">
            <p className="eyebrow">Saved decks</p>
            <span className="review-card-total">
              {decks.length} {decks.length === 1 ? 'deck' : 'decks'}
            </span>
          </div>
          <ul className="deck-list">
            {decks.map((deck) => (
              <li key={deck.id}>
                <button
                  aria-current={deck.id === currentDeckId ? 'true' : undefined}
                  className="deck-list-item"
                  onClick={() => setCurrentDeckId(deck.id)}
                  type="button"
                >
                  <span className="deck-list-name">{deck.id}</span>
                  <span className="deck-list-meta">
                    {deck.card_count} cards
                  </span>
                </button>
                <button
                  aria-label={`Rename deck ${deck.id}`}
                  className="deck-list-action"
                  onClick={() => handleRenameDeck(deck.id)}
                  type="button"
                >
                  ✎
                </button>
                <button
                  aria-label={`Duplicate deck ${deck.id}`}
                  className="deck-list-action"
                  onClick={() => handleDuplicateDeck(deck.id)}
                  type="button"
                >
                  ⧉
                </button>
                <button
                  aria-label={`Delete deck ${deck.id}`}
                  className="deck-list-delete"
                  onClick={() => handleDeleteDeck(deck.id)}
                  type="button"
                >
                  ×
                </button>
              </li>
            ))}
            {decks.length === 0 ? (
              <li className="muted">No saved decks yet.</li>
            ) : null}
          </ul>
          <form className="new-deck-form" onSubmit={handleCreateDeck}>
            <input
              className="field"
              onChange={(event) => setNewDeckName(event.target.value)}
              placeholder="New deck name"
              value={newDeckName}
            />
            <button
              className="button-secondary"
              disabled={creating}
              type="submit"
            >
              {creating ? 'Creating…' : 'New deck'}
            </button>
          </form>
        </aside>

        <div className="deck-workspace">
          {persistenceStatus ? (
            <p className="status review-status" role="status">
              {persistenceStatus}
            </p>
          ) : null}

          <div className="page-header split review-header">
            <div>
              <p className="eyebrow">Current deck</p>
              <h2>{currentDeckId}</h2>
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

          {state.cards.length > 0 ? (
            <>
              <div className="review-toolbar">
                <span className="review-card-total">
                  <strong>{state.cards.length}</strong>{' '}
                  {state.cards.length === 1 ? 'card' : 'cards'} in this deck
                </span>
              </div>

              {view === 'deck' ? (
                <div className="deck-layout">
                  <CardDeck cards={state.cards} />
                  <aside className="deck-sidebar">
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
                    </button>
                    <div className="deck-sidebar-note">
                      Your edits stay in this workspace until you save.
                    </div>
                  </aside>
                </div>
              ) : null}

              {view === 'edit' ? (
                <div className="stack stack-lg">
                  <div className="cluster">
                    <button
                      className="button-secondary"
                      onClick={() => setView('deck')}
                      type="button"
                    >
                      ← Back to deck preview
                    </button>
                  </div>
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
                  <div className="edit-layout">
                    <aside className="edit-list">
                      <p className="eyebrow">Cards</p>
                      <ul className="edit-card-list">
                        {state.cards.map((card, index) => (
                          <li key={card.id}>
                            <button
                              aria-current={
                                selectedCardId === card.id ? 'true' : undefined
                              }
                              className="edit-card-item"
                              onClick={() => setSelectedCardId(card.id)}
                              type="button"
                            >
                              <span className="edit-card-number">
                                {String(index + 1).padStart(2, '0')}
                              </span>
                              <span className="edit-card-preview">
                                {card.type === 'basic' ? card.front : card.text}
                              </span>
                              <span className="card-type">
                                {card.type === 'basic' ? 'Basic' : 'Cloze'}
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </aside>
                    <div className="edit-detail">
                      {(() => {
                        const selected = state.cards.find(
                          (card) => card.id === (selectedCardId ?? state.cards[0]?.id),
                        )
                        if (!selected) {
                          return (
                            <div className="surface empty-detail">
                              <p className="muted">Select a card to edit its details.</p>
                            </div>
                          )
                        }
                        return (
                          <CardEditor
                            card={selected}
                            key={selected.id}
                            onDelete={() => {
                              dispatch({ type: 'delete', id: selected.id })
                              setSelectedCardId(null)
                            }}
                            onSave={(updatedCard) => {
                              dispatch({ type: 'update', card: updatedCard })
                            }}
                          />
                        )
                      })()}
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="surface export-panel">
                <div className="export-panel-heading">
                  <span className="export-icon">
                    <svg aria-hidden="true" viewBox="0 0 24 24">
                      <path d="M12 3v12m-5-5 5 5 5-5M5 21h14a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2" />
                    </svg>
                  </span>
                  <div>
                    <h2>Export your deck</h2>
                    <p className="muted">
                      {exportStatus ?? 'Download the reviewed cards in your preferred format.'}
                    </p>
                  </div>
                </div>
                <div className="export-options">
                  <button
                    className="button-primary"
                    disabled={exporting || state.cards.length === 0}
                    onClick={handleExportApkg}
                    type="button"
                  >
                    Download APKG
                    <span>Anki package</span>
                  </button>
                  <button
                    className="button-secondary"
                    disabled={state.cards.length === 0}
                    onClick={() => handleExportText('csv')}
                    type="button"
                  >
                    Download CSV
                  </button>
                  <button
                    className="button-secondary"
                    disabled={state.cards.length === 0}
                    onClick={() => handleExportText('txt')}
                    type="button"
                  >
                    Download TXT
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="surface empty-deck">
              <div className="empty-deck-visual" aria-hidden="true">
                <span />
                <span />
                <span>?</span>
              </div>
              <p className="eyebrow">A fresh start</p>
              <h2>This deck is empty.</h2>
              <p className="muted">
                Add a card manually or generate a complete set from the Create page.
              </p>
              <div className="cluster empty-deck-actions">
                <Link className="button button-primary" to="/input">
                  Generate cards <span aria-hidden="true">→</span>
                </Link>
                <button className="button-secondary" onClick={addCard} type="button">
                  Add a blank card
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
