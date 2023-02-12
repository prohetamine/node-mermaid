const fs                      = require('fs-extra')
    , appData                 = require('app-data-folder')
    , path                    = require('path')
    , sleep                   = require('sleep-promise')
    , cp                      = require('node:child_process')
    , axios                   = require('axios')
    , unzipper                = require('unzipper')
    , controllerRepositorys   = require('./controller-repository')
    , open                    = require('open')

const basePath = appData('MermaidStoreData')
    , appsMemoryPath = path.join(basePath, 'memory')
    , appsPath = path.join(basePath, 'apps')
    , unpackingAppsPath = path.join(basePath, 'unpacking-apps')

const init = async() => {
  try {
    const isBaseFolder = await fs.exists(basePath)

    if (!isBaseFolder) {
      await fs.mkdir(basePath)
    }

    const isAppsFolder = await fs.exists(appsPath)

    if (!isAppsFolder) {
      await fs.mkdir(appsPath)
    }

    const isUnpackingAppsPath = await fs.exists(unpackingAppsPath)

    if (!isUnpackingAppsPath) {
      await fs.mkdir(unpackingAppsPath)
    }

    const isMemoryAppsPath = await fs.exists(appsMemoryPath)

    if (!isMemoryAppsPath) {
      await fs.mkdir(appsMemoryPath)
    }

    return true
  } catch (e) {
    return false
  }
}

