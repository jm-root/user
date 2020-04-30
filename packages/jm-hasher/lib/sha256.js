const Mdl = require('./module')
const { createHash } = require('crypto')

module.exports = function () {
  return new Mdl(this, 'sha256', value => createHash('sha256').update(value).digest('hex'))
}
