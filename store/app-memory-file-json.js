const fs                    = require('fs')
    , fse                   = require('fse')
    , path                  = require('path')
    , appMemoryFolderPath   = require('./app-memory-folder-path')

class AppMemoryFileJSON {
  constructor (filename, defaultData, interval) {
    this.filepath = path.join(appMemoryFolderPath, `${filename}.json`)
    this.defaultData = defaultData || ({})

    const _defaultData = JSON.stringify(this.defaultData)

    if (!fs.existsSync(this.filepath)) {
      fs.writeFileSync(this.filepath, _defaultData)
    }

    setInterval(async () => {
      this.data = await this.read()
    }, interval)
  }

  async read () {
    let data = null

    try {
      data = JSON.parse(await fse.readFileSync(this.filepath, 'utf8'))
    } catch (e) {
      data = this.defaultData
    }

    return data
  }

  async write (data) {
    try {
      await fse.writeFileSync(this.filepath, JSON.stringify(data))
      return true
    } catch (e) {
      return false
    }
  }

  readInterval () {
    return this.data || this.defaultData
  }
}

module.exports = AppMemoryFileJSON

/*

const mfJSON = new AppMemoryFileJSON('test')

;(async () => {
  setInterval(() => {
    const data = mfJSON.readInterval()
    console.log(data)
  }, 10)

  let i = 0
  setInterval(async () => {
    i++
    const data = await mfJSON.read()

    await mfJSON.write({
      ...data,
      a: i
    })
  }, 1000)
})()

*/
