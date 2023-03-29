const path = require('path')

module.exports = options => {
  /*
    options.static -- static('/hello-world', path.join(__dirname, 'public'))
    options.socket -- socket('key')
    options.sendMessage -- sendMessage('Chaturbate', 'hello world')
    options.sendMessages -- sendMessage('Chaturbate', ['hello', 'world'])
    options.availablePlatforms -- ['Chaturbate', 'BongaCams', 'Stripchat', 'xHamsterLive']
    options.debug -- true/false
  
  const _socket = options.socket('key')
  
  _socket.on('output', output => {
    options. availablePlatforms.map(platform => 
      options.sendMessage(platform, `hello ${output}`)
    )
  })
  */

  return async ({ data, status }, nextPlugin) => {
    /*
      data -- big event object
      status -- [{ platform: 'Chaturbate', online: true/false }, ...]
    */
    
    /* 
    if (data.isEasyData) {
      options.debug && console.log(data.easyData)
      
      _socket.send('input', data.easyData)
    }
    */

    nextPlugin()
  }
}
