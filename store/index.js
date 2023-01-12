const express                 = require('express')
    , app                     = express()
    , path                    = require('path')
    , http                    = require('http')
    , server                  = http.createServer(app)
    , cors                    = require('cors')
    , { Server }              = require('socket.io')
    , controllerApps          = require('./controller-apps')
    , controllerRepositorys   = require('./controller-repository')
    , AppChannel              = require('./channels/app-channel')
    , AppTransportChannel     = require('./channels/app-transport-channel')
    , StoreChannel            = require('./channels/store-channel')

module.exports = ({
  port
}) => {
  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  })

  let openWindowCallback = () => {}

  AppChannel(io)
  StoreChannel(io)
  AppTransportChannel(io, data => openWindowCallback(data))

  app.use(cors())
  app.get('*', (req, res) => {
    try {
      res.sendFile(path.join(controllerApps.appsPath, req.originalUrl.replace(/\?.+/, '')))
    } catch (e) {
      res.status(404)
      res.end('Not found')
    }
  })

  return {
    ready: async () => {
      await controllerRepositorys.init()
      await controllerApps.init()
      await new Promise(res => server.listen(port, res))
      return true
    },
    on: (type, callback) => {
      if (type === 'open-window') {
        openWindowCallback = callback
      }
    },
    AppChannel: {
      writeData: (type, data) => {
        io.sockets.to('app-channel').emit(type, data)
      }
    }
    /*sendMessage: (platform, data) => {
      io.to('extension').emit('input', {
        platform,
        text: data
      })
    },*/
  }
}
