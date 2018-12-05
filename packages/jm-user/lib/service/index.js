const _ = require('lodash')
const validator = require('validator')
const bson = require('bson')
const jm = require('jm-dao')
const event = require('jm-event')
const error = require('jm-err')
const log = require('jm-log4js')
const crypto = require('crypto')
const consts = require('../consts')
const logger = log.getLogger('user')
const t = require('../locale')
const user = require('./user')
const avatar = require('./avatar')

let Err = consts.Err
let Mode = consts.Mode

let isMobile = function (mobile) {
  let pattern = /^1[3,4,5,7,8]{1}[0-9]{9}$/
  return pattern.test(mobile)
}

let hash = function (key) {
  let sha256 = crypto.createHash('sha256')
  sha256.update(key)
  return sha256.digest('hex')
}

/**
 * user service
 * @param {Object} opts
 * @example
 * opts参数:{
 *  db: 数据库
 *  secret: (可选, 密钥, 用于加密明文密码, 默认'')
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
    event.enableEvent(this)
    this.ready = false
    this.hash = hash
    this.t = t
    this.Mode = Mode
    this.secret = opts.secret || ''

    const onConnected = () => {
      this.emit('ready')
      logger.info('db connected. ready.')
    }
    const onDisconnected = () => {
      this.ready = false
      this.onReady()
      logger.info('db disconnected. not ready.')
    }

    let cb = db => {
      db.on('connected', onConnected)
      db.on('disconnected', onDisconnected)

      this.db = db
      this.sq = jm.sequence({db})
      this.user = user(this, opts)
      this.avatar = avatar(this, opts)
      onConnected()
    }

    const db = opts.db
    let p = null
    if (!db) {
      p = jm.db.connect()
    } else if (typeof db === 'string') {
      p = jm.db.connect(db)
    }
    p
      .then(cb)
      .catch(e => {
        logger.error(e)
        process.exit(Err.FA_CONNECT_DB.err)
      })

    this.onReady()
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

  createKey (key = '') {
    key += this.secret + Math.random() + Date.now().toString()
    return hash(key)
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
    password = hash(password + salt)
    return {password, salt}
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
    return passwordEncrypted.password === hash(password + passwordEncrypted.salt)
  }

  validate (opts) {
    return Promise.resolve()
      .then(function () {
        if (opts.account && !isNaN(opts.account)) throw error.err(Err.FA_INVALID_ACCOUNT)
        if (opts.email && !validator.isEmail(opts.email)) throw error.err(Err.FA_INVALID_EMAIL)
        if (opts.mobile && !isMobile(opts.mobile)) throw error.err(Err.FA_INVALID_MOBILE)
        return null
      })
  }

  /**
   * 更新用户信息
   * @param {string} id
   * @param {Object} opts
   * @param cb
   */
  updateUser (id, opts, cb) {
    let self = this
    let c = {_id: id}

    if (opts.password && !opts.salt) {
      let o = this.encryptPassword(opts.password)
      opts.password = o.password
      opts.salt = o.salt
    }

    opts.moditime = Date.now()
    return this.validate(opts)
      .then(function () {
        return self.user.update(c, opts, cb)
      })
  }

  /**
   * 更新用户扩展信息
   * @param id
   * @param opts
   * @param mode 参考service.Mode
   * @param cb
   */
  updateUserExt (id, opts, mode, cb) {
    if (typeof mode === 'function') {
      cb = mode
      mode = Mode.merge
    }

    if (cb) {
      this.updateUserExt(id, opts, mode)
        .then(function (doc) {
          cb(null, doc)
        })
        .catch(function (err) {
          cb(err)
        })
      return this
    }

    return this.user.findById(id)
      .then(function (doc) {
        if (!doc) throw error.err(Err.FA_USER_NOT_EXIST)
        !doc.ext && (doc.ext = {})
        let ext = doc.ext
        if (mode === Mode.replace) {
          doc.ext = opts
        } else if (mode === Mode.assign) {
          doc.ext = Object.assign({}, ext, opts)
        } else {
          doc.ext = _.merge(doc.ext, opts)
        }
        doc.moditime = Date.now()
        doc.markModified('ext')
        return doc.save()
      })
  }

  /**
   * 修改密码
   * @param oldPassword
   * @param password
   * @param cb
   */
  updatePassword (id, oldPassword, password, cb) {
    if (cb) {
      this.updatePassword(id, oldPassword, password)
        .then(function (doc) {
          cb(null, doc)
        })
        .catch(function (err) {
          cb(err)
        })
      return this
    }

    let self = this
    return this.user.findById(id)
      .then(function (doc) {
        if (!doc) throw error.err(Err.FA_USER_NOT_EXIST)

        if (!self.checkPassword(doc, oldPassword)) {
          throw error.err(Err.FA_INVALID_PASSWD)
        }

        let o = {
          password: password
        }
        return self.updateUser(id, o, cb)
      })
  }

  /**
   * 查找一个用户
   * @param {*} username 查找项
   * @param cb
   */
  findUser (username, cb) {
    let query = []
    if (typeof username === 'number' || validator.isInt(username)) {
      if (isMobile(username)) {
        query.push({
          mobile: username
        })
      } else {
        query.push({
          uid: username
        })
      }
    } else if (validator.isEmail(username)) {
      query.push({
        email: username
      })
    } else if (bson.ObjectId.isValid(username)) {
      query.push({
        _id: username
      })
    } else {
      query.push({
        account: username
      })
    }

    return this.user.findOne({'$or': query}, cb)
  }

  /**
   * 登陆
   * @param {String|number|*} username
   * @param {String} password
   * @param cb
   */
  async signon (username, password) {
    let doc = await this.findUser(username)
    if (!doc) throw error.err(Err.FA_USER_NOT_EXIST)
    if (!doc.active) throw error.err(Err.FA_ACCOUNT_BAN)
    if (!this.checkPassword(doc, password)) throw error.err(Err.FA_INVALID_PASSWD)
    this.emit('signon', {id: doc.id})
    return {id: doc.id}
  }

  /**
   * 注册
   * @example
   * signup({
      *     account: 'jeff',
      *     password: '123'
      * })
   * @param {Object} opts - 参数
   * @param {Function} cb - callback
   * @return {Promise}
   */
  signup (opts, cb) {
    let self = this
    if (cb) {
      this.signup(opts)
        .then(function (doc) {
          cb(null, doc)
        })
        .catch(function (err) {
          cb(err)
        })
      return this
    }
    let data = {}
    _.defaults(data, opts)
    if (data.password && !data.salt) {
      let p = this.encryptPassword(data.password)
      data.password = p.password
      data.salt = p.salt
    }

    let query = []
    if (data.mobile) {
      query.push({
        mobile: data.mobile
      })
    }
    if (data.uid) {
      query.push({
        uid: data.uid
      })
    }
    if (data.account) {
      query.push({
        account: data.account
      })
    }
    if (data.email) {
      query.push({
        email: data.email
      })
    }
    // 允许游客注册
    if (!query.length) {
      return self.user
        .create(data)
        .then(function (doc) {
          self.emit('signup', {id: doc.id})
          return doc
        })
    }
    return this.validate(data)
      .then(function () {
        return self.user.findOne({'$or': query})
      })
      .then(function (doc) {
        if (doc) return Promise.reject(error.err(Err.FA_USER_EXIST))
        return self.user.create(data)
      })
      .then(function (doc) {
        self.emit('signup', {id: doc.id})
        return doc
      })
  }
}

module.exports = Service
