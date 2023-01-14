const getWorkedApps = io => {
  const clients = io.sockets.adapter.rooms.get('app-channel')

  if (clients) {
    return Object.keys(
      Object
        .fromEntries(
          clients.entries()
        )
    ).map(id => ({ ...io.sockets.sockets.get(id).handshake.query }))
  } else {
    return []
  }
}

module.exports = getWorkedApps
