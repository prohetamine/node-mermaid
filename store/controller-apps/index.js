const fs          = require('fs-extra')
    , appData     = require('app-data-folder')
    , path        = require('path')
    , sleep       = require('sleep-promise')
    , npminstall  = require('npminstall')
    , cp          = require('node:child_process')
    , axios       = require('axios')
    , unzipper    = require('unzipper')

const basePath = appData('MermaidStoreData')
    , appsPath = path.join(basePath, 'apps')
    , tmpAppsPath = path.join(basePath, 'tmp-apps')

const getWorkedApps = io => {
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

const getApps = async () => {
  const repositorys = await fs.readdir(appsPath)
      , apps = (await Promise.all(
                repositorys
                  .filter(repo => repo !== '.DS_Store')
                  .map(
                    async repo => {
                      const apps = await fs.readdir(path.join(appsPath, repo))

                      return Promise.all(
                        apps.filter(app => app !== '.DS_Store')
                          .map(
                            async app => {
                              const { main, dependencies, size } = JSON.parse(
                                await fs.readFile(
                                  path.join(appsPath, repo, app, 'package.json')
                                  ,
                                  'utf8'
                                )
                              )

                              return ({
                                repo,
                                app,
                                size,
                                dependencies,
                                path: path.join(appsPath, repo, app),
                                entry: path.join(appsPath, repo, app, main)
                              })
                            }
                          )
                      )
                    }
                  )
              ))
              .flat()

  return apps
}

module.exports = {
    appsPath,
    init: async() => {
      const isBaseFolder = await fs.exists(basePath)

      if (!isBaseFolder) {
        await fs.mkdir(basePath)
      }

      const appsPath = path.join(basePath, 'apps')
          , isAppsFolder = await fs.exists(appsPath)

      if (!isAppsFolder) {
        await fs.mkdir(appsPath)
      }

      const tmpAppsPath = path.join(basePath, 'tmp-apps')
          , isTmpAppsFolder = await fs.exists(tmpAppsPath)

      if (!isTmpAppsFolder) {
        await fs.mkdir(tmpAppsPath)
      }
    },
    get: async (io, port = 6969) => {
      const workedApps = getWorkedApps(io)
          , allApps = await getApps()

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

      return allApps
    },
    delete: async appData => {
      const appDir = path.join(appsPath, appData.repo, appData.app)
      await fs.rm(appDir, { recursive: true, force: true })
    },
    install: async installData => {
      try {
        const fileResponse = await axios({
          url: installData.zip,
          method: 'GET',
          responseType: 'arraybuffer',
        })

        await fs.writeFile(path.join(tmpAppsPath, installData.repo+'-'+installData.app+'.zip'), fileResponse.data)

        await new Promise(res => {
          const unziping = fs.createReadStream(path.join(tmpAppsPath, installData.repo+'-'+installData.app+'.zip'))
            .pipe(unzipper.Extract({ path: tmpAppsPath }))

          unziping.on('finish', res)
        })

        await sleep(2000)

        await fs.rename(path.join(tmpAppsPath, installData.app+'-main'), path.join(appsPath, installData.repo, installData.app))

        await sleep(2000)

        await fs.rm(path.join(tmpAppsPath, installData.app+'-main'))
        await fs.rm(path.join(tmpAppsPath, installData.repo+'-'+installData.app+'.zip'))
      } catch (e) {}
    }
}
