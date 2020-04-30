const Mdl = require('./module')
const sm3 = require('sm3')

module.exports = function () {
  return new Mdl(this, 'sm3', value => sm3(value))
}
