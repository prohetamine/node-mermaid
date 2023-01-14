/*eslint no-useless-escape: "error"*/

const fs              = require('fs-extra')
    , appData         = require('app-data-folder')
    , path            = require('path')
    , axios           = require('axios')

const basePath = appData('MermaidStoreData-test')
    , repositorysPath = path.join(basePath, 'repositorys.json')
    , appsPath = path.join(basePath, 'apps')

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
          await fs.writeFile(repositorysPath, JSON.stringify([]))
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
        return []
      }
    },
    update: async link => {
      try {
        const linkPath = link.match(/:[^\\.]+/)[0].slice(1)
            , repository = linkPath.match(/[^\\/]+$/)[0]

        const apps = await axios.get(`https://raw.githubusercontent.com/${linkPath}/main/mermaid-apps.json`)
                                .then(({ data: apps }) => apps)

        const fullAppsInfo = await Promise.all(
          apps.map(
            async (link) => {
              const linkPath = link.match(/:[^\\.]+/)[0].slice(1)

              const repository = linkPath.match(/[^\\/]+$/)[0]

              const package = await axios.get(`https://raw.githubusercontent.com/${linkPath}/main/package.json`)
                                        .then(({ data }) => data)

              return ({
                name: repository,
                zip: `https://codeload.github.com/${linkPath}/zip/refs/heads/main`,
                package,
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
          name: repository,
          link,
          apps: fullAppsInfo,
          date: new Date() - 0
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
    },
    add: async link => {
      try {
        const linkPath = link.match(/:[^\\.]+/)[0].slice(1)
            , repository = linkPath.match(/[^\\/]+$/)[0]
            , workFolderRepository = path.join(appsPath, repository)

        const apps = await axios.get(`https://raw.githubusercontent.com/${linkPath}/main/mermaid-apps.json`)
                                .then(({ data: apps }) => apps)

        const fullAppsInfo = await Promise.all(
          apps.map(
            async link => {
              const linkPath = link.match(/:[^\\.]+/)[0].slice(1)

              const repository = linkPath.match(/[^\\/]+$/)[0]

              const package = await axios.get(`https://raw.githubusercontent.com/${linkPath}/main/package.json`)
                                        .then(({ data }) => data)

              return ({
                name: repository,
                zip: `https://codeload.github.com/${linkPath}/zip/refs/heads/main`,
                package,
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
                name,
                link,
                apps: fullAppsInfo,
                date: new Date() - 0
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
    },
    delete: async (link, onExit) => {
      try {
        const linkPath = link.match(/:[^\\.]+/)[0].slice(1)
            , repository = linkPath.match(/[^\\/]+$/)[0]
            , workFolderRepository = path.join(appsPath, repository)

        new Promise(res => {
          const stack = []

          const stackingApps = appPath => stack.push(appPath)

          const onExitEnd = () => {
            console.log(stack, 'ready delete')
            console.log(workFolderRepository)

            res()
          }

          onExit(
            repository,
            stackingApps,
            onExitEnd
          )
        })

        return true
      } catch (e) {
        return false
      }
    }
}
