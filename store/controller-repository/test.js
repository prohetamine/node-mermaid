const controllerRepositorys = require('./index')

;(async () => {
  controllerRepositorys.init()

  const link = 'git@github.com:prohetamine/official.git'

  await controllerRepositorys.add(link)

  await controllerRepositorys.update(link)

  /*
    console.log(
      await controllerRepositorys.get()
    )
  */

  await controllerRepositorys.delete(link, appData => {
    console.log(appData)
    return true
  })
})()
