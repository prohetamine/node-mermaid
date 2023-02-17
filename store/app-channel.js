const { io } = require('socket.io-client')
    , sleep = require('sleep-promise')
    , availablePlatforms = require('./../available-platforms')

module.exports = ({ debug = false } = { debug: false }) => {
  const [repository, app, port, size, isDev] = process.argv.slice(2)

  const socket = io(
    `http://localhost:${port}?platform=app-channel&repository=${repository}&app=${app}&size=${size}&isDev=${!!isDev}`,
    {
      options: {
        reconnectionDelayMax: 10000
      }
    }
  )

  const state = {
    isPlay: true
  }

  let connectCallback = () => {}
    , statusCallback = () => {}
    , stateCallback = () => {}
    , dataCallback = () => {}
    , reloadCallback = () => {}

  socket.on('connect', async () => {
    connectCallback()
  })

  socket.on('disconnect', () => {
    process.exit()
  })

  socket.io.on('reconnect_attempt', async attempt => {
    debug && console.log(`Web Socket reconnect (${attempt})`)
    if (attempt > 10) {
      process.exit()
    }
  })

  socket.io.on('reconnect_failed', async () => {
    debug && console.log(`Web Socket reconnect`)
    process.exit()
  })

  socket.io.on('error', async error => {
    debug && console.log(`Web Socket error ${error}`)
    process.exit()
  })

  socket.on('data', async data => {
    if (state.isPlay) {
      dataCallback(data)
    }
  })

  socket.on('status', async data => {
    if (state.isPlay) {
      statusCallback(data)
    }
  })

  socket.on('reload', async appData => {
    if (repository === appData.repository && app === appData.app) {
      reloadCallback()
      socket.emit('state', state)
    }
  })

  socket.on('pause', appData => {
    if (
      repository === appData.repository && app === appData.app ||
      '*' === appData.repository && '*' === appData.app
    ) {
      state.isPlay = false
      socket.emit('state', state)
      stateCallback(state)
    }
  })

  socket.on('play', appData => {
    if (
      repository === appData.repository && app === appData.app ||
      '*' === appData.repository && '*' === appData.app
    ) {
      state.isPlay = true
      socket.emit('state', state)
      stateCallback(state)
    }
  })

  socket.on('state', appData => {
    if (repository === appData.repository && app === appData.app) {
      socket.emit('state', state)
    }
  })

  socket.on('exit', appData => {
    if (repository === appData.repository && app === appData.app) {
      process.exit()
    }
  })

  return ({
    on: (type, callback) => {
      if (type === 'connect') {
        connectCallback = callback
      }

      if (type === 'status') {
        statusCallback = callback
      }

      if (type === 'state') {
        stateCallback = callback
      }

      if (type === 'data') {
        dataCallback = callback
      }

      if (type === 'reload') {
        reloadCallback = callback
      }
    },
    availablePlatforms,
    sendMessage: (platform, text, delay) =>
      socket.emit('sendMessage', { platform, text, delay })
    ,
    sendMessages: (platform, texts, delay) =>
      socket.emit('sendMessages', { platform, texts, delay })
  })
}
