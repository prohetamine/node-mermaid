const controllerApps = require('./controller-apps')

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

const executter = async (io, apps) => {
  const workedApps = getWorkedApps(io)
  const waitApps = apps.filter(({ app, repository }) => !workedApps.find(wApp => wApp.app === app && wApp.repository === repository))
  await controllerApps.executter(waitApps)
}

module.exports = executter
