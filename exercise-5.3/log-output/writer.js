const fs = require('fs')
const crypto = require('crypto')

const randomString = crypto.randomUUID()
const filePath = '/usr/src/app/files/output.txt'

fs.mkdirSync('/usr/src/app/files', { recursive: true })

const writeStatus = () => {
  const status = `${new Date().toISOString()}: ${randomString}`
  fs.writeFileSync(filePath, status)
  console.log(status)
}

writeStatus()
setInterval(writeStatus, 5000)
