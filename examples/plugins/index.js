const MermaidPlugin = require('./../../plugin')({
  port: 8888,
  debug: false
})

const rollTheDiceObs = require('./roll-the-dice-obs')
    , hello = require('./hello')

;(async () => {
  const mp = await MermaidPlugin.ready()

  mp.use(rollTheDiceObs)
  mp.use(hello)
})()


