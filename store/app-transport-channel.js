const { io } = require('socket.io-client')

module.exports = ({ debug = false } = { debug: false }) => {
  const [repo, app, port, size, isDev] = process.argv.slice(2)

  const socket = io(
    `http://localhost:${port}?platform=app-transport-channel&repo=${repo}&app=${app}&size=${size}&isDev=${!!isDev}`,
    {
      options: {
        reconnectionDelayMax: 10000
      }
    }
  )

  let connectCallback = () => {}
    , readDataCallbacks = []

  socket.on('connect', async () => {
    debug && console.log('connect')
    connectCallback()
  })

  socket.on('readData', data => {
    debug && console.log('readData', data)
    readDataCallbacks.forEach(c => c(data))
  })

  socket.on('openWindow', data => {
    debug && console.log('openWindow', data)
    socket.emit('openWindow', data)
  })

  return ({
    on: (type, callback) => {
      if (type === 'connect') {
        connectCallback = callback
      }

      if (type === 'readData') {
        readDataCallbacks.push(callback)
      }
    },
    writeData: data => {
      debug && console.log('readData', data)
      socket.emit('readData', data)
    },
    openWindow: ({ file, width = 100, height = 200, alwaysOnTop = false, titleBarStyle = 'default' }) => {
      socket.emit('openWindow', {
        url: `http://localhost:${port}/${repo}/${app}/public/${file}`,
        width,
        height,
        titleBarStyle,
        alwaysOnTop
      })
    }
  })
}