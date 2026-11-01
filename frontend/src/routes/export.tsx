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
    <section className="page page-narrow">
      <div className="page-header">
        <h1>Export</h1>
        <p>Reviewed cards can be exported as Anki or text files here.</p>
      </div>
      <div className="surface stack">
      <p className="muted">No reviewed cards are currently loaded.</p>
      <div className="cluster">
      <button className="button-secondary" onClick={() => exportEmpty('csv')} type="button">
        Download CSV
      </button>
      <button className="button-secondary" onClick={() => exportEmpty('txt')} type="button">
        Download TXT
      </button>
      <button className="button-primary" onClick={exportApkg} type="button">
        Download APKG
      </button>
      </div>
      {status ? <p className="status" role="status">{status}</p> : null}
      </div>
    </section>
  )
}
