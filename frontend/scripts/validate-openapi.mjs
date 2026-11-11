import { readFile } from 'node:fs/promises'
import { load } from 'js-yaml'

const source = await readFile(
  new URL('../../backend/openapi.yaml', import.meta.url),
  'utf8',
)
const document = load(source)

if (!document || typeof document !== 'object' || Array.isArray(document)) {
  throw new Error('openapi.yaml must contain an object document')
}

if (typeof document.openapi !== 'string' || !/^3\./.test(document.openapi)) {
  throw new Error('openapi.yaml must declare an OpenAPI 3.x version')
}

if (!document.info || typeof document.info !== 'object') {
  throw new Error('openapi.yaml must declare info metadata')
}

if (
  !Array.isArray(document.servers) ||
  !document.servers.some((server) => server?.url === 'http://localhost:8000')
) {
  throw new Error('openapi.yaml must declare the localhost FastAPI server')
}

const paths = document.paths
if (!paths || typeof paths !== 'object' || Array.isArray(paths)) {
  throw new Error('openapi.yaml must declare paths')
}
if (
  !paths['/health'] ||
  !paths['/api/v1/flashcards/generate'] ||
  !paths['/api/v1/flashcards/refine'] ||
  !paths['/api/v1/flashcards/refine/bulk'] ||
  !paths['/api/v1/collections/{collection_id}'] ||
  !paths['/api/v1/sources/url']
) {
  throw new Error('openapi.yaml must document all FastAPI backend contracts')
}

const health = paths['/health']
if (!health.get || typeof health.get !== 'object') {
  throw new Error('openapi.yaml must document GET /health')
}
if (!health.get.responses?.['200'] || !health.get.responses?.['500']) {
  throw new Error('GET /health must document 200 and 500 responses')
}

const components = document.components
if (!components || typeof components !== 'object') {
  throw new Error('openapi.yaml must declare reusable components')
}

const healthSchema = components.schemas?.HealthResponse
const errorSchema = components.schemas?.ErrorResponse
if (!healthSchema || !errorSchema) {
  throw new Error('openapi.yaml must define Health and Error schemas')
}
for (const property of ['status', 'service', 'correlation_id']) {
  if (!healthSchema.required?.includes(property) || !healthSchema.properties?.[property]) {
    throw new Error(`Health schema is missing required property: ${property}`)
  }
}
if (
  !errorSchema.required?.includes('error') ||
  !errorSchema.required?.includes('message') ||
  !errorSchema.required?.includes('correlation_id')
) {
  throw new Error('Error schema must define an error envelope')
}

if (
  health.get.parameters?.[0]?.name !== 'X-Correlation-ID' ||
  health.get.parameters?.[0]?.in !== 'header' ||
  health.get.parameters?.[0]?.required !== false
) {
  throw new Error('Correlation-ID request and response behavior is incomplete')
}

if (
  health.get.responses['200']?.content?.['application/json']?.schema?.$ref !==
    '#/components/schemas/HealthResponse' ||
  health.get.responses['500']?.content?.['application/json']?.schema?.$ref !==
    '#/components/schemas/ErrorResponse'
) {
  throw new Error('GET /health must use the health and error schemas')
}

for (const response of [
  health.get.responses['200'],
  health.get.responses['500'],
  paths['/api/v1/flashcards/generate'].post.responses['200'],
]) {
  if (!response?.headers?.['X-Correlation-ID']?.schema) {
    throw new Error('Backend responses must document the X-Correlation-ID header')
  }
}

const generation = paths['/api/v1/flashcards/generate'].post
if (
  !generation ||
  generation.parameters?.[0]?.name !== 'X-Correlation-ID' ||
  generation.requestBody?.content?.['application/json']?.schema?.$ref !==
    '#/components/schemas/FlashcardGenerationRequest'
) {
  throw new Error('Generation endpoint must document its typed request')
}
for (const status of ['200', '422', '502']) {
  if (!generation.responses?.[status]) {
    throw new Error(`Generation endpoint must document ${status}`)
  }
}
for (const schemaName of [
  'HealthResponse',
  'ErrorResponse',
  'FlashcardGenerationRequest',
  'BasicCard',
  'ClozeCard',
  'FlashcardGenerationResponse',
]) {
  if (!components.schemas?.[schemaName]) {
    throw new Error(`OpenAPI must define ${schemaName}`)
  }
}

console.log('openapi.yaml structure is valid')
