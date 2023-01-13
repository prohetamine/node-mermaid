const fs          = require('fs-extra')
    , appData     = require('app-data-folder')
    , path        = require('path')
    , sleep       = require('sleep-promise')
    , npminstall  = require('npminstall')
    , cp          = require('node:child_process')
    , axios       = require('axios')
    , unzipper    = require('unzipper')
    , controllerRepositorys  = require('./../controller-repository')

const basePath = appData('MermaidStoreData-test')
    , appsPath = path.join(basePath, 'apps')
    , unpackingAppsPath = path.join(basePath, 'unpacking-apps')

/*const getWorkedApps = io => {
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
}*/

module.exports = {
    appsPath,
    init: async() => {
      try {
        const isBaseFolder = await fs.exists(basePath)

        if (!isBaseFolder) {
          await fs.mkdir(basePath)
        }

        const appsPath = path.join(basePath, 'apps')
            , isAppsFolder = await fs.exists(appsPath)

        if (!isAppsFolder) {
          await fs.mkdir(appsPath)
        }

        const unpackingAppsPath = path.join(basePath, 'unpacking-apps')
            , isUnpackingAppsPath = await fs.exists(unpackingAppsPath)

        if (!isUnpackingAppsPath) {
          await fs.mkdir(unpackingAppsPath)
        }

        return true
      } catch (e) {
        return false
      }
    },
    get: async () => {
      /*//const workedApps = getWorkedApps(io)
      const allApps = await getApps()

      const apps = allApps.filter(aApp => !workedApps.find(wApp => wApp.repo === aApp.repo && wApp.app === aApp.app))

      apps.forEach(async app => {
        while (true) {
          const isStartAppProcess = await new Promise(res => {
            const appProcess = cp.fork(app.entry, [app.repo, app.app, port, app.size])

            const timeId = setTimeout(() => res(true), 10000)

            appProcess.on('close', async (e) => {
              clearTimeout(timeId)

              try {
                await npminstall({
                  root: app.path
                })
              } catch (e) {
                await sleep(5000)
              }

              res(false)
            })
          })

          if (isStartAppProcess) {
            break
          }

          await sleep(5000)
        }
      })

      return allApps*/

      try {
        const virtualRepository = await controllerRepositorys.get()

        const repositorys = await fs.readdir(appsPath)

        const apps = await Promise.all(
          repositorys
            .filter(repository => repository !== '.DS_Store')
            .map(
              async repository => {
                const apps = await fs.readdir(path.join(appsPath, repository))

                return Promise.all(
                  apps
                    .filter(app => app !== '.DS_Store')
                    .map(
                      async app => {
                        try {
                          const { zip, package: { size, main } } = virtualRepository.repositorys.find(_repository => _repository.name === repository).apps.find(_app => _app.name === app)

                          return ({
                            repository,
                            app,
                            size,
                            zip,
                            path: path.join(appsPath, repository, app),
                            entry: path.join(appsPath, repository, app, main)
                          })
                        } catch (e) {
                          const { main, dependencies, size } = JSON.parse(
                            await fs.readFile(
                              path.join(appsPath, repository, app, 'package.json')
                              ,
                              'utf8'
                            )
                          )

                          return ({
                            repository,
                            app,
                            size,
                            zip: false,
                            path: path.join(appsPath, repository, app),
                            entry: path.join(appsPath, repository, app, main)
                          })
                        }
                      }
                    )
                )
              }
            )
        )

        return apps.flat()
      } catch (e) {
        return []
      }
    },
    remove: async ({ repository, app }) => {
      try {
        const workFolderApp = path.join(appsPath, repository, app)
        await fs.rm(workFolderApp, { recursive: true, force: true })
        return true
      } catch (e) {
        return false
      }
    },
    checkInstalled: async ({ app, repository }) => {
      const workFolderApp = path.join(appsPath, repository, app)

      try {
        const isWorkFolderApp = await fs.exists(workFolderApp)

        return isWorkFolderApp
      } catch (e) {
        return false
      }
    },
    install: async ({ zip, app, repository }, progress) => {
      progress(null, `start installing ${repository}/${app}`, 0)
      const loadZipPath = path.join(unpackingAppsPath, `${repository}-${app}.zip`)
          , unpackingAppPath = path.join(unpackingAppsPath, `${app}-main`)
          , workFolderRepository = path.join(appsPath, repository)
          , workFolderApp = path.join(appsPath, repository, app)

      await sleep(500)

      try {
        const isWorkFolderApp = await fs.exists(workFolderApp)

        if (isWorkFolderApp) {
          progress(null, 'app is already installed', 1)
          return true
        }
      } catch (e) {
        progress('check installerd app error', null, 0.1)
        return false
      }

      await sleep(500)

      let loadData = null

      try {
        const { data } = await axios({
          url: zip,
          method: 'GET',
          responseType: 'arraybuffer',
          onDownloadProgress: (e) => {
            progress(null, 'download zip app', (e.progress * 0.3) || 0.3)
          }
        })

        loadData = data
        progress(null, 'load zip app ok', 0.32)
      } catch (e) {
        progress('load zip app error', null, 0.32)
        return false
      }

      await sleep(500)

      try {
        await fs.writeFile(loadZipPath, loadData)
        progress(null, 'write zip app ok', 0.4)
      } catch (e) {
        progress('write zip app error', null, 0.35)
        return false
      }

      await sleep(500)

      const isUnpacking = await new Promise(async res => {
        const zipStreamRead = await fs.createReadStream(loadZipPath)

        zipStreamRead.on('error', (e) => {
          progress('read zip stream error', null, 0.42)
          res(false)
        })

        const unziping = zipStreamRead.pipe(unzipper.Extract({ path: unpackingAppsPath }))

        unziping.on('error', (e) => {
          progress('unzip error', null, 0.45)
          res(false)
        })

        unziping.on('finish', () => {
          progress(null, 'unziping app ok', 0.5)
          res(true)
        })
      })

      if (!isUnpacking) {
        return false
      }

      await sleep(500)

      try {
        await npminstall({
          root: unpackingAppPath
        })
        progress(null, 'install modules ok', 0.8)
      } catch (e) {
        progress('install modules error', null, 0.6)
        return false
      }

      try {
        const isWorkFolderRepository = await fs.exists(workFolderRepository)

        if (!isWorkFolderRepository) {
          await fs.mkdir(workFolderRepository)
          progress(null, 'create work folder repository ok', 0.85)
        }
      } catch (e) {
        progress('create work folder repository error', null, 0.85)
        return false
      }

      await sleep(500)

      try {
        await fs.rename(unpackingAppPath, workFolderApp)
        progress(null, 'move work folder ok', 0.9)
      } catch (e) {
        progress('move work folder error', null, 0.9)
        return false
      }

      await sleep(500)

      try {
        await fs.rm(path.join(loadZipPath))
        progress(null, 'remove zip app ok', 1)
      } catch (e) {
        progress('remove zip app error', null, 1)
        return false
      }

      await sleep(500)

      return true
    },
    executter: (apps, port = 6969) => {
      apps.forEach(app =>
        cp.fork(app.entry, [app.repo, app.app, port, app.size])
      )
    }
}
