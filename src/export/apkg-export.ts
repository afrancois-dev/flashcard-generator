import AnkiExport from 'anki-apkg-export'
import wasmUrl from 'anki-apkg-export/sql-wasm.wasm?url'

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
  locateFile: () => string = () => wasmUrl,
): Promise<Blob> {
  const deck = await AnkiExport.create(deckName, {
    locateFile,
  })

  try {
    exportCardsToDeck(deck, collection)
    return await deck.save({ type: 'blob' })
  } finally {
    deck.close()
  }
}

export function downloadApkg(blob: Blob, filename = 'flashcards.apkg'): void {
  const link = document.createElement('a')
  link.download = filename
  link.href = URL.createObjectURL(blob)
  link.click()
  URL.revokeObjectURL(link.href)
}
