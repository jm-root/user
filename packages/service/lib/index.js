const log = require('jm-log4js')
const event = require('jm-event')
const t = require('locale')

const logger = log.getLogger('main')

class Service {
  constructor (opts = {}) {
    const { gateway, debug, app } = opts
    debug && (logger.setLevel('debug'))

    event.enableEvent(this, { sync: true })
    Object.assign(this, { app, logger, t })

    this.onReady()

    gateway && (this.gateway = new (require('./gateway'))({ gateway }))
  }

  async onReady () {
    if (this.ready) return
    return new Promise(resolve => {
      this.once('ready', () => {
        this.ready = true
        resolve()
      })
    })
  }
}

module.exports = Service
