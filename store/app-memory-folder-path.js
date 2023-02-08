const path = require('path')

const [repository, app] = process.argv.slice(2)
module.exports = path.join(__dirname, '../../../../../../memory', repository, app)
