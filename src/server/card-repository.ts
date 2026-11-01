import Database from 'better-sqlite3'
import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'

import { cardCollectionSchema, type CardCollection } from '../domain/cards'

export class CardRepository {
  private readonly database: Database.Database

  constructor(filename: string) {
    mkdirSync(dirname(filename), { recursive: true })
    this.database = new Database(filename)
    this.database.pragma('foreign_keys = ON')
    this.database.exec(`
      CREATE TABLE IF NOT EXISTS collections (
        id TEXT PRIMARY KEY,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS cards (
        id TEXT NOT NULL,
        collection_id TEXT NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
        type TEXT NOT NULL CHECK (type IN ('basic', 'cloze')),
        front TEXT,
        back TEXT,
        text TEXT,
        tags TEXT NOT NULL,
        PRIMARY KEY (collection_id, id)
      );
    `)
  }

  save(id: string, collection: CardCollection): void {
    const parsed = cardCollectionSchema.parse(collection)
    const now = new Date().toISOString()
    const transaction = this.database.transaction(() => {
      this.database
        .prepare(
          `INSERT INTO collections (id, created_at, updated_at)
           VALUES (?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET updated_at = excluded.updated_at`,
        )
        .run(id, now, now)
      this.database.prepare('DELETE FROM cards WHERE collection_id = ?').run(id)
      const insert = this.database.prepare(
        `INSERT INTO cards (id, collection_id, type, front, back, text, tags)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      for (const card of parsed.cards) {
        insert.run(
          card.id,
          id,
          card.type,
          card.type === 'basic' ? card.front : null,
          card.type === 'basic' ? card.back : null,
          card.type === 'cloze' ? card.text : null,
          JSON.stringify(card.tags),
        )
      }
    })
    transaction()
  }

  load(id: string): CardCollection | null {
    const rows = this.database
      .prepare(
        `SELECT id, type, front, back, text, tags
         FROM cards WHERE collection_id = ? ORDER BY rowid`,
      )
      .all(id) as Array<{
      id: string
      type: 'basic' | 'cloze'
      front: string | null
      back: string | null
      text: string | null
      tags: string
    }>

    if (rows.length === 0) return null

    return cardCollectionSchema.parse({
      cards: rows.map((row) =>
        row.type === 'basic'
          ? {
              id: row.id,
              type: row.type,
              front: row.front ?? '',
              back: row.back ?? '',
              tags: JSON.parse(row.tags),
            }
          : {
              id: row.id,
              type: row.type,
              text: row.text ?? '',
              tags: JSON.parse(row.tags),
            },
      ),
    })
  }

  close(): void {
    this.database.close()
  }
}

let repository: CardRepository | undefined

export function getCardRepository(): CardRepository {
  repository ??= new CardRepository(
    process.env.CARD_DB_PATH ?? './data/flashcards.db',
  )
  return repository
}
