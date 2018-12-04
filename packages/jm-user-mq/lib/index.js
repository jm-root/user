const log = require('jm-log4js')
const logger = log.getLogger('user')
const MS = require('jm-ms')

let ms = new MS()

module.exports = function (opts, app) {
  let o = {
    ready: true,

    onReady: function () {
      return this.ready
    }
  }

  let bind = async (name, uri) => {
    uri || (uri = '/' + name)
    o[name] = await ms.client({
      uri: opts.gateway + uri
    })
  }
  bind('mq')

  if (!app.modules.user) {
    logger.warn('no user module found. so I can not work.')
    return o
  }
  if (!opts.gateway) {
    logger.warn('no gateway config. so I can not work.')
    return o
  }

  let user = app.modules.user

  let send = async function (topic, message) {
    return o.mq.post(`/${topic}`, {message})
      .catch(e => {
        logger.error(`send mq fail. topic: ${topic} message: ${JSON.stringify(message)}`)
        logger.error(e)
      })
  }
  user
    .on('signon', function (opts) {
      opts && (send('user.signon', opts))
    })
    .on('singup', function (opts) {
      opts && (send('user.singup', opts))
    })
    .on('user.status', function (opts) {
      opts && (send('user.status', opts))
    })
    .on('user.update', function (opts) {
      opts && (send('user.update', opts))
    })
    .on('user.remove', function (opts) {
      opts && (send('user.remove', opts))
    })
}
