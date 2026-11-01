import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'

import { downloadTextFile, serializeCsv, serializeTxt } from '../export/text-export'
import { createApkgBlob, downloadApkg } from '../export/apkg-export'

export const Route = createFileRoute('/export')({
  component: ExportPage,
})

function ExportPage() {
  const [status, setStatus] = useState<string | null>(null)

  function exportEmpty(format: 'csv' | 'txt') {
    const content =
      format === 'csv'
        ? serializeCsv({ cards: [] })
        : serializeTxt({ cards: [] })
    downloadTextFile(
      content,
      `flashcards.${format}`,
      format === 'csv' ? 'text/csv' : 'text/plain',
    )
    setStatus(`Downloaded ${format.toUpperCase()} export.`)
  }

  async function exportApkg() {
    setStatus('Building APKG export...')
    try {
      const blob = await createApkgBlob({ cards: [] })
      downloadApkg(blob)
      setStatus('Downloaded APKG export.')
    } catch (exportError) {
      setStatus(
        exportError instanceof Error
          ? exportError.message
          : 'Could not create APKG export.',
      )
    }
  }

  return (
    <section>
      <h1>Export</h1>
      <p>Reviewed cards can be exported as Anki or text files here.</p>
      <p>No reviewed cards are currently loaded.</p>
      <button onClick={() => exportEmpty('csv')} type="button">
        Download CSV
      </button>
      <button onClick={() => exportEmpty('txt')} type="button">
        Download TXT
      </button>
      <button onClick={exportApkg} type="button">
        Download APKG
      </button>
      {status ? <p role="status">{status}</p> : null}
    </section>
  )
}
