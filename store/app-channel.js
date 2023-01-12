const { io } = require('socket.io-client')

module.exports = ({ debug = false } = { debug: false }) => {
  const [repo, app, port, size, isDev] = process.argv.slice(2)

  const socket = io(
    `http://localhost:${port}?platform=app-channel&repo=${repo}&app=${app}&size=${size}&isDev=${!!isDev}`,
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
    if (repo === appData.repo && app === appData.app) {
      reloadCallback()
      socket.emit('state', state)
    }
  })

  socket.on('pause', appData => {
    if (repo === appData.repo && app === appData.app) {
      state.isPlay = false
      socket.emit('state', state)
    }
  })

  socket.on('play', appData => {
    if (repo === appData.repo && app === appData.app) {
      state.isPlay = true
      socket.emit('state', state)
    }
  })

  socket.on('delete', appData => {
    if (repo === appData.repo && app === appData.app) {
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

      if (type === 'data') {
        dataCallback = callback
      }

      if (type === 'reload') {
        reloadCallback = callback
      }
    }
  })
}