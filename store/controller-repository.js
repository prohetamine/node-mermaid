/*eslint no-useless-escape: "error"*/

const fs              = require('fs-extra')
    , appData         = require('app-data-folder')
    , path            = require('path')
    , axios           = require('axios')

const basePath = appData('MermaidStoreData')
    , repositorysPath = path.join(basePath, 'repositorys.json')
    , appsPath = path.join(basePath, 'apps')

const init = async () => {
  try {
    const isBaseFolder = await fs.exists(basePath)

    if (!isBaseFolder) {
      await fs.mkdir(basePath)
    }

    const repositorysPath = path.join(basePath, 'repositorys.json')
        , isRepositorysConfig = await fs.exists(repositorysPath)

    if (!isRepositorysConfig) {
      await fs.writeFile(repositorysPath, JSON.stringify([]))
    }
    return true
  } catch (e) {
    return false
  }
}

const get = async () => {
  try {
    return JSON.parse(
      await fs.readFile(repositorysPath, 'utf8')
    )
  } catch (e) {
    return []
  }
}

const update = async link => {
  try {
    const linkPath = link.replace(/(git@github.com:|https:\/\/github.com\/|\.git)/gi, '')
        , repository = linkPath.match(/[^\\/]+$/)[0]

    const apps = await axios.get(`https://raw.githubusercontent.com/${linkPath}/main/mermaid-apps.json`)
                            .then(({ data: apps }) => apps)

    const readme = `https://raw.githubusercontent.com/${linkPath}/main/readme.md`

    const appsData = await Promise.all(
      apps.map(
        async link => {
          const linkPath = link.replace(/(git@github.com:|https:\/\/github.com\/|\.git)/gi, '')

          const app = linkPath.match(/[^\\/]+$/)[0]

          const package = await axios.get(`https://raw.githubusercontent.com/${linkPath}/main/package.json`)
                                    .then(({ data }) => data)

          return ({
            repository,
            app,
            zip: `https://codeload.github.com/${linkPath}/zip/refs/heads/main`,
            size: package.size,
            entry: package.main,
            link
          })
        }
      )
    )
    let lastRepositorys = JSON.parse(
      await fs.readFile(repositorysPath, 'utf8')
    )

    const index = lastRepositorys.findIndex(repository => repository.link === link)

    lastRepositorys[index] = {
      repository,
      link,
      appsData,
      readme,
      date: new Date() - 0,
      installed: true
    }

    await fs.writeFile(
      repositorysPath,
      JSON.stringify(lastRepositorys)
    )

    return true
  } catch (e) {
    console.log(e)
    return false
  }
}

const find = async link => {
  try {
    const linkPath = link.replace(/(git@github.com:|https:\/\/github.com\/|\.git)/gi, '')
        , repository = linkPath.match(/[^\\/]+$/)[0]

    const apps = await axios.get(`https://raw.githubusercontent.com/${linkPath}/main/mermaid-apps.json`)
                            .then(({ data: apps }) => apps)

    const readme = `https://raw.githubusercontent.com/${linkPath}/main/readme.md`

    const appsData = await Promise.all(
      apps.map(
        async (link) => {
          const linkPath = link.replace(/(git@github.com:|https:\/\/github.com\/|\.git)/gi, '')

          const app = linkPath.match(/[^\\/]+$/)[0]

          const package = await axios.get(`https://raw.githubusercontent.com/${linkPath}/main/package.json`)
                                    .then(({ data }) => data)

          return ({
            repository,
            app,
            zip: `https://codeload.github.com/${linkPath}/zip/refs/heads/main`,
            size: package.size,
            entry: package.main,
            link
          })
        }
      )
    )

    return {
      appsData,
      readme,
      installed: false,
      repository,
      link
    }
  } catch (e) {
    return null
  }
}

