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
if (Object.keys(paths).length !== 1 || !paths['/health']) {
  throw new Error('openapi.yaml must document only /health')
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

const healthSchema = components.schemas?.Health
const errorSchema = components.schemas?.Error
if (!healthSchema || !errorSchema) {
  throw new Error('openapi.yaml must define Health and Error schemas')
}
for (const property of ['status', 'service', 'correlation_id']) {
  if (!healthSchema.required?.includes(property) || !healthSchema.properties?.[property]) {
    throw new Error(`Health schema is missing required property: ${property}`)
  }
}
if (!healthSchema.properties.status.enum?.includes('ok')) {
  throw new Error('Health.status must allow only ok')
}
if (!healthSchema.properties.service.enum?.includes('flashcard-generator-fastapi')) {
  throw new Error('Health.service must identify the FastAPI service')
}
if (!errorSchema.required?.includes('detail') || !errorSchema.properties?.detail) {
  throw new Error('Error schema must define a detail property')
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

console.log('openapi.yaml structure is valid')
