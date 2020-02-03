const mongoose = require('mongoose')
const event = require('jm-event')
const log = require('jm-log4js')
const logger = log.getLogger('user')
const user = require('./user')

/**
 * user service
 * @param {Object} opts
 * @example
 * opts参数:{
 *  db: 数据库
 *  model_name: 模型名称(可选，默认'user')
 *  table_name: (可选, 表名, 默认等于modelName)
 *  table_name_prefix: (可选, 表名前缀, 默认为'')
 *  disable_auto_uid: 是否禁止自动创建uid
 *  sequence_user_id: uid sequence
 *  schema: 表结构定义(可选, 如果不填采用默认表结构)
 *  schemaExt: 表结构扩展定义(可选, 对于schema扩展定义)
 * }
 * @return {Object} service
 */
class Service {
  constructor (opts = {}) {
    event.enableEvent(this, { async: true })
    this.onReady()

    const {
      debug,
      db
    } = opts

    Object.assign(this, {
      ready: false,
      router: require('../router')(this)
    })

    debug && (logger.setLevel('debug'))

    const onConnected = () => {
      this.emit('ready')
      logger.info('db connected. ready.')
    }
    const onDisconnected = () => {
      this.ready = false
      this.onReady()
      logger.info('db disconnected. not ready.')
    }

    let cb = () => {
      const db = mongoose.connection
      db.on('connected', onConnected)
      db.on('disconnected', onDisconnected)

      this.db = db
      this.sq = require('jm-sequence-mongoose')()
      this.user = user(this, opts)
      onConnected()
    }

    let p = null
    const _opts = {
      useCreateIndex: true,
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false
    }
    if (!db) {
      p = mongoose.connect(_opts)
    } else if (typeof db === 'string') {
      p = mongoose.connect(db, _opts)
    }
    p
      .then(cb)
      .catch(e => {
        logger.error(e.stack || e)
        process.exit()
      })
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
