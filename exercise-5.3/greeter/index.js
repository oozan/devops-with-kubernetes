const http = require('http')

const port = process.env.PORT || 3000
const greeting = process.env.GREETING || 'Hello'

http
  .createServer((request, response) => {
    if (request.url === '/healthz') {
      response.writeHead(200, { 'Content-Type': 'application/json' })
      response.end(JSON.stringify({ status: 'ok' }))
      return
    }

    if (request.url === '/greeting' || request.url === '/') {
      response.writeHead(200, { 'Content-Type': 'text/plain' })
      response.end(greeting)
      return
    }

    response.writeHead(404, { 'Content-Type': 'text/plain' })
    response.end('Not found')
  })
  .listen(port, () => console.log(`${greeting} on port ${port}`))
