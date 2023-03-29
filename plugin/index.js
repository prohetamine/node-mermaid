//const MermaidPlugin = require('./../src/plugin')
const Mermaid = require('./../index')
    , MermaidParser = require('./../parser')

const express           = require('express')
    , app               = express()
    , http              = require('http')
    , server            = http.createServer(app)
    , cors              = require('cors')
    , path              = require('path')
    , bodyParser        = require('body-parser')
    , { Server }        = require('socket.io')

module.exports = ({ port, debug }) => {
  return {
    ready: async () => {
      await Mermaid.ready()

      let localStatus = []

      const plugins = []

      Mermaid.on('data', data => {
        MermaidParser.availablePlatforms.map(platform => 
          MermaidParser[platform](data, parseData => {
            const event = { data: parseData, status: localStatus }

            const call = i => {
              if (plugins[i]) {
                plugins[i](
                  event, 
                  () => call(i + 1) 
                )
              }
            }

            call(0)
          })
        )
      })

      Mermaid.on('status', status => {
        localStatus = status
      })

      const io = new Server(server, {
        cors: {
          origin: '*',
          methods: ['GET', 'POST']
        }
      })
      
      app.use(cors())
      app.use(bodyParser.json({ limit: '50mb' }))
      app.use((_, res, next) => {
        res.setHeader('Access-Control-Allow-Origin', '*')
        next()
      })

      await new Promise(resolve => server.listen(port, resolve))

      app.use('/socket-lib', express.static(path.join(__dirname, 'socket.io.js')))
      
      const sockets = {}
      const socketsEvents = {}

      io.on('connection', socket => {
        const key = socket.handshake.query.key
        try {
          sockets[key].off()
        } catch (e) {
          // ok
        }
        sockets[key] = socket

        if (!socketsEvents[key]) {
          socketsEvents[key] = {}
        }

        Object.keys(socketsEvents[key]).forEach(type => {
          socket.on(type, socketsEvents[key][type])
        })
      })

      return {
        use: plugin => 
              plugins.push(
                plugin({
                  sendMessage: Mermaid.sendMessage,
                  sendMessages: Mermaid.sendMessages,
                  availablePlatforms: MermaidParser.availablePlatforms,
                  debug,
                  static: (route, path) => app.use(route, express.static(path)),
                  socket: key => {
                    return {
                      on: (type, cb) => {
                        if (!socketsEvents[key]) {
                          socketsEvents[key] = {}
                        }

                        if (!socketsEvents[key][type]) {
                          socketsEvents[key][type] = cb
                        }
                      },
                      send: (type, data) => {
                        const socket = sockets[key]

                        if (socket) {
                          socket.emit(type, data)
                        }
                      }
                    }
                  }
                })
              )
      }
    }
  }
}
