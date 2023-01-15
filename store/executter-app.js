const controllerApps = require('./controller-apps')

const executter = async (workedApps, apps) => {
  const waitApps = apps.filter(
    ({ app, repository }) =>
      !workedApps.find(
        wApp =>
          wApp.app === app &&
          wApp.repository === repository
        )
  )
  
  await controllerApps.executter(waitApps)
}

module.exports = executter
