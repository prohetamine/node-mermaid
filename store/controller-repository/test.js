const controllerRepositorys = require('./index')

;(async () => {
  controllerRepositorys.init()

  controllerRepositorys.add('git@github.com:prohetamine/official.git')

  controllerRepositorys.update('git@github.com:prohetamine/official.git')

  console.log(controllerRepositorys.get())

  controllerRepositorys.remove()
})()
