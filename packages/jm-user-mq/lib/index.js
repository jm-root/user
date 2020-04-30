const log = require('jm-log4js')
const logger = log.getLogger('user')
const { Service } = require('jm-server')

class $ extends Service {
  constructor (opts, app) {
    super(opts)
    const { gateway } = opts
    const { user } = app.modules

    if (!gateway) {
      logger.warn('no gateway config. I will not work.')
      return
    }

    if (!user) {
      logger.warn('no user module found. I will not work.')
      return
    }

    require('./gateway')({ gateway }).then(doc => {
      doc.bind('mq')
      this.gateway = doc
      this.emit('ready')
    })

    const events = ['signon', 'singup', 'create', 'update', 'delete', 'status']
    events.forEach(key => {
      key = `user.${key}`
      user.on(key, opts => {
        opts && (this.send(key, opts))
      })
    })
  }

  async send (topic, message) {
    await this.onReady()
    const msg = `topic: ${topic} message: ${JSON.stringify(message)}`
    try {
      logger.debug(`send mq. ${msg}`)
      await this.gateway.mq.post(`/${topic}`, { message })
    } catch (e) {
      logger.error(`send mq fail. ${msg}`)
      logger.error(e)
    }
  }
}

module.exports = function (opts, app) {
  return new $(opts, app)
}
