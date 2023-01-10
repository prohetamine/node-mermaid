const { unescape } = require('html-escaper')

module.exports = (extension, callback, debug = false) => {
  let isParseData = false
    , isEasyData = false

  const easyData = {
    events: {
      isTokens: false,
      isMessage: false
    },
    isModel: false,
    isUser: false,
    isAnon: false,
    tokenCount: 0,
    message: '',
    username: '',
  }

  if (extension.platform === 'Chaturbate') {
    extension.data.forEach(message => {
      try {
        const parseData = JSON.parse(message.data)

        if (parseData.method === 'onNotify') {
          try {
            const arg0 = JSON.parse(parseData.args[0])

            if (arg0.type === 'tip_alert') {
              easyData.events.isTokens = true
              easyData.tokenCount = arg0.amount

              if (arg0.is_anonymous_tip) {
                easyData.isAnon = true
              } else {
                easyData.isUser = true
                easyData.username = arg0.from_username
              }

              easyData.message = unescape(arg0.message)

              isEasyData = true
            }
          } catch (error) {
            debug && console.log('!!!!!!!!! onNotify !!!!!!!!!')
            debug && console.log(error)
            debug && console.log(parseData)
          }
        }

        if (parseData.method === 'onRoomMsg') {
          try {
            easyData.events.isMessage = true

            const { m } = JSON.parse(parseData.args[1])

            easyData.message = unescape(m)

            if (parseData.args[0] === extension.modelUsername) {
              easyData.isModel = true
            } else {
              easyData.isUser = true
            }

            easyData.username = parseData.args[0]

            isEasyData = true
          } catch (error) {
            debug && console.log('!!!!!!!!! onRoomMsg !!!!!!!!!')
            debug && console.log(error)
            debug && console.log(parseData)
          }
        }

        isParseData = true

        callback({
          isParseData,
          isEasyData,
          easyData,
          parseData,
          extension
        })
      } catch (error) {
        callback({
          isParseData,
          isEasyData,
          extension
        })

        debug && console.log(error)
        debug && console.log(extension)
      }
    })
  }
}
