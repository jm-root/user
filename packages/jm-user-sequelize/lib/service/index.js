const fs = require('fs')
const path = require('path')
const DAO = require('./dao')
const Associations = require('./associations')
const { Service } = require('jm-server')
const log = require('jm-log4js')
const logger = log.getLogger('user')

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
module.exports = class extends Service {
  constructor (opts = {}) {
    super(opts)
    const {
      debug
    } = opts

    debug && (logger.setLevel('debug'))

    this.db = require('./mysql')(opts)
    let db = this.db
    db.config = opts

    // 批量引入model
    let dir = path.join(__dirname, '/../schema')
    fs
      .readdirSync(dir)
      .filter(function (file) {
        return (file.indexOf('.') !== 0) && (file !== 'index.js')
      })
      .forEach(file => {
        const model = db.import(path.join(dir, file))
        model.service = this
        DAO(model)
        this[model.name] = model
      })

    Associations(this)

    // 必须在建立模型之后才可以创建router
    this.router = require('../router')(this)

    db
      .sync()
      .then(() => {
        this.emit('ready')
      })
      .catch(e => {
        logger.error(e)
        process.exit()
      })
  }
}
