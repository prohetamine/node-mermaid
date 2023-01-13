const sleep = require('sleep-promise')
const controllerApps = require('./../controller-apps')
const controllerRepositorys = require('./../controller-repository')

module.exports = io => {
  io.on('connection', socket => {
    if (socket.handshake.query.platform === 'store-channel') {
      socket.join('store-channel')

      socket.on('app-play', appData => {
        socket.to('app-channel').emit('play', appData)
      })

      socket.on('app-pause', appData => {
        socket.to('app-channel').emit('pause', appData)
      })

      socket.on('app-reload', appData =>
        socket.to('app-channel').emit('reload', appData)
      )

      socket.on('get-apps', async () => 
        socket.emit('get-apps', await controllerApps.get())
      )

      socket.on('get-repositorys', async () => {
        socket.emit('get-repositorys', await controllerRepositorys.get())
      })

      socket.on('add-repository', async link => {
        await controllerRepositorys.add(link)
        socket.emit('get-repositorys', await controllerRepositorys.get())
      })

      socket.on('update-repository', async link => {
        const isUpdate = await controllerRepositorys.update(link)
        if (isUpdate) {
          socket.emit('get-repositorys', await controllerRepositorys.get())
        }
      })

      socket.on('app-delete', async appData => {
        socket.to('app-channel').emit('exit', appData)
        const isRemove = await controllerApps.remove(appData)
        if (isRemove) {
          socket.emit('get-apps', await controllerApps.get())
        }
      })

      socket.on('app-update', async appData => {
        socket.to('app-channel').emit('exit', appData)
        const isRemove = await controllerApps.remove(appData)
        if (isRemove) {
          socket.emit('get-apps', await controllerApps.get())
          const isInstall = await controllerApps.install(appData, (err, ok, progress) =>
            socket.emit('app-install-progress', { err, ok, progress })
          )
          if (isInstall) {
            socket.emit('get-apps', await controllerApps.get())
          }
        }
      })

      socket.on('check-app-installed', async appData => {
        const isInstall = await controllerApps.checkInstalled(appData)
        socket.emit('check-app-installed', isInstall)
        socket.emit('get-apps', await controllerApps.get())
      })

      socket.on('app-install', async appData => {
        const isInstall = await controllerApps.install(appData, (err, ok, progress) =>
          socket.emit('app-install-progress', { err, ok, progress })
        )

        if (isInstall) {
          socket.emit('get-apps', await controllerApps.get())
        }
      })
    }
  })
}
