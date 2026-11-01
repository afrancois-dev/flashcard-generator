import { MAX_SOURCE_CHARS } from '../server/limits'

export type InputMode = 'text' | 'prompt'

export function validateSourceInput(mode: InputMode, value: string): string | null {
  if (!value.trim()) {
    return mode === 'text'
      ? 'Paste source text before continuing.'
      : 'Enter a prompt before continuing.'
  }

  if (value.length > MAX_SOURCE_CHARS) {
    return `Input must be ${MAX_SOURCE_CHARS.toLocaleString()} characters or fewer.`
  }

  return null
}
