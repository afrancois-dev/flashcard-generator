import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'

import {
  type InputMode,
  validateSourceInput,
} from '../input/input-validation'
import { extractUploadedDocument } from '../server/upload'
import { extractSourceUrl } from '../server/url-extraction'
import { generateCards } from '../server/generation'
import { saveCardCollection } from '../server/card-persistence'

export const Route = createFileRoute('/input')({
  component: InputPage,
})

function InputPage() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<InputMode>('text')
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [fileStatus, setFileStatus] = useState<string | null>(null)
  const [sourceUrl, setSourceUrl] = useState('')
  const [urlStatus, setUrlStatus] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const validationError = validateSourceInput(mode, value)
    setError(validationError)
    if (validationError) return

    setBusy(true)
    try {
      const collection = await generateCards({
        data: {
          source: { mode, content: value },
          cardTypes: ['basic', 'cloze'],
          requestedCount: 10,
        },
      })
      await saveCardCollection({
        data: { id: 'default', collection },
      })
      await navigate({ to: '/decks' })
    } catch (generationError) {
      setError(
        generationError instanceof Error
          ? generationError.message
          : 'Could not generate cards from this input.',
      )
    } finally {
      setBusy(false)
    }
  }

  async function handleFileChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0]
    if (!file) return

    setBusy(true)
    setFileStatus(`Extracting text from ${file.name}...`)
    try {
      const data = Array.from(new Uint8Array(await file.arrayBuffer()))
      const extractedText = await extractUploadedDocument({
        data: { name: file.name, mimeType: file.type, data },
      })
      setMode('text')
      setValue(extractedText)
      setFileStatus(`Loaded text from ${file.name}.`)
      setError(null)
    } catch (fileError) {
      setFileStatus(
        fileError instanceof Error
          ? fileError.message
          : 'Could not extract text from the selected file.',
      )
    } finally {
      setBusy(false)
    }
  }

  async function handleUrlSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setUrlStatus('Fetching page text...')
    try {
      const extractedText = await extractSourceUrl({ data: { url: sourceUrl } })
      setMode('text')
      setValue(extractedText)
      setUrlStatus('Loaded text from the page.')
      setError(null)
    } catch (urlError) {
      setUrlStatus(
        urlError instanceof Error
          ? urlError.message
          : 'Could not extract text from the URL.',
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <section aria-busy={busy} className="page input-page">
      <div className="page-header input-page-header">
        <p className="eyebrow">Step 01 · Add your source</p>
        <h1>What would you like to remember?</h1>
        <p>
          Share your material or describe a topic. We&apos;ll turn it into a deck
          you can review, refine, and make your own.
        </p>
      </div>

      <div className="source-layout">
        <form className="surface source-form" onSubmit={handleSubmit} noValidate>
          <div className="source-form-heading">
            <div>
              <span className="source-step">01</span>
              <div>
                <h2>Start with your material</h2>
                <p>Paste text directly or give the AI a creative brief.</p>
              </div>
            </div>
            <span className="ai-badge">
              <svg aria-hidden="true" viewBox="0 0 24 24">
                <path d="m12 3 1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7Z" />
              </svg>
              AI guided
            </span>
          </div>

          <fieldset className="mode-selector">
            <legend>Choose an input mode</legend>
            <div className="mode-options">
              <label className="mode-option">
                <input
                  checked={mode === 'text'}
                  name="mode"
                  onChange={() => {
                    setMode('text')
                    setError(null)
                  }}
                  type="radio"
                  value="text"
                />
                <span className="mode-option-icon">
                  <svg aria-hidden="true" viewBox="0 0 24 24">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
                    <path d="M14 2v6h6M8 13h8m-8 4h5" />
                  </svg>
                </span>
                <span>
                  <strong>Source text</strong>
                  <small>Notes or an excerpt</small>
                </span>
              </label>
              <label className="mode-option">
                <input
                  checked={mode === 'prompt'}
                  name="mode"
                  onChange={() => {
                    setMode('prompt')
                    setError(null)
                  }}
                  type="radio"
                  value="prompt"
                />
                <span className="mode-option-icon">
                  <svg aria-hidden="true" viewBox="0 0 24 24">
                    <path d="m12 3 1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7Z" />
                    <path d="m19 16 .8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8Z" />
                  </svg>
                </span>
                <span>
                  <strong>Prompt only</strong>
                  <small>Describe your topic</small>
                </span>
              </label>
            </div>
          </fieldset>

          <div className="field-group source-input-group">
            <div className="field-label-row">
              <label htmlFor="source-input">
                {mode === 'text' ? 'Source text' : 'Generation prompt'}
              </label>
              <span>{value.length.toLocaleString()} characters</span>
            </div>
            <textarea
              aria-describedby={error ? 'source-input-error' : 'source-input-help'}
              id="source-input"
              onChange={(event) => {
                setValue(event.target.value)
                setError(null)
              }}
              placeholder={
                mode === 'text'
                  ? 'Paste your notes or an article excerpt here…'
                  : 'e.g. Create beginner-friendly cards about the French Revolution, focusing on key dates and people…'
              }
              rows={12}
              value={value}
            />
            <p className="help-text" id="source-input-help">
              {mode === 'text'
                ? 'A focused excerpt works best. You can review every card before exporting.'
                : 'Include the audience, detail level, or topics you want the deck to cover.'}
            </p>
          </div>
          {error ? (
            <p className="field-error" id="source-input-error" role="alert">
              {error}
            </p>
          ) : null}
          <div className="source-form-actions">
            <span>
              <svg aria-hidden="true" viewBox="0 0 24 24">
                <path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z" />
                <path d="M12 16v-4m0-4h.01" />
              </svg>
              10 cards per generation
            </span>
            <button className="button-primary generate-button" disabled={busy} type="submit">
              {busy ? 'Creating your deck…' : 'Generate my deck'}
              {!busy ? (
                <svg aria-hidden="true" viewBox="0 0 24 24">
                  <path d="M5 12h14m-6-6 6 6-6 6" />
                </svg>
              ) : null}
            </button>
          </div>
        </form>

        <aside className="source-aside">
          <div className="surface source-alternatives">
            <div className="source-aside-heading">
              <span className="source-step">02</span>
              <div>
                <h2>Or import a source</h2>
                <p>Already have the material? Bring it along.</p>
              </div>
            </div>

            <div className="field-group upload-group">
              <label htmlFor="source-file">Upload a document</label>
              <div className="upload-control">
                <svg aria-hidden="true" viewBox="0 0 24 24">
                  <path d="M12 16V4m-5 5 5-5 5 5M5 20h14a2 2 0 0 0 2-2v-3M3 15v3a2 2 0 0 0 2 2" />
                </svg>
                <input
                  accept=".pdf,.txt,.md,.docx,application/pdf,text/plain,text/markdown,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  disabled={busy}
                  id="source-file"
                  onChange={handleFileChange}
                  type="file"
                />
              </div>
              <p className="help-text">PDF, TXT, MD, or DOCX</p>
              {fileStatus ? (
                <p className="status" role="status">
                  {fileStatus}
                </p>
              ) : null}
            </div>

            <div className="source-divider">
              <span>or</span>
            </div>

            <form className="stack url-form" onSubmit={handleUrlSubmit}>
              <div className="field-group">
                <label htmlFor="source-url">Load a web page</label>
                <input
                  id="source-url"
                  onChange={(event) => setSourceUrl(event.target.value)}
                  placeholder="https://example.com/article"
                  type="url"
                  value={sourceUrl}
                />
                <p className="help-text">Use a public HTTP(S) article URL.</p>
              </div>
              <button className="button-secondary" disabled={busy} type="submit">
                <svg aria-hidden="true" viewBox="0 0 24 24">
                  <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" />
                  <path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" />
                </svg>
                Load page text
              </button>
            </form>
            {urlStatus ? (
              <p className="status" role="status">
                {urlStatus}
              </p>
            ) : null}
          </div>

          <div className="source-tip">
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <path d="M9 18h6m-5 3h4m3-11a6 6 0 1 0-10 4.5V16h10v-1.5A6 6 0 0 0 17 10Z" />
            </svg>
            <div>
              <strong>A little context goes a long way.</strong>
              <p>Clear source material leads to more focused, useful cards.</p>
            </div>
          </div>
        </aside>
      </div>
    </section>
  )
}
