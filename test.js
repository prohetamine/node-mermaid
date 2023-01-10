console.log('Init script')
const Mermaid = require('./src/index')({
  port: 6767,
  debug: false
})

const MermaidParser = require('./src/parser')

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
      console.log(parseData)
    })
  })
  console.log('Listen data event')

  setTimeout(() => {
    //Mermaid.sendMessage('Chaturbate', 'hello world')
    //Mermaid.sendMessage('Stripchat', 'hello world')
    //Mermaid.sendMessage('xHamsterLive', 'hello world')
    //Mermaid.sendMessage('BongaCams', 'hello world')
    // wait for next message delay min 500-700ms

    // todo:
    // Mermaid.sendMessage('chaturbate', { Raw message PM })
  }, 5000)
})()
