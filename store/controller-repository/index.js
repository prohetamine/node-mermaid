const fs              = require('fs-extra')
    , appData         = require('app-data-folder')
    , path            = require('path')
    , axios           = require('axios')
    , controllerApps  = require('./../controller-apps')

const basePath = appData('MermaidStoreData-test')
    , repositorysPath = path.join(basePath, 'repositorys.json')
    , appsPath = path.join(basePath, 'apps')

const getInstalledAppsCount = async () => {
  const apps = await controllerApps.get()
  return apps.length
}

module.exports = {
    repositorysPath,
    init: async() => {
      try {
        const isBaseFolder = await fs.exists(basePath)

        if (!isBaseFolder) {
          await fs.mkdir(basePath)
        }

        const repositorysPath = path.join(basePath, 'repositorys.json')
            , isRepositorysConfig = await fs.exists(repositorysPath)

        if (!isRepositorysConfig) {
          await fs.writeFile(repositorysPath, JSON.stringify({
            length: {
              apps: 0,
              installed: await getInstalledAppsCount(),
              repositorys: 0
            },
            repositorys: []
          }))
        }
        return true
      } catch (e) {
        return false
      }
    },
    get: async () => {
      try {
        return JSON.parse(
          await fs.readFile(repositorysPath, 'utf8')
        )
      } catch (e) {
        return {
          length: {
            apps: 0,
            installed: await getInstalledAppsCount(),
            repositorys: 0
          },
          repositorys: []
        }
      }
    },
    update: async link => {
      try {
        const linkPath = link.match(/:[^\\.]+/)[0].slice(1)
            , name = linkPath.match(/[^\/]+$/)[0]

        const apps = await axios.get(`https://raw.githubusercontent.com/${linkPath}/main/mermaid-apps.json`)
                                .then(({ data: apps }) => apps)

        const fullAppsInfo = await Promise.all(
          apps.map(
            async ({ link }) => {
              const linkPath = link.match(/:[^\\.]+/)[0].slice(1)

              const name = linkPath.match(/[^\/]+$/)[0]

              const package = await axios.get(`https://raw.githubusercontent.com/${linkPath}/main/package.json`)
                                        .then(({ data }) => data)

              return ({
                name,
                zip: `https://codeload.github.com/${linkPath}/zip/refs/heads/main`,
                package,
                link
              })
            }
          )
        )

        const appsInstalledCount = await getInstalledAppsCount()

        let lastRepoData = JSON.parse(
          await fs.readFile(repositorysPath, 'utf8')
        )

        const index = lastRepoData.repositorys.findIndex(repository => repository.link === link)

        lastRepoData.repositorys[index] = {
          name,
          link,
          apps: fullAppsInfo,
          date: new Date() - 0
        }

        await fs.writeFile(
          repositorysPath,
          JSON.stringify({
            length: {
              apps: lastRepoData.repositorys.reduce((calc, repository) => calc + repository.apps.length, 0),
              installed: appsInstalledCount,
              repositorys: lastRepoData.repositorys.length
            },
            repositorys: lastRepoData.repositorys
          })
        )

        return true
      } catch (e) {
        console.log(e)
        return false
      }
    },
    add: async link => {
      try {
        const linkPath = link.match(/:[^\\.]+/)[0].slice(1)
            , name = linkPath.match(/[^\/]+$/)[0]
            , workFolderRepository = path.join(appsPath, name)

        const apps = await axios.get(`https://raw.githubusercontent.com/${linkPath}/main/mermaid-apps.json`)
                                .then(({ data: apps }) => apps)

        const fullAppsInfo = await Promise.all(
          apps.map(
            async ({ link }) => {
              const linkPath = link.match(/:[^\\.]+/)[0].slice(1)

              const name = linkPath.match(/[^\/]+$/)[0]

              const package = await axios.get(`https://raw.githubusercontent.com/${linkPath}/main/package.json`)
                                        .then(({ data }) => data)

              return ({
                name,
                zip: `https://codeload.github.com/${linkPath}/zip/refs/heads/main`,
                package,
                link
              })
            }
          )
        )

        const appsInstalledCount = await getInstalledAppsCount()

        let lastRepoData = null

        try {
          lastRepoData = JSON.parse(
            await fs.readFile(repositorysPath, 'utf8')
          )
        } catch (e) {
          lastRepoData = {
            length: {
              apps: 0,
              installed: appsInstalledCount,
              repositorys: 0
            },
            repositorys: []
          }
        }

        if (lastRepoData.repositorys.length === 0 || !lastRepoData.repositorys.find(repository => repository.link === link)) {
          await fs.writeFile(
            repositorysPath,
            JSON.stringify({
              length: {
                apps: lastRepoData.length.apps + fullAppsInfo.length,
                installed: appsInstalledCount,
                repositorys: lastRepoData.repositorys.length + 1
              },
              repositorys: [
                ...lastRepoData.repositorys,
                {
                  name,
                  link,
                  apps: fullAppsInfo,
                  date: new Date() - 0
                }
              ]
            })
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
}
