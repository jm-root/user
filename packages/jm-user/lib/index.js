const log = require('jm-log4js')
const logger = log.getLogger('user')
const Service = require('./service')
const router = require('./router')

module.exports = function (opts = {}) {
  if (opts.debug) {
    logger.setLevel('debug')
  }
  let o = new Service(opts)
  o.router = router
  return o
}
