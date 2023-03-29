const path = require('path')

module.exports = ({ static, socket, sendMessage, availablePlatforms, debug }) => {
  static('/roll-the-dice', path.join(__dirname, 'public'))
  const _socket = socket('roll-the-dice')
  
  _socket.on('prize', data => {
    availablePlatforms.map(platform => 
      sendMessage(platform, `[Roll The Dice] Prize: ${data}`)
    )
  })

  return async ({ data }, nextPlugin) => {
    if (data.isEasyData) {
      debug && console.log(data.easyData.tokenCount)
      if (
        data.easyData.events.isTokens &&
        (debug ? true : data.easyData.isUser) && 
        data.easyData.tokenCount === 150
      ) {
        _socket.send('spin')
      }
    }

    nextPlugin()
  }
}
