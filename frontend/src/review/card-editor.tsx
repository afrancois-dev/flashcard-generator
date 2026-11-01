import { useState } from 'react'

import { cardSchema, type Card } from '../domain/cards'
import { refineCard } from '../server/refinement'

type CardEditorProps = {
  card: Card
  onDelete: () => void
  onSave: (card: Card) => void
}

export function CardEditor({ card, onDelete, onSave }: CardEditorProps) {
  const [draft, setDraft] = useState<Card>(card)
  const [error, setError] = useState<string | null>(null)
  const [instruction, setInstruction] = useState('')
  const [refining, setRefining] = useState(false)

  function updateDraft(changes: Partial<Card>) {
    setDraft((current) => ({ ...current, ...changes }) as Card)
    setError(null)
  }

  function handleSave() {
    const result = cardSchema.safeParse(draft)
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? 'Card is invalid.')
      return
    }

    onSave(result.data)
  }

  async function handleRefine() {
    if (!instruction.trim()) {
      setError('Enter an instruction before refining this card.')
      return
    }

    setRefining(true)
    setError(null)
    try {
      const result = await refineCard({ data: { card: draft, instruction } })
      setDraft(result.card)
      onSave(result.card)
      setInstruction('')
    } catch (refinementError) {
      setError(
        refinementError instanceof Error
          ? refinementError.message
          : 'Could not refine this card.',
      )
    } finally {
      setRefining(false)
    }
  }

  return (
    <article className="surface editor-card">
      <span className="card-type">{card.type === 'basic' ? 'Basic card' : 'Cloze card'}</span>
      <label htmlFor={`${card.id}-content`}>
        {card.type === 'basic' ? 'Front' : 'Cloze text'}
      </label>
      <textarea
        aria-invalid={Boolean(error)}
        id={`${card.id}-content`}
        onChange={(event) =>
          updateDraft(
            card.type === 'basic'
              ? { front: event.target.value }
              : { text: event.target.value },
          )
        }
        rows={3}
        value={card.type === 'basic' ? draft.front : draft.text}
      />
      {card.type === 'basic' ? (
        <>
          <label htmlFor={`${card.id}-back`}>Back</label>
          <textarea aria-invalid={Boolean(error)}
            id={`${card.id}-back`}
            onChange={(event) => updateDraft({ back: event.target.value })}
            rows={3}
            value={draft.back}
          />
        </>
      ) : null}
      <label htmlFor={`${card.id}-tags`}>Tags</label>
      <input
        id={`${card.id}-tags`}
        onChange={(event) =>
          updateDraft({
            tags: event.target.value
              .split(',')
              .map((tag) => tag.trim())
              .filter(Boolean),
          })
        }
        value={draft.tags.join(', ')}
      />
      {error ? <p className="field-error" role="alert">{error}</p> : null}
      <label htmlFor={`${card.id}-instruction`}>AI refinement</label>
      <input
        id={`${card.id}-instruction`}
        onChange={(event) => setInstruction(event.target.value)}
        placeholder="Make the answer more concise"
        value={instruction}
      />
      <button className="button-secondary" disabled={refining} onClick={handleRefine} type="button">
        {refining ? 'Refining...' : 'Refine with AI'}
      </button>
      <button className="button-primary" onClick={handleSave} type="button">
        Save card
      </button>
      <button className="button-danger" onClick={onDelete} type="button">
        Delete card
      </button>
    </article>
  )
}
