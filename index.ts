const express             = require('express')
    , app                 = express()
    , http                = require('http')
    , cors                = require('cors')
    , server              = http.createServer(app)
    , { Server }          = require('socket.io')
    , sleep               = require('sleep-promise')
    , availablePlatforms  = require('./parser/available-platforms')


const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
})

let dataCallbacks: Function[] = []
  , statusCallbacks: Function[] = []

const sites = {}

let sitesTimeId: any = null

const proxySites: any = new Proxy(sites, {
  set: (target: any, key: string, value: string): any => {
    if (target[key] !== value) {
      target[key] = value

      const sendStatus = () => {
        const normalizeStatus = Object.keys(target).map(
          key => ({ 
            platform: key, 
            online: target[key] 
          })
        )
        statusCallbacks.forEach(statusCallback => statusCallback(normalizeStatus))
      }

      sendStatus()

      if (sitesTimeId !== null) {
        clearInterval(sitesTimeId)
      }

      sitesTimeId = setInterval(sendStatus, 5000)
    }

    return true
  }
})

io.on('connection', (socket: any) => {
  const platform = socket.handshake.query.platform

  proxySites[platform] = true
  socket.join('extension')

  socket.on('output', (data: string) => {
    const parsedData: { platform: string } = JSON.parse(data)
    proxySites[parsedData.platform] = true
    dataCallbacks.forEach(dataCallback => dataCallback(parsedData))
  })

  socket.on('disconnect', () => {
    proxySites[platform] = false
  })
})

module.exports = {
  ready: () => new Promise(res => server.listen(6767, res)),
  on: (type: string, callback: Function) => {
    if (type === 'status') {
      statusCallbacks.push(callback)
    }

    if (type === 'data') {
      dataCallbacks.push(callback)
    }
  },
  availablePlatforms,
  sendMessage: async (platform: string, text: string, delay: number = 700) => {
    await sleep(delay)
    io.to('extension').emit('input', {
      platform,
      text
    })
  },
  sendMessages: async (platform: string, texts: string[], delay: number = 700) => {
    for (let i = 0; i < texts.length; i++) {
      await sleep(delay)
      io.to('extension').emit('input', {
        platform,
        text: texts[i]
      })
    }
  }
}
