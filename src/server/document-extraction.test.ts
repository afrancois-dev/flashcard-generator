import { describe, expect, it } from 'vitest'

import {
  DocumentExtractionError,
  extractDocumentText,
} from './document-extraction'

describe('extractDocumentText', () => {
  it('extracts and normalizes plain text', async () => {
    await expect(
      extractDocumentText({
        name: 'notes.txt',
        mimeType: 'text/plain',
        data: new TextEncoder().encode('  First line\r\nSecond line  '),
      }),
    ).resolves.toBe('First line\nSecond line')
  })

  it('rejects unsupported documents explicitly', async () => {
    await expect(
      extractDocumentText({
        name: 'notes.csv',
        mimeType: 'text/csv',
        data: new TextEncoder().encode('question,answer'),
      }),
    ).rejects.toThrow(DocumentExtractionError)
  })
})
