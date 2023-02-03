const { io } = require('socket.io-client')

module.exports = ({ debug = false } = { debug: false }) => {
  const [repository, app, port, size, isDev] = process.argv.slice(2)

  const socket = io(
    `http://localhost:${port}?platform=app-transport-channel&repository=${repository}&app=${app}&size=${size}&isDev=${!!isDev}`,
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
    openWindow: data => {
      const args = data
      delete args.file

      socket.emit('openWindow', {
        url: `http://localhost:${port}/${repository}/${app}/public/${file}`,
        ...args
      })
    }
  })
}
