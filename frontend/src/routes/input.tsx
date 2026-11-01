import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'

import {
  type InputMode,
  validateSourceInput,
} from '../input/input-validation'
import { extractUploadedDocument } from '../server/upload'
import { extractSourceUrl } from '../server/url-extraction'

export const Route = createFileRoute('/input')({
  component: InputPage,
})

function InputPage() {
  const [mode, setMode] = useState<InputMode>('text')
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [fileStatus, setFileStatus] = useState<string | null>(null)
  const [sourceUrl, setSourceUrl] = useState('')
  const [urlStatus, setUrlStatus] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const validationError = validateSourceInput(mode, value)
    setError(validationError)
    setSubmitted(!validationError)
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
      setSubmitted(false)
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
      setSubmitted(false)
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
    <section aria-busy={busy} className="page page-narrow">
      <div className="page-header">
        <h1>Source input</h1>
        <p>Provide source material or a prompt to create flashcards.</p>
      </div>
      <div className="stack stack-lg">
      <form className="surface stack" onSubmit={handleSubmit} noValidate>
        <fieldset>
          <legend>Input mode</legend>
          <label>
            <input
              checked={mode === 'text'}
              name="mode"
              onChange={() => {
                setMode('text')
                setError(null)
                setSubmitted(false)
              }}
              type="radio"
              value="text"
            />
            Source text
          </label>
          <label>
            <input
              checked={mode === 'prompt'}
              name="mode"
              onChange={() => {
                setMode('prompt')
                setError(null)
                setSubmitted(false)
              }}
              type="radio"
              value="prompt"
            />
            Prompt only
          </label>
        </fieldset>
        <label htmlFor="source-input">
          {mode === 'text' ? 'Source text' : 'Generation prompt'}
        </label>
        <textarea
          aria-describedby={error ? 'source-input-error' : 'source-input-help'}
          id="source-input"
          onChange={(event) => {
            setValue(event.target.value)
            setError(null)
            setSubmitted(false)
          }}
          placeholder={
            mode === 'text'
              ? 'Paste notes or an article excerpt here.'
              : 'Describe the flashcards you want to create.'
          }
          rows={10}
          value={value}
        />
        <p className="help-text" id="source-input-help">
          {mode === 'text'
            ? 'Use source text for notes or excerpts.'
            : 'Use prompt-only mode to generate cards from an instruction.'}
        </p>
        {error ? (
          <p className="field-error" id="source-input-error" role="alert">
            {error}
          </p>
        ) : null}
        {submitted ? (
          <p className="status status-success" role="status">Ready to generate cards from this input.</p>
        ) : null}
        <button className="button-primary" disabled={busy} type="submit">
          Continue to generation
        </button>
      </form>
      <div className="surface stack">
      <div className="field-group">
      <label htmlFor="source-file">Upload a document</label>
      <input
        accept=".pdf,.txt,.md,.docx,application/pdf,text/plain,text/markdown,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        id="source-file"
        onChange={handleFileChange}
        disabled={busy}
        type="file"
      />
      {fileStatus ? <p className="status" role="status">{fileStatus}</p> : null}
      </div>
      <form className="stack" onSubmit={handleUrlSubmit}>
        <label htmlFor="source-url">Web page URL</label>
        <input
          id="source-url"
          onChange={(event) => setSourceUrl(event.target.value)}
          placeholder="https://example.com/article"
          type="url"
          value={sourceUrl}
        />
        <button className="button-secondary" disabled={busy} type="submit">
          Load page text
        </button>
      </form>
      {urlStatus ? <p className="status" role="status">{urlStatus}</p> : null}
      </div>
      </div>
    </section>
  )
}
