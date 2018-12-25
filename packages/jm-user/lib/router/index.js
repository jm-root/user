const wrapper = require('jm-ms-wrapper')
const error = require('jm-err')
const msm = require('jm-ms-mongoose')
const avatar = require('./avatar')
const MS = require('jm-ms-core')
const mongoose = require('mongoose')
const help = require('./help')

let ObjectId = mongoose.Types.ObjectId
let ms = new MS()
let Err = error.Err
module.exports = function (opts = {}) {
  let service = this

  let listOpts = opts.list || {
    conditions: {},
    options: {
      sort: [{ 'crtime': -1 }]
    },
    fields: {
      salt: 0,
      password: 0
    },
    populations: {
      path: 'creator',
      select: {
        nick: 1
      }
    }
  }

  let getOpts = opts.get || {
    fields: {
      salt: 0,
      password: 0
    },
    populations: {
      path: 'creator',
      select: {
        nick: 1
      }
    }
  }

  let filterReady = async opts => {
    if (!service.ready) {
      throw error.err(Err.FA_NOTREADY)
    }
  }

  let signon = async opts => {
    return service.signon(opts.data.username, opts.data.password)
  }

  let signup = async opts => {
    if (opts.ip) {
      opts.data.ip = opts.ip
    }
    let doc = await service.signup(opts.data)
    return {
      id: doc.id,
      uid: doc.uid
    }
  }

  let updateExt = async opts => {
    let mode = service.Mode.merge
    if (opts.params.extmode === 'ext') {
    } else if (opts.params.extmode === 'extreplace') {
      mode = service.Mode.replace
    } else if (opts.params.extmode === 'extassign') {
      mode = service.Mode.assign
    } else {
      return
    }
    await service.updateUserExt(opts.params.id, opts.data, mode)
    return { ret: 1 }
  }

  let router = ms.router()
  wrapper(service.t)(router)

  router
    .use(help(service))
    .use(filterReady)
    .add('/signon', 'post', signon)
    .add('/signup', 'post', signup)
    .use('/users/:id/avatar', avatar(service, opts))
    .add('/users/:id/exists', 'get', async opts => {
      const doc = await service.findUser(opts.params.id)
      if (doc) {
        return { ret: doc.id }
      } else {
        return { ret: false }
      }
    })
    .add('/users', 'post', signup)
    .add('/users/:id', 'post', async opts => {
      await service.updateUser(opts.params.id, opts.data)
      return { ret: 1 }
    })
    .add('/users/:id/password', 'post', async opts => {
      await service.updatePassword(opts.params.id, opts.data.oldPassword, opts.data.password)
      return { ret: 1 }
    })
    .add('/users/:id/:extmode', 'post', updateExt)
    .add('/users', 'get', async opts => {
      // search
      let search = opts.data.search
      if (!search) {
        let { conditions } = opts.data
        if (typeof conditions === 'string') {
          conditions = JSON.parse(conditions)
        }
        conditions && (opts.conditions = conditions)
        return
      }
      let ary = []
      // 格式化特殊字符
      search = search.replace(/([`~!@#\$%\^\&\*\(\)_\+<>\?:"\{\},\.\\\/;'\[\]])/g, '\\$1') // eslint-disable-line
      let pattern = '.*?' + search + '.*?'
      if (ObjectId.isValid(search)) {
        ary.push({ _id: search })
        ary.push({ ip: { $regex: pattern, $options: 'i' } })
        ary.push({ account: { $regex: pattern, $options: 'i' } })
      } else if (!isNaN(search)) {
        ary.push({ uid: Number(search) })
        ary.push({ mobile: { $regex: pattern } })
        ary.push({ account: { $regex: pattern, $options: 'i' } })
      } else {
        ary.push({ account: { $regex: pattern, $options: 'i' } })
        ary.push({ mobile: { $regex: pattern } })
        ary.push({ nick: { $regex: pattern, $options: 'i' } })
        ary.push({ ip: { $regex: pattern, $options: 'i' } })
        ary.push({ mac: { $regex: pattern, $options: 'i' } })
      }
      opts.conditions || (opts.conditions = {})
      opts.conditions.$or = ary
    })

  service.onReady()
    .then(doc => {
      router.use('/users', msm(service.user, {
        list: listOpts,
        get: getOpts
      }))
    })

  return router
}
