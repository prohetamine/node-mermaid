const express     = require('express')
    , app         = express()
    , http        = require('http')
    , server      = http.createServer(app)
    , cors        = require('cors')
    , { Server }  = require('socket.io')

module.exports = ({ port = 6767, debug = false } = { port: 6767, debug: false }) => {
  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  })

  let dataCallback = () => {}
    , statusCallback = () => {}

  const sites = {}

  let sitesTimeId = null

  const proxySites = new Proxy(sites, {
    set: (target, key, value) => {
      if (target[key] !== value) {
        target[key] = value

        const sendStatus = () => {
          const normalizeStatus = Object.keys(target).map(key => ({ platform: key, online: target[key] }))
          statusCallback(normalizeStatus)
          io.sockets.to('app-channel').emit('status', normalizeStatus)
        }

        sendStatus()

        if (sitesTimeId !== null) {
          clearInterval(sitesTimeId)
        }

        sitesTimeId = setInterval(sendStatus, 5000)
      }
    }
  })

  io.on('connection', socket => {
    proxySites[socket.handshake.query.platform] = true
    socket.join('extension')

    socket.on('output', data => {
      const parsedData = JSON.parse(data)
      proxySites[parsedData.platform] = true
      dataCallback(parsedData)
    })

    socket.on('disconnect', data => {
      proxySites[socket.handshake.query.platform] = false
    })
  })

  return {
    ready: () => new Promise(res => server.listen(port, res)),
    on: (type, callback) => {
      if (type === 'status') {
        statusCallback = callback
      }

      if (type === 'data') {
        dataCallback = callback
      }
    },
    sendMessage: (platform, data) => {
      io.to('extension').emit('input', {
        platform,
        text: data
      })
    }
  }
}
