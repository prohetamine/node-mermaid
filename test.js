console.log('Init script')
const Mermaid = require('./index')({
  port: 6767,
  debug: false
})

console.log('Init parser')
const MermaidParser = require('./parser')

;(async () => {
  console.log('Init server')
  await Mermaid.ready()
  console.log('Start server')

  console.log('Init status event')
  Mermaid.on('status', data => {
    console.log(`status:`, data)
  })
  console.log('Listen status event')

  console.log('Init data event')
  Mermaid.on('data', data => {
    //console.log(data)

    MermaidParser.Chaturbate(data, parseData => {
      if (parseData.isEasyData) {
        console.log(parseData.easyData)
      }
    })

    MermaidParser.BongaCams(data, parseData => {
      console.log(parseData)
    })

    MermaidParser.xHamsterLive(data, parseData => {
      console.log(parseData)
    })

    MermaidParser.Stripchat(data, parseData => {
      console.log(parseData)
    })
  })

  console.log('Available platforms ', Mermaid.availablePlatforms)

  console.log('Listen data event')

  setTimeout(async () => {
    //await Mermaid.sendMessage('Chaturbate', 'hello world')
    //await Mermaid.sendMessage('Stripchat', 'hello world')
    //await Mermaid.sendMessage('xHamsterLive', 'hello world')
    //await Mermaid.sendMessage('BongaCams', 'hello world', 5000 /* delay message ms */)

    //await Mermaid.sendMessages('BongaCams', ['hello', 'world'])
    //await Mermaid.sendMessages('Chaturbate', ['hello', 'world'], 5000 /* delay messages ms */)

    // todo:
    //await Mermaid.sendMessage('Chaturbate', { Raw message PM })
    //await Mermaid.sendMessages('Chaturbate', { Raw message PM })
  }, 5000)
})()
