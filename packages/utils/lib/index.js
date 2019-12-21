const genId = require('./genId')
const { downloadBase64 } = require('./download')
const { md5, sha256 } = require('./crypt')

// 'a, b,c ' => ['a', 'b', 'c']
function split (fields) {
  if (!fields) return null
  if (Array.isArray(fields)) return fields
  fields = fields.split(',')
  return fields.map(item => item.trim())
}

module.exports = {
  genId,
  split,
  downloadBase64,
  md5,
  sha256
}
