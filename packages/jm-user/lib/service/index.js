const _ = require('lodash')
const validator = require('validator')
const bson = require('bson')
const error = require('jm-err')
const log = require('jm-log4js')
const hasher = require('jm-hasher')
const { utils } = require('jm-utils')
const { Service } = require('jm-server')

const consts = require('../consts')
const logger = log.getLogger('user')
const t = require('../locale')
const avatar = require('./avatar')
const BackendMongoose = require('jm-user-mongoose')
const BackendSequelize = require('jm-user-sequelize')

const { Err, Mode } = consts

function isMobile (mobile) {
  let pattern = /^1[3456789]\d{9}$/
  return pattern.test(mobile)
}

function validate ({ account, email, mobile }) {
  if (account && !isNaN(account)) throw error.err(Err.FA_INVALID_ACCOUNT)
  if (email && !validator.isEmail(email)) throw error.err(Err.FA_INVALID_EMAIL)
  if (mobile && !isMobile(mobile)) throw error.err(Err.FA_INVALID_MOBILE)
}

/**
 * user service
 * @param {Object} opts
 * @example
 * opts参数:{
 *  db: 数据库
 *  secret: (可选, 密钥, 用于加密明文密码, 默认'')
 *  hash: (可选, 密码哈希算法, 支持sha256, md5, sm3, 默认'sha256')
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
      debug,
      db,
      secret = '',
      hash = 'sha256'
    } = opts

    Object.assign(this, {
      secret,
      hash: hasher[hash],
      t,
      Mode,
      avatar: avatar(this, opts)
    })

    debug && (logger.setLevel('debug'))

    if (!db) {
      logger.error('no db config!')
      process.exit()
    }
    const dbtype = utils.getUriProtocol(db)
    if (!dbtype) {
      logger.error('database type not found!')
      process.exit()
    }
    if (dbtype === 'mongodb') {
      this.backend = new BackendMongoose(opts)
    } else {
      this.backend = new BackendSequelize(opts)
    }

    this.backend.onReady().then(() => {
      this.emit('ready')
    })

    const events = ['create', 'update', 'delete', 'status']
    events.forEach(key => {
      key = `user.${key}`
      this.backend.on(key, opts => { this.emit(key, opts) })
    })
  }

  createKey (key = '') {
    key += this.secret + Math.random() + Date.now().toString()
    return this.hash(key)
  }

  /**
   * 对密码加密
   * @param {String} password  密码明文
   * @return {Object} 返回加密后的密码对象
   * @example
   * 返回结果:{
     *  salt: 密钥
     *  password: 密码密文
     * }
   */
  encryptPassword (password) {
    if (!password) return null
    let salt = this.createKey('')
    password = this.hash(password + salt)
    return { password, salt }
  }

  /**
   * 验证密码
   * @param {Object} passwordEncrypted 密码密钥和密文
   * @example
   * passwordEncrypted参数:{
     *  salt: 密钥(必填)
     *  password: 密码密文(必填)
     * }
   * @param {string} password 密码明文
   * @return {boolean}
   */
  checkPassword (passwordEncrypted, password) {
    if (!passwordEncrypted || !password) return false
    return passwordEncrypted.password === this.hash(password + passwordEncrypted.salt)
  }

  /**
   * 更新用户信息
   * @param {string} id
   * @param {Object} opts
   */
  async updateUser (id, opts) {
    validate(opts)

    const { backend: { router } } = this
    const { password, salt } = opts

    if (password && !salt) {
      const o = this.encryptPassword(password)
      Object.assign(opts, o)
    }

    return router.put(`/${id}`, opts)
  }

  /**
   * 更新用户扩展信息
   * @param id
   * @param opts
   * @param mode 参考service.Mode
   */
  async updateUserExt (id, opts, mode = Mode.merge) {
    const { backend: { router } } = this
    const doc = await router.get(`/${id}`)
    if (!doc) throw error.err(Err.FA_USER_NOT_EXIST)
    doc.ext || (doc.ext = {})
    if (mode === Mode.replace) {
      doc.ext = opts
    } else if (mode === Mode.assign) {
      Object.assign(doc.ext, opts)
    } else {
      doc.ext = _.merge(doc.ext, opts)
    }
    return this.updateUser(id, { ext: doc.ext })
  }

  /**
   * 修改密码
   * @param oldPassword
   * @param password
   */
  async updatePassword (id, oldPassword, password) {
    const doc = await this.findUser(id)
    if (!doc) throw error.err(Err.FA_USER_NOT_EXIST)
    if (!this.checkPassword(doc, oldPassword)) {
      throw error.err(Err.FA_INVALID_PASSWD)
    }
    return this.updateUser(id, { password })
  }

  /**
   * 查找一个用户, 需要返回完整数据，包括password和salt
   * @param {*} q 查找项
   */
  async findUser (q) {
    const { backend: { router } } = this
    let query = {}
    if (typeof q === 'number' || validator.isInt(q)) {
      if (isMobile(q)) {
        query.mobile = q
      } else {
        query.uid = q
      }
    } else if (validator.isEmail(q)) {
      query.email = q
    } else if (bson.ObjectId.isValid(q) && q.length === 24) {
      query.id = q
    } else {
      query.account = q
    }

    return router.get(`/findone`, query)
  }

  /**
   * 登陆
   * @param {String|number|*} username
   * @param {String} password
   */
  async signon (username, password) {
    let doc = await this.findUser(username)
    if (!doc) throw error.err(Err.FA_USER_NOT_EXIST)
    if (!doc.active) throw error.err(Err.FA_ACCOUNT_BAN)
    if (!this.checkPassword(doc, password)) throw error.err(Err.FA_INVALID_PASSWD)
    const { id, uid } = doc
    this.emit('user.signon', { id })
    return { id, uid }
  }

  /**
   * 注册
   * @example
   * signup({
      *     account: 'jeff',
      *     password: '123'
      * })
   * @param {Object} opts - 参数
   * @return {Promise}
   */
  async signup (opts) {
    const { backend: { router } } = this
    const data = Object.assign({}, opts)
    const { password, salt, id, mobile, uid, account, email } = data
    if (password && !salt) {
      const p = this.encryptPassword(password)
      Object.assign(data, p)
    }

    const query = {}
    id && (query.id = id)
    mobile && (query.mobile = mobile)
    uid && (query.uid = uid)
    account && (query.account = account)
    email && (query.email = email)

    validate(data)

    if (Object.keys(query).length) {
      const doc = await router.get(`/findone`, query)
      if (doc) throw error.err(Err.FA_USER_EXIST)
    }

    const doc = await router.post('/', data)
    this.emit('user.signup', { id: doc.id })
    return doc
  }
}
