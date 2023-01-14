const repositoryFullDelete = (workedApps, apps, onExitSocket) => {
  return async (repository, onExit, onExitEnd) => {
    await Promise.all(
      workedApps.map((wApp, i) =>
        new Promise(res => {
          if (wApp.repository === repository) {
            onExitSocket({
              repository: wApp.repository,
              app: wApp.app
            })

            setTimeout(() => {
              const appPath = apps.find(({ repository, app }) => repository === wApp.repository && app === wApp.app).path
              onExit(appPath)
              res()
            }, i * 1000)
          }
        })
      )
    )
    onExitEnd()
  }
}

module.exports = repositoryFullDelete
