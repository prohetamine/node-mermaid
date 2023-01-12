const controllerApps = require('./../controller-apps')
const controllerRepositorys = require('./../controller-repository')

module.exports = io => {
  io.on('connection', socket => {
    if (socket.handshake.query.platform === 'store-channel') {
      socket.join('store-channel')

      socket.on('app-play', appData =>
        socket.to('app-channel').emit('play', appData)
      )

      socket.on('app-pause', appData =>
        socket.to('app-channel').emit('pause', appData)
      )

      socket.on('app-reload', appData =>
        socket.to('app-channel').emit('reload', appData)
      )

      socket.on('app-delete', async appData => {
        await controllerApps.delete(appData)
        socket.emit('get-apps', await controllerApps.get(io))
        socket.to('app-channel').emit('delete', appData)
      })

      socket.on('get-apps', async () => {
        socket.emit('get-apps', await controllerApps.get(io))
      })

      socket.on('get-repositorys', async () => {
        socket.emit('get-repositorys', await controllerRepositorys.get(io))
      })

      socket.on('add-repository', async link => {
        await controllerRepositorys.add(link)
        socket.emit('get-repositorys', await controllerRepositorys.get(io))
      })

      socket.on('install-app', async installData => {
        await controllerApps.install(installData)
        socket.emit('get-apps', await controllerApps.get(io))
      })
    }
  })
}
