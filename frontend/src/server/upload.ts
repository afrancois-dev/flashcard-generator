import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

import { extractDocumentWithFastApi } from './fastapi-client'
import { MAX_UPLOAD_BYTES } from './limits'

const uploadedDocumentSchema = z.object({
  name: z.string().trim().min(1),
  mimeType: z.string(),
  data: z.array(z.number().int().min(0).max(255)),
}).superRefine((document, context) => {
  if (document.data.length > MAX_UPLOAD_BYTES) {
    context.addIssue({
      code: 'custom',
      path: ['data'],
      message: `Files must be ${MAX_UPLOAD_BYTES.toLocaleString()} bytes or smaller.`,
    })
  }
})

export const extractUploadedDocument = createServerFn({ method: 'POST' })
  .validator((input: unknown) => uploadedDocumentSchema.parse(input))
  .handler(({ data }) =>
    extractDocumentWithFastApi({
      name: data.name,
      mimeType: data.mimeType,
      data: data.data,
    }),
  )
