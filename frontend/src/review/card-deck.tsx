import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from 'react'

import type { Card } from '../domain/cards'

type CardDeckProps = {
  cards: Card[]
}

const SWIPE_THRESHOLD = 72
const SWIPE_EXIT_DISTANCE = 560

function ClozePreview({ revealed, text }: { revealed: boolean; text: string }) {
  return text.split(/({{c\d+::[^{}]+}})/g).map((part, index) => {
    const deletion = part.match(/^{{c\d+::([^{}]+)}}$/)
    if (!deletion) return part

    return (
      <mark className={revealed ? 'cloze-answer' : 'cloze-gap'} key={index}>
        {revealed ? deletion[1] : '[ … ]'}
      </mark>
    )
  })
}

function CardContent({ card, revealed }: { card: Card; revealed: boolean }) {
  let content: ReactNode

  if (card.type === 'basic') {
    content = revealed ? card.back : card.front
  } else {
    content = <ClozePreview revealed={revealed} text={card.text} />
  }

  return (
    <div className="study-card-reveal" key={revealed ? 'answer' : 'question'}>
      <p className="study-card-kicker">{revealed ? 'Answer' : 'Question'}</p>
      <p className="study-card-content">{content}</p>
    </div>
  )
}

export function CardDeck({ cards }: CardDeckProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [dragX, setDragX] = useState(0)
  const [exitX, setExitX] = useState(0)
  const pointerStart = useRef<number | null>(null)
  const exitTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setActiveIndex((current) => Math.min(current, Math.max(cards.length - 1, 0)))
    setRevealed(false)
    setDragX(0)
    setExitX(0)
  }, [cards.length])

  useEffect(
    () => () => {
      if (exitTimer.current) clearTimeout(exitTimer.current)
    },
    [],
  )

  if (cards.length === 0) return null

  const visibleCards = Array.from(
    { length: Math.min(3, cards.length) },
    (_, depth) => ({
      card: cards[(activeIndex + depth) % cards.length],
      depth,
    }),
  ).reverse()

  function goToCard(index: number) {
    if (exitTimer.current) clearTimeout(exitTimer.current)
    setActiveIndex((index + cards.length) % cards.length)
    setRevealed(false)
    setDragX(0)
    setExitX(0)
    pointerStart.current = null
  }

  function swipe(direction: -1 | 1) {
    if (cards.length < 2 || exitX !== 0) return

    setDragX(0)
    setExitX(-direction * SWIPE_EXIT_DISTANCE)
    pointerStart.current = null
    exitTimer.current = setTimeout(() => {
      goToCard(activeIndex + direction)
    }, 180)
  }

  function handlePointerDown(event: PointerEvent<HTMLElement>) {
    if (exitX !== 0 || !event.isPrimary) return
    pointerStart.current = event.clientX
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function handlePointerMove(event: PointerEvent<HTMLElement>) {
    if (pointerStart.current === null) return
    setDragX(event.clientX - pointerStart.current)
  }

  function handlePointerUp(event: PointerEvent<HTMLElement>) {
    if (pointerStart.current === null) return
    const distance = event.clientX - pointerStart.current
    pointerStart.current = null

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }

    if (Math.abs(distance) >= SWIPE_THRESHOLD && cards.length > 1) {
      swipe(distance > 0 ? -1 : 1)
      return
    }

    setDragX(0)
    if (Math.abs(distance) < 8) setRevealed((current) => !current)
  }

  function handlePointerCancel() {
    pointerStart.current = null
    setDragX(0)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === 'ArrowRight') {
      event.preventDefault()
      swipe(1)
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault()
      swipe(-1)
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      setRevealed((current) => !current)
    }
  }

  const cardPosition = exitX || dragX

  return (
    <section aria-labelledby="deck-preview-heading" className="deck-viewer">
      <div className="deck-heading">
        <div>
          <p className="eyebrow">Interactive deck</p>
          <h2 id="deck-preview-heading">Ready when you are.</h2>
        </div>
        <p aria-live="polite" className="deck-count">
          <strong>{String(activeIndex + 1).padStart(2, '0')}</strong>
          <span>/ {String(cards.length).padStart(2, '0')}</span>
        </p>
      </div>

      <p className="deck-instruction" id="deck-instruction">
        Swipe to browse, then tap the card to reveal the answer.
      </p>

      <div className="deck-stage">
        {visibleCards.map(({ card, depth }) => {
          const isActive = depth === 0
          const isCurrentFace = isActive && revealed

          return (
            <article
              aria-describedby={isActive ? 'deck-instruction' : undefined}
              aria-hidden={!isActive}
              aria-label={
                isActive
                  ? `Card ${activeIndex + 1} of ${cards.length}. ${isCurrentFace ? 'Answer shown' : 'Question shown'}. Press Enter to flip.`
                  : undefined
              }
              className={`study-card study-card-depth-${depth}${isActive ? ' study-card-active' : ''}${exitX && isActive ? ' study-card-exiting' : ''}`}
              key={card.id}
              onKeyDown={isActive ? handleKeyDown : undefined}
              onPointerCancel={isActive ? handlePointerCancel : undefined}
              onPointerDown={isActive ? handlePointerDown : undefined}
              onPointerMove={isActive ? handlePointerMove : undefined}
              onPointerUp={isActive ? handlePointerUp : undefined}
              role={isActive ? 'button' : undefined}
              style={
                isActive && cardPosition
                  ? {
                      transform: `translateX(${cardPosition}px) rotate(${cardPosition / 32}deg)`,
                    }
                  : undefined
              }
              tabIndex={isActive ? 0 : -1}
            >
              <div className="study-card-topline">
                <span className="study-card-type">
                  {card.type === 'basic' ? 'Basic card' : 'Cloze card'}
                </span>
                <span className="study-card-face">
                  {isCurrentFace ? 'Back' : 'Front'}
                </span>
              </div>
              <CardContent card={card} revealed={isCurrentFace} />
              <div className="study-card-footer">
                <div className="study-card-tags">
                  {card.tags.slice(0, 3).map((tag) => (
                    <span key={tag}>#{tag}</span>
                  ))}
                </div>
                <span className="study-card-flip-hint">
                  {isCurrentFace ? 'Tap for question' : 'Tap for answer'}
                  <svg aria-hidden="true" viewBox="0 0 24 24">
                    <path d="M20 11a8 8 0 0 0-14.9-4M4 4v4h4m-4 2a8 8 0 0 0 14.9 4m.1 6v-4h-4" />
                  </svg>
                </span>
              </div>
            </article>
          )
        })}
      </div>

      <div className="deck-controls">
        <button
          aria-label="Previous card"
          className="button-secondary deck-control"
          disabled={cards.length < 2 || exitX !== 0}
          onClick={() => swipe(-1)}
          type="button"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <path d="m15 18-6-6 6-6" />
          </svg>
          Previous
        </button>
        <button
          className="button-primary deck-reveal-button"
          onClick={() => setRevealed((current) => !current)}
          type="button"
        >
          {revealed ? 'Show question' : 'Reveal answer'}
        </button>
        <button
          aria-label="Next card"
          className="button-secondary deck-control"
          disabled={cards.length < 2 || exitX !== 0}
          onClick={() => swipe(1)}
          type="button"
        >
          Next
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <path d="m9 18 6-6-6-6" />
          </svg>
        </button>
      </div>

      {cards.length > 1 ? (
        <div aria-label="Choose a card" className="deck-pagination" role="group">
          {cards.map((card, index) => (
            <button
              aria-current={index === activeIndex ? 'true' : undefined}
              aria-label={`Go to card ${index + 1}`}
              className="deck-pagination-dot"
              key={card.id}
              onClick={() => goToCard(index)}
              type="button"
            />
          ))}
        </div>
      ) : null}
    </section>
  )
}
