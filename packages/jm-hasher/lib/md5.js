const Mdl = require('./module')
const { createHash } = require('crypto')

module.exports = function () {
  return new Mdl(this, 'md5', value => createHash('md5').update(value).digest('hex'))
}
