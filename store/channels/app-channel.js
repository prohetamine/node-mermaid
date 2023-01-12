module.exports = io => {
  io.on('connection', socket => {
    if (socket.handshake.query.platform === 'app-channel') {
      const clients = io.sockets.adapter.rooms.get('app-channel')

      if (clients) {
        Object.keys(
          Object
            .fromEntries(
              clients.entries()
            )
        ).forEach(id => {
          const _socket = io.sockets.sockets.get(id)

          const query = socket.handshake.query
              , _query = _socket.handshake.query

          if (query.repo === _query.repo && query.app === _query.app) {
            if (query.isDev === 'true' && _query.isDev === 'false') {
              _socket.disconnect()
            } else {
              socket.disconnect()
            }
          }
        })
      }

      socket.join('app-channel')

      socket.on('state', state => {
        socket.to('store-channel').emit('app-state', {
          appData: socket.handshake.query,
          state
        })
      })
    }
  })
}
