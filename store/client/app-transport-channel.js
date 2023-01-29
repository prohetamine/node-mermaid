window.MermaidAppTransportChannel = ({ port = 6969, debug = false } = { port: 6969, debug: false }) => {
  const [,, repository, app] = window.location.href.match(/[^\/]+/gi)

  let connectCallback = () => {}
    , readDataCallbacks = []
    , bluetoothProviderCallbacks = []

  const socket = io(
    `http://localhost:${port}?platform=app-transport-channel&repository=${repository}&app=${app}`,
    {
      options: {
        reconnectionDelayMax: 10000
      }
    }
  )

  socket.on('connect', async () => {
    debug && console.log('connect')
    connectCallback()
  })

  socket.on('readData', data => {
    debug && console.log('writeData', data)
    readDataCallbacks.forEach(c => c(data))
  })

  socket.on('bluetoothProvider', data => {
    debug && console.log('bluetoothProvider', data)
    bluetoothProviderCallbacks.forEach(c => c(data))
  })

  return ({
    on: (type, callback) => {
      if (type === 'connect') {
        connectCallback = callback
      }

      if (type === 'readData') {
        readDataCallbacks.push(callback)
      }

      if (type === 'bluetoothProvider') {
        bluetoothProviderCallbacks.push(callback)
      }
    },
    writeData: data => {
      debug && console.log('readData', data)
      socket.emit('readData', data)
    },
    bluetoothProvider: data => {
      debug && console.log('bluetoothProvider', data)
      socket.emit('bluetoothProvider', data)
    },
    openWindow: ({ file, width = 100, height = 200, alwaysOnTop = false, frame = true, titleBarStyle = 'default', proportions = false }) => {
      socket.emit('openWindow', {
        url: `${window.location.href.replace(window.location.href.match(/[^\/]+.html/)[0], '')}${file}`,
        width,
        height,
        frame,
        titleBarStyle,
        alwaysOnTop,
        proportions
      })
    }
  })
}
