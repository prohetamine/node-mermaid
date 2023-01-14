const controllerApps = require('./index')

;(async () => {

  await controllerApps.init()

  /*const handleInstalled = (err, ok, percent) => {
    console.log(err, ok, percent)
  }

  const appData = {
    zip: 'https://codeload.github.com/prohetamine/connects/zip/refs/heads/main',
    repository: 'official',
    app: 'connects',
  }

  const isIstalled = await controllerApps.install(appData, handleInstalled)*/

  const appsData = await controllerApps.get()

  console.log(appsData)

  ///await controllerApps.executter(appsData)

  /*if (isIstalled) {
    const appData = {
      repository: 'official',
      app: 'connects'
    }

    await controllerApps.remove(appData)
  }*/

  /* await controllerApps.checkInstalled({
    repository: 'official',
    app: 'connects'
  })*/

  /*
    await controllerApps.openWorkDir({
      repository: 'official',
      app: 'connects'
    })
  */
})()
