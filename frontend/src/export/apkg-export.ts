import initSqlJs from 'sql.js'
import AnkiExport from 'anki-apkg-export'
import wasmUrl from 'sql.js/dist/sql-wasm-browser.wasm?url'

import type { CardCollection } from '../domain/cards'

type ApkgDeck = {
  addCard: (
    front: string,
    back: string,
    options: { noteId: string; tags: string[] },
  ) => void
  addCloze: (
    text: string,
    extra: undefined,
    options: { noteId: string; tags: string[] },
  ) => void
}

export function exportCardsToDeck(deck: ApkgDeck, collection: CardCollection): void {
  for (const card of collection.cards) {
    if (card.type === 'basic') {
      deck.addCard(card.front, card.back, {
        noteId: card.id,
        tags: card.tags,
      })
    } else {
      deck.addCloze(card.text, undefined, {
        noteId: card.id,
        tags: card.tags,
      })
    }
  }
}

export async function createApkgBlob(
  collection: CardCollection,
  deckName = 'Flashcard Generator',
): Promise<Blob> {
  const sql = await initSqlJs({ locateFile: () => wasmUrl })
  const deck = await AnkiExport.create(deckName, { sql })

  try {
    exportCardsToDeck(deck, collection)
    return await deck.save({ type: 'blob' })
  } finally {
    deck.close()
  }
}

export function downloadApkg(blob: Blob, filename = 'flashcards.apkg'): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.download = filename
  link.href = url
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}
