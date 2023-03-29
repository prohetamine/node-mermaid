const Mermaid = require('./../src/index')()
const MermaidParser = require('./../src/parser')

const handleEvent = async data => {
  // console.log('data', data)

  if (!data.easyData.isModel && data.easyData.message.match(/^(hello|hi|hii|hiii|hey)/gi)) {
    await Mermaid.sendMessage(data.extension.platform, '👋')
  }

  if (data.easyData.isModel && data.easyData.message.match(/^(ping)/gi)) {
    await Mermaid.sendMessage(data.extension.platform, 'Hello model 👋')
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