const get = async () => {
  try {
    const virtualRepository = await controllerRepositorys.get()

    const repositorys = await fs.readdir(appsPath)

    const appsData = await Promise.all(
      repositorys
        .filter(repository => repository !== '.DS_Store')
        .map(
          async repository => {
            const appsData = await fs.readdir(path.join(appsPath, repository))

            const apps = await Promise.all(
              appsData
                .filter(app => app !== '.DS_Store')
                .map(
                  async app => {
                    try {
                      const { zip, size, entry } = virtualRepository.find(repositoryData => repositoryData.repository === repository).appsData.find(appData => appData.app === app)

                      return ({
                        repository,
                        app,
                        size,
                        zip,
                        path: path.join(appsPath, repository, app),
                        entry: path.join(appsPath, repository, app, entry)
                      })
                    } catch (e) {
                      try {
                        const { main, size } = JSON.parse(
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
                      } catch (e) {
                        return false
                      }
                    }
                  }
                )
            )

            return apps.filter(f => f)
          }
        )
    )

    return appsData.flat()
  } catch (e) {
    console.log(e)
    return []
  }
}

const _delete = async ({ repository, app }) => {
  try {
    const workFolderApp = path.join(appsPath, repository, app)
    await fs.rm(workFolderApp, { recursive: true, force: true })

    const isWorkFolderApp = await fs.exists(workFolderApp)
    if (!isWorkFolderApp) {
      return true
    } else {
      return false
    }
  } catch (e) {
    return false
  }
}

const checkInstalled = async ({ app, repository }) => {
  const workFolderApp = path.join(appsPath, repository, app)

  try {
    const isWorkFolderApp = await fs.exists(workFolderApp)

    return isWorkFolderApp
  } catch (e) {
    return false
  }
}

const install = async ({ zip, app, repository }, onProgress) => {
  onProgress(null, `start installing ${repository}/${app}`, 0)

  const loadZipPath = path.join(unpackingAppsPath, `${repository}-${app}.zip`)
      , unpackingAppPath = path.join(unpackingAppsPath, `${app}-main`)
      , workFolderRepository = path.join(appsPath, repository)
      , workFolderApp = path.join(appsPath, repository, app)
      , memoryFolderRepository = path.join(appsMemoryPath, repository)
      , memoryFolderApp = path.join(appsMemoryPath, repository, app)

  await sleep(500)

  try {
    const isWorkFolderApp = await fs.exists(workFolderApp)

    if (isWorkFolderApp) {
      onProgress(null, 'app is already installed', 1)
      return true
    }
  } catch (e) {
    onProgress('check installerd app error', null, 0.1)
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
        onProgress(null, 'download zip app', (e.progress * 0.3) || 0.3)
      }
    })

    loadData = data
    onProgress(null, 'load zip app ok', 0.32)
  } catch (e) {
    onProgress('load zip app error', null, 0.32)
    return false
  }

  await sleep(500)

  try {
    await fs.writeFile(loadZipPath, loadData)
    onProgress(null, 'write zip app ok', 0.4)
  } catch (e) {
    onProgress('write zip app error', null, 0.35)
    return false
  }

  await sleep(500)

  const unpacking = async res => {
    const zipStreamRead = await fs.createReadStream(loadZipPath)

    zipStreamRead.on('error', () => {
      onProgress('read zip stream error', null, 0.42)
      res(false)
    })

    const unziping = zipStreamRead.pipe(unzipper.Extract({ path: unpackingAppsPath }))

    unziping.on('error', () => {
      onProgress('unzip error', null, 0.45)
      res(false)
    })

    unziping.on('finish', () => {
      onProgress(null, 'unziping app ok', 0.5)
      res(true)
    })
  }

  const isUnpacking = await new Promise(unpacking)

  if (!isUnpacking) {
    return false
  }

  await sleep(500)

  try {
    let cli = path.join(__dirname, '/../node_modules/npm/bin/npm-cli.js')

    const isDev = await fs.exists(cli)

    if (!isDev) {
      cli = path.join(__dirname, '/../../npm/bin/npm-cli.js')
    }

    await new Promise(res => {
      const child = cp.fork(cli, ['install'], { cwd: unpackingAppPath })
      child.on('close', res)
    })

    onProgress(null, 'install modules ok', 0.8)
  } catch (e) {
    onProgress('install modules error', null, 0.6)
    return false
  }

  try {
    const isWorkFolderRepository = await fs.exists(workFolderRepository)

    if (!isWorkFolderRepository) {
      await fs.mkdir(workFolderRepository)
      onProgress(null, 'create work folder repository ok', 0.85)
    }
  } catch (e) {
    onProgress('create work folder repository error', null, 0.85)
    return false
  }

  await sleep(500)

  try {
    const isCreatedMemoryFolderRepository = await fs.exists(memoryFolderRepository)

    if (!isCreatedMemoryFolderRepository) {
      await fs.mkdir(memoryFolderRepository)
    }

    const isCreatedMemoryFolderApp = await fs.exists(memoryFolderApp)
    if (!isCreatedMemoryFolderApp) {
      await fs.mkdir(memoryFolderApp)
    }

    onProgress(null, 'create memory folder ok', 0.87)
  } catch (e) {
    onProgress('create memory folder error', null, 0.87)
  }

  await sleep(500)

  try {
    await fs.rename(unpackingAppPath, workFolderApp)
    onProgress(null, 'move work folder ok', 0.9)
  } catch (e) {
    onProgress('move work folder error', null, 0.9)
    return false
  }

  await sleep(500)

  try {
    await fs.rm(path.join(loadZipPath))
    onProgress(null, 'remove zip app ok', 1)
  } catch (e) {
    onProgress('remove zip app error', null, 1)
    return false
  }

  await sleep(500)

  return true
}

const executter = (apps, port = 6969) => {
  apps.forEach(app =>
    cp.fork(
      app.entry,
      [
        app.repository,
        app.app,
        port,
        app.size
      ]
    )
  )
}

const openWorkDir = async ({ repository, app }) => {
  try {
    const workFolderApp = path.join(appsPath, repository, app)
    await open(workFolderApp)
    return true
  } catch (e) {
    return false
  }
}

module.exports = {
    appsPath,
    init,
    get,
    delete: _delete,
    checkInstalled,
    install,
    executter,
    openWorkDir
}
