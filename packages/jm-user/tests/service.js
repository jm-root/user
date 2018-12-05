process.env.NODE_CONFIG_DIR = require('path').join(__dirname, '/../../../config')
const config = require('../../../config')
const $ = require('../lib')

let service = $(config)
service.log = (err, doc) => {
  if (err) { console.error(err.stack) }
  if (doc) console.log(doc)
}
module.exports = service
