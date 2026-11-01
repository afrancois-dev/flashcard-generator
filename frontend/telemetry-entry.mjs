import { logs, metrics } from '@opentelemetry/api'
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http'
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-proto'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { resourceFromAttributes } from '@opentelemetry/resources'
import {
  BatchLogRecordProcessor,
  LoggerProvider,
} from '@opentelemetry/sdk-logs'
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics'
import { NodeSDK } from '@opentelemetry/sdk-node'

const collectorEndpoint = (
  process.env.OTEL_EXPORTER_OTLP_ENDPOINT ?? 'http://localhost:4318'
).replace(/\/$/, '')
const serviceName = process.env.OTEL_SERVICE_NAME ?? 'flashcard-generator'
const endpoint = (path) => `${collectorEndpoint}${path}`
const resource = resourceFromAttributes({
  'service.name': serviceName,
  'service.version': process.env.npm_package_version ?? '0.0.0',
})

const sdk = new NodeSDK({
  resource,
  traceExporter: new OTLPTraceExporter({ url: endpoint('/v1/traces') }),
  metricReader: new PeriodicExportingMetricReader({
    exporter: new OTLPMetricExporter({ url: endpoint('/v1/metrics') }),
    exportIntervalMillis: 10_000,
  }),
})
sdk.start()

const loggerProvider = new LoggerProvider({
  resource,
  processors: [
    new BatchLogRecordProcessor(
      new OTLPLogExporter({ url: endpoint('/v1/logs') }),
    ),
  ],
})
logs.setGlobalLoggerProvider(loggerProvider)

const meter = metrics.getMeter(serviceName)
export const httpRequestCounter = meter.createCounter(
  'flashcard_http_request_total',
  { description: 'Completed HTTP requests' },
)
export const httpRequestDuration = meter.createHistogram(
  'flashcard_http_request_duration_ms',
  { description: 'HTTP request duration in milliseconds' },
)
