const { io } = require('socket.io-client')
    , path = require('path')

module.exports = () => {
  const [repository, app] = process.argv.slice(2)
  return path.join(__dirname, '../../../../../../memory', repository, app)
}