const add = async link => {
  try {
    const linkPath = link.replace(/(git@github.com:|https:\/\/github.com\/|\.git)/gi, '')
        , repository = linkPath.match(/[^\\/]+$/)[0]
        , workFolderRepository = path.join(appsPath, repository)

    const apps = await axios.get(`https://raw.githubusercontent.com/${linkPath}/main/mermaid-apps.json`)
                            .then(({ data: apps }) => apps)

    const readme = `https://raw.githubusercontent.com/${linkPath}/main/readme.md`

    const appsData = await Promise.all(
      apps.map(
        async link => {
          const linkPath = link.replace(/(git@github.com:|https:\/\/github.com\/|\.git)/gi, '')

          const app = linkPath.match(/[^\\/]+$/)[0]

          const package = await axios.get(`https://raw.githubusercontent.com/${linkPath}/main/package.json`)
                                    .then(({ data }) => data)

          return ({
            app,
            repository,
            zip: `https://codeload.github.com/${linkPath}/zip/refs/heads/main`,
            size: package.size,
            entry: package.main,
            link
          })
        }
      )
    )

    let lastRepositorys = null

    try {
      lastRepositorys = JSON.parse(
        await fs.readFile(repositorysPath, 'utf8')
      )
    } catch (e) {
      lastRepositorys = []
    }

    if (lastRepositorys.length === 0 || !lastRepositorys.find(repository => repository.link === link)) {
      await fs.writeFile(
        repositorysPath,
        JSON.stringify([
          ...lastRepositorys,
          {
            repository,
            link,
            appsData,
            readme,
            date: new Date() - 0,
            installed: true
          }
        ])
      )

      const isWorkFolderRepository = await fs.exists(workFolderRepository)

      if (!isWorkFolderRepository) {
        await fs.mkdir(workFolderRepository)
      }

      return true
    }

    return false
  } catch (e) {
    return false
  }
}

const _delete = async (link, onDeleteApp, onProgress) => {
  onProgress(null, `start deleting ${link}`, 0)

  const linkPath = link.replace(/(git@github.com:|https:\/\/github.com\/|\.git)/gi, '')
      , repository = linkPath.match(/[^\\/]+$/)[0]
      , workFolderRepository = path.join(appsPath, repository)

  let repositorys = null

  try {
    repositorys = await get()
    onProgress(null, `get repositorys.. ok`, 0.2)
  } catch (e) {
    onProgress(`get repositorys.. error`, null, 0.2)
    return false
  }

  let statusApps = []

  try {
    onProgress(null, `repository search.. ok`, 0.25)
    statusApps = await Promise.all(
      repositorys.find(({ repository: _repository }) => _repository === repository).appsData.map(
        async ({ app }, i, array) => {
          const step = 0.25 + ((i + 1) / array.length * 0.5)
          onProgress(null, `start delete ~${repository}/${app}`, step)

          const isDelete = await onDeleteApp({ app, repository })
          return {
            app,
            repository,
            isDelete
          }
        }
      )
    )
  } catch (e) {
    onProgress(`repository search..`, null, 0.25)
    return false
  }

  for (let i = 0; i < statusApps.length; i++) {
    const statusApp = statusApps[i]

    const step = 0.75 + ((i + 1) / statusApps.length * 0.2)

    if (statusApp.isDelete) {
      onProgress(null, `delete ~${statusApp.repository}/${statusApp.app} ok`, step)
    } else {
      onProgress(`delete ~${statusApp.repository}/${statusApp.app} error`, null, step)
    }
  }

  if (!statusApps.find(({ isDelete }) => isDelete === false)) {
    try {
      await fs.rm(workFolderRepository, { recursive: true, force: true })
      onProgress(null, `delete work dir ok`, 0.97)
    } catch (e) {
      onProgress(`delete work dir error`, null, 0.97)
      return false
    }

    try {
      const newRepositorys = repositorys.filter(({ repository: _repository }) => _repository !== repository)
      await fs.writeFile(repositorysPath, JSON.stringify(newRepositorys))
      onProgress(null, `overwriting repository ok`, 1)
    } catch (e) {
      onProgress(`overwriting work dir error`, null, 0.99)
      return false
    }

    return true
  } else {
    return false
  }
}

module.exports = {
  repositorysPath,
  init,
  get,
  update,
  add,
  find,
  delete: _delete
}
