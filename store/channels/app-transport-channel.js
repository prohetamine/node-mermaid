module.exports = (io, openWindowCallback) => {
  io.on('connection', socket => {
    if (socket.handshake.query.platform === 'app-transport-channel') {
      const repository = socket.handshake.query.repository
          , app = socket.handshake.query.app

      socket.join(`${repository}/${app}`)

      socket.on('writeData', data => {
      socket
        .to(`${repository}/${app}`)
        .emit('writeData', data)
      })

      socket.on('readData', data => {
      socket
        .to(`${repository}/${app}`)
        .emit('readData', data)
      })

      socket.on('bluetoothProvider', data => {
      socket
        .to(`${repository}/${app}`)
        .emit('bluetoothProvider', data)
      })

      socket.on('openWindow', data => {
        openWindowCallback(data)
      })
    }
  })
}
