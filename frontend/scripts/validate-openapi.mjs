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
  Object.keys(paths).length !== 2 ||
  !paths['/health'] ||
  !paths['/api/v1/flashcards/generate']
) {
  throw new Error('openapi.yaml must document /health and flashcard generation')
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

const correlationParameter = components.parameters?.CorrelationId
const correlationHeader = components.headers?.CorrelationId
if (
  correlationParameter?.name !== 'X-Correlation-ID' ||
  correlationParameter?.in !== 'header' ||
  correlationParameter.required !== false ||
  correlationParameter.schema?.pattern !== '^[A-Za-z0-9._:-]{1,128}$' ||
  !correlationHeader?.schema
) {
  throw new Error('Correlation-ID request and response behavior is incomplete')
}

if (
  health.get.parameters?.[0]?.$ref !== '#/components/parameters/CorrelationId' ||
  health.get.responses['200']?.$ref !== '#/components/responses/HealthResponse' ||
  health.get.responses['500']?.$ref !== '#/components/responses/UnexpectedFailure'
) {
  throw new Error('GET /health must use the reusable correlation and response components')
}

for (const responseName of ['HealthResponse', 'UnexpectedFailure']) {
  const response = components.responses?.[responseName]
  if (!response?.headers?.['X-Correlation-ID']?.$ref) {
    throw new Error(`${responseName} must document the X-Correlation-ID response header`)
  }
}

const generation = paths['/api/v1/flashcards/generate'].post
if (
  !generation ||
  generation.parameters?.[0]?.$ref !==
    '#/components/parameters/CorrelationId' ||
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
