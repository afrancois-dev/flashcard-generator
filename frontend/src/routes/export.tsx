import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'

import {
  downloadTextFile,
  serializeCsv,
  serializeTxt,
} from '../export/text-export'
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
    <section className="page page-narrow export-page">
      <div className="page-header">
        <p className="eyebrow">Step 03 · Take your deck anywhere</p>
        <h1>Ready for your next study session.</h1>
        <p>Choose the format that fits the way you like to learn.</p>
      </div>
      <div className="surface export-panel">
        <div className="export-panel-heading">
          <span className="export-icon">
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <path d="M12 3v12m-5-5 5 5 5-5M5 21h14a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2" />
            </svg>
          </span>
          <div>
            <h2>Export your cards</h2>
            <p className="muted">No reviewed cards are currently loaded.</p>
          </div>
        </div>
        <div className="export-options">
          <button className="button-primary" onClick={exportApkg} type="button">
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <rect height="16" rx="2" width="18" x="3" y="4" />
              <path d="M7 8h10M7 12h6m-6 4h4" />
            </svg>
            Download APKG
            <span>Anki package</span>
          </button>
          <button
            className="button-secondary"
            onClick={() => exportEmpty('csv')}
            type="button"
          >
            Download CSV
          </button>
          <button
            className="button-secondary"
            onClick={() => exportEmpty('txt')}
            type="button"
          >
            Download TXT
          </button>
        </div>
        <p className="help-text">
          APKG opens directly in Anki. CSV and TXT are lightweight alternatives
          for other study tools.
        </p>
      </div>
      {status ? (
        <p className="status" role="status">
          {status}
        </p>
      ) : null}
    </section>
  )
}
