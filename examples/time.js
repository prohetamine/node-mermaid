const Mermaid = require('../index')()
const MermaidParser = require('../parser')

const handleEvent = async data => {
  // console.log('data', data)

  if (data.easyData.isModel && data.easyData.message.match(/^(time)/gi)) {
    const date = new Date()
    const time = date.getHours() + ':' +date.getMinutes()

    await Mermaid.sendMessage(data.extension.platform, '🕔 🕔 🕔 🕔 🕔')
    await Mermaid.sendMessage(data.extension.platform, time)
    await Mermaid.sendMessage(data.extension.platform, '🕔 🕔 🕔 🕔 🕔')
  }
}


;(async () => {
  await Mermaid.ready()
  Mermaid.on('status', data => {
    console.clear()
    console.log(`platforms (${data.length})`)
    console.log('-----------------')
    data.map(({ platform, online }) => 
      console.log(`${platform}: ${online ? 'online' : 'offline'}`)
    )
    console.log('-----------------')
  })

  Mermaid.on('data', data => {
    MermaidParser.Chaturbate(data, parseData => {
      if (parseData.isEasyData) {
        handleEvent(parseData) 
      }
    })

    MermaidParser.BongaCams(data, parseData => {
      if (parseData.isEasyData) {
        handleEvent(parseData) 
      }
    })

    MermaidParser.xHamsterLive(data, parseData => {
      if (parseData.isEasyData) {
        handleEvent(parseData) 
      }
    })

    MermaidParser.Stripchat(data, parseData => {
      if (parseData.isEasyData) {
        handleEvent(parseData) 
      }
    })
  })
})()
