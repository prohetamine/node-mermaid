const fs          = require('fs-extra')
    , appData     = require('app-data-folder')
    , path        = require('path')
    , axios       = require('axios')

const basePath = appData('MermaidStoreData')
    , repositorysPath = path.join(basePath, 'repositorys.json')
    , appsPath = path.join(basePath, 'apps')

module.exports = {
    repositorysPath,
    init: async() => {
      const isBaseFolder = await fs.exists(basePath)

      if (!isBaseFolder) {
        await fs.mkdir(basePath)
      }

      const repositorysPath = path.join(basePath, 'repositorys.json')
          , isRepositorysConfig = await fs.exists(repositorysPath)

      if (!isRepositorysConfig) {
        await fs.writeFile(repositorysPath, JSON.stringify([]))
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
    add: async link => {
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

        const repository = {
          name,
          apps: fullAppsInfo
        }

        let lastRepositorys = null

        try {
          lastRepositorys = JSON.parse(
            await fs.readFile(repositorysPath, 'utf8')
          )
        } catch (e) {
          lastRepositorys = []
        }

        await fs.writeFile(
          repositorysPath,
          JSON.stringify([
            ...lastRepositorys,
            repository
          ])
        )

        await fs.mkdir(path.join(appsPath, name))
      } catch (e) {
        console.log(e)
      }
    }
}
