const { Modulable } = require('jm-module')

class $ extends Modulable {
  constructor () {
    super()

    this
      .use(require('./md5'))
      .use(require('./sha256'))
      .use(require('./sm3'))
  }
}

$.Module = require('./module')
$.hasher = new $()
module.exports = $
