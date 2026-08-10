const http = require('http')
const fs = require('fs')

const port = process.env.PORT || 3000
const pingPongUrl = process.env.PING_PONG_URL || 'http://ping-pong.exercises:3000/pings'
const greeterUrl = process.env.GREETER_URL || 'http://greeter-svc.exercises:3000/greeting'
const message = process.env.MESSAGE || ''
const logFilePath = '/usr/src/app/files/output.txt'
const informationFilePath = '/usr/src/app/config/information.txt'

const requestText = (url, fallback) =>
  new Promise((resolve) => {
    const request = http.get(url, (response) => {
      let data = ''
      response.on('data', (chunk) => (data += chunk))
      response.on('end', () => resolve(response.statusCode === 200 ? data.trim() : fallback))
    })

    request.setTimeout(2000, () => {
      request.destroy()
      resolve(fallback)
    })
    request.on('error', () => resolve(fallback))
  })

const server = http.createServer(async (request, response) => {
  if (request.url === '/healthz') {
    response.writeHead(200, { 'Content-Type': 'application/json' })
    response.end(JSON.stringify({ status: 'ok' }))
    return
  }

  const status = fs.existsSync(logFilePath)
    ? fs.readFileSync(logFilePath, 'utf8')
    : 'Waiting for log output...'
  const fileContent = fs.existsSync(informationFilePath)
    ? fs.readFileSync(informationFilePath, 'utf8')
    : ''

  const [pingCount, greeting] = await Promise.all([
    requestText(pingPongUrl, '0'),
    requestText(greeterUrl, 'Greeter unavailable'),
  ])

  response.writeHead(200, { 'Content-Type': 'text/plain' })
  response.end(
    `file content: ${fileContent}\n` +
      `env variable: MESSAGE=${message}\n` +
      `${status}\n` +
      `Ping / Pongs: ${pingCount}\n` +
      `Greeter: ${greeting}\n`,
  )
})

server.listen(port, () => console.log(`Server started on port ${port}`))
