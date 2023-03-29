const sends = {
  /* hash */
}

const hellos = {
  Chaturbate: [
    'welcome!',
    'welcome',
    'hello',
    'hello!',
    'hey',
    'hey!',
    'hey, how are you ?',
    'hey, hru ?',
    'hello, how are you ?',
    'hello, hru ?',
    'welcome, how are you ?',
    'welcome, hru ?',
    'hey, how are you',
    'hey, hru',
    'hello, how are you',
    'hello, hru',
    'welcome, how are you',
    'welcome, hru',
    ':welcometomyroom2233',
    ':WELCOMEGUYSNATSAN',
    ':welcome007',
    ':welcomE',
    ':welcometomyroom',
    ':WelcometomyroomSm',
    ':WELCOMETOMYROOMBADGE2',
    ':hello2',
    ':hello25',
    ':hello',
    ':hellobeauty33',
    ':hellogirl09',
    ':hello_emo_2',
    ':Hello_minions',
    ':helloguyslookinggood',
    ':hello_1123232',
    ':HELLO_123222',
    ':HELLO_12345678',
    ':Hellooo123455',
    ':hellooobb',
    ':gibhelloooooooooooooooo',
    ':hellooooooo22222'
  ],
  Stripchat: [
    'welcome!',
    'welcome',
    'hello',
    'hello!',
    'hey',
    'hey!',
    'hey, how are you ?',
    'hey, hru ?',
    'hello, how are you ?',
    'hello, hru ?',
    'welcome, how are you ?',
    'welcome, hru ?',
    'hey, how are you',
    'hey, hru',
    'hello, how are you',
    'hello, hru',
    'welcome, how are you',
    'welcome, hru',
  ],
  xHamsterLive: [
    'welcome!',
    'welcome',
    'hello',
    'hello!',
    'hey',
    'hey!',
    'hey, how are you ?',
    'hey, hru ?',
    'hello, how are you ?',
    'hello, hru ?',
    'welcome, how are you ?',
    'welcome, hru ?',
    'hey, how are you',
    'hey, hru',
    'hello, how are you',
    'hello, hru',
    'welcome, how are you',
    'welcome, hru',
  ],
  BongaCams: [
    'welcome!',
    'welcome',
    'hello',
    'hello!',
    'hey',
    'hey!',
    'hey, how are you ?',
    'hey, hru ?',
    'hello, how are you ?',
    'hello, hru ?',
    'welcome, how are you ?',
    'welcome, hru ?',
    'hey, how are you',
    'hey, hru',
    'hello, how are you',
    'hello, hru',
    'welcome, how are you',
    'welcome, hru',
  ]
}

module.exports = ({ sendMessage, debug }) => {
  return async ({ data }, nextPlugin) => {
    if (data.isEasyData) {
      if (
        data.easyData.events.isMessage &&
        (debug ? true : data.easyData.isUser) &&
        data.easyData.message.match(/\b(hello|hey|hi|hii|hiii)\b/gi)
      ) {
        const platform = data.extension.platform
            , username = data.easyData.username

        const hash = `${username}-${platform}`
         
        if (!sends[hash]) {
          sends[hash] = true
          const message = hellos[platform]
          await sendMessage(platform, `@${username} ${message[parseInt(Math.random() * message.length)]}`)
        }
      }
    }

    nextPlugin()
  }
}
