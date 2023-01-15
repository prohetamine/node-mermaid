const controllerApps          = require('./../controller-apps')
    , controllerRepositorys   = require('./../controller-repository')
    , getWorkedApps           = require('./../get-worked-apps')
    , executter               = require('./../executter')

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

      socket.on('get-apps', async () => {
        const apps = await controllerApps.get()
        socket.emit('get-apps', apps)
        const workedApps = getWorkedApps(io)
        await executter(workedApps, apps)
      })

      socket.on('app-connection-state', async appData => {
        const isConnected = !!getWorkedApps(io)
                              .find(
                                ({ app, repository }) =>
                                  app === appData.app &&
                                  repository === appData.repository
                              )

        socket.emit('app-connection-state', { appData, isConnected })
      })

      socket.on('get-repositorys', async () => {
        socket.emit('get-repositorys', await controllerRepositorys.get())
      })

      socket.on('repository-add', async link => {
        await controllerRepositorys.add(link)
        socket.emit('get-repositorys', await controllerRepositorys.get())
      })

      socket.on('repository-delete', async link => {
        const isDelete = await controllerRepositorys.delete(
          link,
          async appData => {
            socket.to('app-channel').emit('exit', appData)
            const isRemove = await controllerApps.delete(appData)
            return isRemove
          },
          (err, ok, progress) =>
            socket.emit('repository-delete-progress', {
              err,
              ok,
              progress,
              link
            })
        )

        if (isDelete) {
          const apps = await controllerApps.get()
          socket.emit('get-apps', apps)
          socket.emit('get-repositorys', await controllerRepositorys.get())
        }
      })

      socket.on('repository-update', async link => {
        const isUpdate = await controllerRepositorys.update(link)
        if (isUpdate) {
          socket.emit('get-repositorys', await controllerRepositorys.get())
        }
      })

      socket.on('app-delete', async appData => {
        socket.to('app-channel').emit('exit', appData)
        const isDelete = await controllerApps.delete(appData)
        if (isDelete) {
          const apps = await controllerApps.get()
          socket.emit('get-apps', apps)
          const workedApps = getWorkedApps(io)
          await executter(workedApps, apps)
        }
      })

      socket.on('app-update', async appData => {
        socket.to('app-channel').emit('exit', appData)
        const isRemove = await controllerApps.remove(appData)
        if (isRemove) {
          const apps = await controllerApps.get()
          socket.emit('get-apps', apps)
          const workedApps = getWorkedApps(io)
          await executter(workedApps, apps)

          const isInstall = await controllerApps.install(
            appData,
            (err, ok, progress) =>
              socket.emit('app-install-progress', {
                type: 2,
                err,
                ok,
                progress,
                appData
              })
          )
          if (isInstall) {
            const apps = await controllerApps.get()
            socket.emit('get-apps', apps)
            const workedApps = getWorkedApps(io)
            await executter(workedApps, apps)
          }
        }
      })

      socket.on('check-app-installed', async appData => {
        const isInstalled = await controllerApps.checkInstalled(appData)
        socket.emit('check-app-installed', { isInstalled, appData })
        const apps = await controllerApps.get()
        socket.emit('get-apps', apps)
        const workedApps = getWorkedApps(io)
        await executter(workedApps, apps)
      })

      socket.on('app-install', async appData => {
        const isInstall = await controllerApps.install(
          appData,
          (err, ok, progress) =>
            socket.emit('app-install-progress', {
              type: 1,
              err,
              ok,
              progress,
              appData
            })
        )

        if (isInstall) {
          const apps = await controllerApps.get()
          socket.emit('get-apps', apps)
          const workedApps = getWorkedApps(io)
          await executter(workedApps, apps)
        }
      })

      socket.on('app-work-folder', async appData => {
        await controllerApps.openWorkDir(appData)
      })
    }
  })
}
