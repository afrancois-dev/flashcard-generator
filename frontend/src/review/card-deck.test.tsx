import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import type { Card } from '../domain/cards'
import { CardDeck } from './card-deck'

const cards: Card[] = [
  {
    id: 'card-1',
    type: 'basic',
    front: 'What does photosynthesis convert?',
    back: 'Light energy into chemical energy.',
    tags: ['biology'],
  },
  {
    id: 'card-2',
    type: 'cloze',
    text: 'Water freezes at {{c1::0°C}}.',
    tags: ['science'],
  },
]

describe('CardDeck', () => {
  it('renders an accessible, swipeable card deck', () => {
    const markup = renderToStaticMarkup(<CardDeck cards={cards} />)

    expect(markup).toContain('Interactive deck')
    expect(markup).toContain('Swipe to browse')
    expect(markup).toContain('What does photosynthesis convert?')
    expect(markup).toContain('Card 1 of 2')
    expect(markup).toContain('Reveal answer')
    expect(markup).toContain('Previous card')
    expect(markup).toContain('Next card')
    expect(markup).toContain('Go to card 2')
  })

  it('renders nothing for an empty collection', () => {
    expect(renderToStaticMarkup(<CardDeck cards={[]} />)).toBe('')
  })
})
