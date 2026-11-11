import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, resolve } from 'node:path'
import { trace } from '@opentelemetry/api'

import {
  httpRequestCounter,
  httpRequestDuration,
} from './telemetry-entry.mjs'

const port = Number(process.env.PORT ?? 3000)

const { default: start } = await import('./dist/server/server.js')
const tracer = trace.getTracer('flashcard-generator')
const clientAssetRoot = resolve(new URL('./dist/client/assets', import.meta.url).pathname)
const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.wasm': 'application/wasm',
}

const server = createServer(async (request, response) => {
  await tracer.startActiveSpan('http.request', async (span) => {
    const startedAt = Date.now()
    try {
      const origin = `http://${request.headers.host ?? `localhost:${port}`}`
      const url = new URL(request.url ?? '/', origin)
      if (url.pathname.startsWith('/assets/')) {
        const assetName = decodeURIComponent(url.pathname.slice('/assets/'.length))
        const assetPath = resolve(clientAssetRoot, assetName)
        if (!assetPath.startsWith(`${clientAssetRoot}/`)) {
          response.writeHead(400, { 'content-type': 'text/plain; charset=utf-8' })
          response.end('Invalid asset path')
          return
        }

        try {
          const asset = await readFile(assetPath)
          response.writeHead(200, {
            'cache-control': 'public, max-age=31536000, immutable',
            'content-type': contentTypes[extname(assetPath)] ?? 'application/octet-stream',
          })
          response.end(request.method === 'HEAD' ? undefined : asset)
          return
        } catch (error) {
          if (error?.code !== 'ENOENT') throw error
        }
      }
      const body =
        request.method === 'GET' || request.method === 'HEAD'
          ? undefined
          : await new Promise((resolve, reject) => {
              const chunks = []
              request.on('data', (chunk) => chunks.push(chunk))
              request.on('end', () => resolve(Buffer.concat(chunks)))
              request.on('error', reject)
            })
      const headers = new Headers()
      for (const [key, value] of Object.entries(request.headers)) {
        if (value) headers.set(key, Array.isArray(value) ? value.join(', ') : value)
      }

      const result = await start.fetch(
        new Request(url, {
          method: request.method,
          headers,
          body,
        }),
      )
      span.setAttribute('http.request.method', request.method ?? 'UNKNOWN')
      span.setAttribute('http.response.status_code', result.status)
      httpRequestCounter.add(1, {
        operation: 'http.request',
        status: String(result.status),
        success: result.status < 400,
      })
      httpRequestDuration.record(Date.now() - startedAt, {
        operation: 'http.request',
        status: String(result.status),
        success: result.status < 400,
      })
      response.writeHead(result.status, Object.fromEntries(result.headers))
      response.end(Buffer.from(await result.arrayBuffer()))
    } catch (error) {
      span.recordException(error)
      span.setAttribute('http.response.status_code', 500)
      httpRequestCounter.add(1, {
        operation: 'http.request',
        status: '500',
        success: false,
      })
      httpRequestDuration.record(Date.now() - startedAt, {
        operation: 'http.request',
        status: '500',
        success: false,
      })
      console.error(JSON.stringify({
        event: 'http.request.failed',
        traceId: span.spanContext().traceId,
        spanId: span.spanContext().spanId,
      }))
      response.writeHead(500, { 'content-type': 'text/plain' })
      response.end('Internal server error')
    } finally {
      span.end()
    }
  })
})

server.listen(port, '0.0.0.0', () => {
  console.log(`Flashcard Generator listening on port ${port}`)
})
