const express                 = require('express')
    , path                    = require('path')
    , http                    = require('http')
    , cors                    = require('cors')
    , { Server }              = require('socket.io')
    , controllerApps          = require('./controller-apps')
    , controllerRepositorys   = require('./controller-repository')
    , AppChannel              = require('./channels/app-channel')
    , AppTransportChannel     = require('./channels/app-transport-channel')
    , StoreChannel            = require('./channels/store-channel')

const app     = express()
    , server  = http.createServer(app)

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
    , openWindowReadmeCallback = () => {}
    , appChannelSendMessageCallback = () => {}

  AppChannel(
    io,
    (platform, text) => appChannelSendMessageCallback(platform, text)
  )
  StoreChannel(io, url => openWindowReadmeCallback(url))
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

      if (type === 'open-readme') {
        openWindowReadmeCallback = callback
      }
    },
    AppChannel: {
      writeData: (type, data) => {
        io.sockets.to('app-channel').emit(type, data)
      },
      on: (type, callback) => {
        if (type === 'sendMessage') {
          appChannelSendMessageCallback = callback
        }
      }
    },
    search: data => 
      io.sockets.to('store-channel').emit('search', data)
    ,
    log: (data) =>
      io.sockets.to('store-channel').emit('log', data)
  }
}
