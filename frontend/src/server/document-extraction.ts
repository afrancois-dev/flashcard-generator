import { PDFParse } from 'pdf-parse'
import mammoth from 'mammoth'

export type UploadedDocument = {
  name: string
  mimeType: string
  data: Uint8Array
}

export class DocumentExtractionError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'DocumentExtractionError'
  }
}

function normalizeText(text: string): string {
  const normalized = text.replace(/\r\n/g, '\n').trim()

  if (!normalized) {
    throw new DocumentExtractionError('The document did not contain readable text.')
  }

  return normalized
}

export async function extractDocumentText(
  document: UploadedDocument,
): Promise<string> {
  const extension = document.name.split('.').pop()?.toLowerCase()

  try {
    if (
      document.mimeType === 'text/plain' ||
      document.mimeType === 'text/markdown' ||
      extension === 'txt' ||
      extension === 'md'
    ) {
      return normalizeText(new TextDecoder().decode(document.data))
    }

    if (document.mimeType === 'application/pdf' || extension === 'pdf') {
      const parser = new PDFParse({ data: document.data })
      const result = await parser.getText()
      await parser.destroy()
      return normalizeText(result.text)
    }

    if (
      document.mimeType ===
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      extension === 'docx'
    ) {
      const result = await mammoth.extractRawText({
        arrayBuffer: document.data.buffer.slice(
          document.data.byteOffset,
          document.data.byteOffset + document.data.byteLength,
        ),
      })
      return normalizeText(result.value)
    }
  } catch (error) {
    if (error instanceof DocumentExtractionError) {
      throw error
    }

    throw new DocumentExtractionError(
      `Could not extract readable text from ${document.name}.`,
    )
  }

  throw new DocumentExtractionError(
    `Unsupported document type for ${document.name}.`,
  )
}
