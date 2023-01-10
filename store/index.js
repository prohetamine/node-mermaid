const express       = require('express')
    , app           = express()
    , path          = require('path')
    , http          = require('http')
    , server        = http.createServer(app)
    , cors          = require('cors')
    , { Server }    = require('socket.io')
    , fs            = require('fs')
    , fse           = require('fs-extra')
    , { execFile }  = require('child_process')
    , sleep         = require('sleep-promise')

module.exports = ({
  port,
  debug = false,
  basePath,
  isExecApps = false
}) => {
  if (!fs.existsSync(basePath)) {
    fs.mkdirSync(basePath)
  }

  const appsPath = path.join(basePath, 'apps')

  if (!fs.existsSync(appsPath)) {
    fs.mkdirSync(appsPath)
  }

  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  })

  let openWindowCallback = () => {}

  io.on('connection', socket => {
    if (socket.handshake.query.platform === 'app-channel') {
      const clients = io.sockets.adapter.rooms.get('app-channel')

      if (clients) {
        Object.keys(
          Object
            .fromEntries(
              clients.entries()
            )
        ).forEach(id => {
          const _socket = io.sockets.sockets.get(id)

          const query = socket.handshake.query
              , _query = _socket.handshake.query

          if (query.repo === _query.repo && query.app === _query.app) {
            if (query.isDev === 'true' && _query.isDev === 'false') {
              _socket.disconnect()
            } else {
              socket.disconnect()
            }
          }
        })
      }

      socket.join('app-channel')
      return
    }

    if (socket.handshake.query.platform === 'app-transport-channel') {
      socket.join(`${socket.handshake.query.repo}/${socket.handshake.query.app}`)

      socket.on('writeData', data => {
        socket
          .to(`${socket.handshake.query.repo}/${socket.handshake.query.app}`)
          .emit('writeData', data)
      })

      socket.on('readData', data => {
        socket
          .to(`${socket.handshake.query.repo}/${socket.handshake.query.app}`)
          .emit('readData', data)
      })

      socket.on('bluetoothProvider', data => {
        socket
          .to(`${socket.handshake.query.repo}/${socket.handshake.query.app}`)
          .emit('bluetoothProvider', data)
      })

      socket.on('openWindow', data => {
        openWindowCallback(data)
      })
    }

    if (socket.handshake.query.platform === 'store-channel') {
      socket.join('store-channel')

      socket.on('play', appData => {
        socket.to('app-channel').emit('play', appData)
      })

      socket.on('pause', appData => {
        socket.to('app-channel').emit('pause', appData)
      })

      socket.on('reload', appData => {
        socket.to('app-channel').emit('reload', appData)
      })
    }
  })

  app.use(cors())

  app.get('/api/getApps', async (req, res) => {
    try {
      const repositorys = await fse.readdir(appsPath)
          , apps = (await Promise.all(
                    repositorys
                      .filter(repo => repo !== '.DS_Store')
                      .map(
                        async repo => {
                          const apps = await fse.readdir(path.join(appsPath, repo))

                          return Promise.all(
                            apps.filter(app => app !== '.DS_Store')
                              .map(
                                async app => {
                                  const { main, size } = JSON.parse(
                                    await fs.readFileSync(
                                      path.join(appsPath, repo, app, 'package.json')
                                      ,
                                      'utf8'
                                    )
                                  )

                                  return ({
                                    repo,
                                    app,
                                    size,
                                    path: path.join(appsPath, repo, app, main)
                                  })
                                }
                              )
                          )
                        }
                      )
                  ))
                  .flat()

      res.end(
        JSON.stringify(
          apps
        )
      )
    } catch (e) {
      res.end(
        JSON.stringify(
          []
        )
      )
    }
  })

  app.get('*', (req, res) => {
    try {
      res.sendFile(path.join(appsPath, req.originalUrl.replace(/\?.+/, '')))
    } catch (e) {
      res.status(404)
      res.end('Not found')
    }
  })

  const getWorkedApps = () => {
    const clients = io.sockets.adapter.rooms.get('app-channel')

    if (clients) {
      return Object.keys(
        Object
          .fromEntries(
            clients.entries()
          )
      ).map(id => ({ ...io.sockets.sockets.get(id).handshake.query }))
    } else {
      return []
    }
  }

  const execApps = async () => {
    const workedApps = getWorkedApps()

    const repositorys = (await Promise.all(
      (await fse.readdir(appsPath))
        .filter(repo => repo !== '.DS_Store')
        .map(repo =>
          new Promise(async res => {
            try {
              res({
                repo,
                apps: await new Promise(async res => {
                  const apps = await fse.readdir(path.join(appsPath, repo))
                  res(
                    await Promise.all(
                      apps
                        .filter(
                          app =>
                            app !== '.DS_Store' &&
                            !workedApps.find(workedApp => workedApp.repo === repo && workedApp.app === app)
                        )
                        .map(async app => {
                          const { main, size } = JSON.parse(
                            await fse.readFile(
                              path.join(appsPath, repo, app, 'package.json')
                              ,
                              'utf8'
                            )
                          )

                          return ({
                            repo,
                            app,
                            size,
                            path: path.join(appsPath, repo, app, main)
                          })
                        })
                    )
                  )
                })
              })
            } catch (e) {
              console.log(e)
              res(false)
            }
          })
        )
    )).filter(r => r)

    repositorys.forEach(({ repo, apps }) => {
      apps.forEach(app =>
        execFile('node', [app.path, repo, app.app, port, app.size])
      )
    })

    if (repositorys.find(({ apps }) => apps.length)) {
      await sleep(60000)
      await execApps()
    } else {
      await sleep(5000)
      await execApps()
    }
  }

  if (isExecApps) {
    execApps()
  }

  return {
    ready: () => new Promise(res => server.listen(port, res)),
    execApps: () => execApps(),
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
