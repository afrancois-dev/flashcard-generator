import { createServer } from 'node:http'

import start from './dist/server/server.js'

const port = Number(process.env.PORT ?? 3000)

const server = createServer(async (request, response) => {
  try {
    const origin = `http://${request.headers.host ?? `localhost:${port}`}`
    const url = new URL(request.url ?? '/', origin)
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
    response.writeHead(result.status, Object.fromEntries(result.headers))
    response.end(Buffer.from(await result.arrayBuffer()))
  } catch (error) {
    console.error(error)
    response.writeHead(500, { 'content-type': 'text/plain' })
    response.end('Internal server error')
  }
})

server.listen(port, '0.0.0.0', () => {
  console.log(`Flashcard Generator listening on port ${port}`)
})
