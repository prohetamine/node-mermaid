module.exports = (io, openWindowCallback) => {
  io.on('connection', socket => {
    if (socket.handshake.query.platform === 'app-transport-channel') {
      socket.join(`${socket.handshake.query.repo}/${socket.handshake.query.app}`)

      socket.on('writeData', data => {
      socket
        .to(`${socket.handshake.query.repo}/${socket.handshake.query.app}`)
        .emit('writeData', data)
      })

      socket.on('readData', data => {
      socket
        .to(`${socket.handshake.query.repo}/${socket.handshake.query.app}`)
        .emit('readData', data)
      })

      socket.on('bluetoothProvider', data => {
      socket
        .to(`${socket.handshake.query.repo}/${socket.handshake.query.app}`)
        .emit('bluetoothProvider', data)
      })

      socket.on('openWindow', data => {
        openWindowCallback(data)
      })
    }
  })
}
