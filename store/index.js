const express                 = require('express')
    , path                    = require('path')
    , http                    = require('http')
    , cors                    = require('cors')
    , fs                      = require('fs')
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
    , appChannelSendMessagesCallback = () => {}

  AppChannel(
    io,
    (platform, text, delay) => appChannelSendMessageCallback(platform, text, delay),
    (platform, texts, delay) => appChannelSendMessagesCallback(platform, texts, delay)
  )
  StoreChannel(io, url => openWindowReadmeCallback(url))
  AppTransportChannel(io, data => openWindowCallback(data))

  app.use(cors())
  app.get('*', async (req, res) => {
    const file = path.join(controllerApps.appsPath, req.originalUrl.replace(/\?.+/, ''))

    const isExists = await new Promise(res => {
      try {
        fs.exists(file, res)
      } catch (e) {
        res(false)
      }
    })

    if (isExists) {
      res.sendFile(file)
    } else {
      res.end('')
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

        if (type === 'sendMessages') {
          appChannelSendMessagesCallback = callback
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
