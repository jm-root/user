const msm = require('jm-ms-mongoose')
const MS = require('jm-ms-core')
const mongoose = require('mongoose')

const ObjectId = mongoose.Types.ObjectId
const ms = new MS()
module.exports = function (service, opts = {}) {
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

  const router = ms.router()

  router
    // 根据传入的字段及值搜索用户，搜到返回user，否则返回{}
    .add('/findone', 'get', async ({ data }) => {
      const { user } = service
      const q = Object.keys(data).map(key => {
        const value = data[key]
        key === 'id' && (key = '_id')
        const o = {}
        o[key] = value
        return o
      })
      if (!q.length) return

      const doc = await user.findOne2({
        conditions: { '$or': q },
        lean: true
      })
      doc && (doc.id = doc._id.toString())
      return doc
    })
    .add('/', 'get', async opts => {
      let { q: search, conditions } = opts.data

      if (conditions) {
        if (typeof conditions === 'string') {
          conditions = JSON.parse(conditions)
        }
        opts.conditions = conditions
        return
      }

      if (!search) return

      let ary = []
      // 格式化特殊字符
      search = search.replace(/([`~!@#\$%\^\&\*\(\)_\+<>\?:"\{\},\.\\\/;'\[\]])/g, '\\$1') // eslint-disable-line
      let pattern = '.*?' + search + '.*?'
      if (ObjectId.isValid(search)) {
        ary.push({ _id: search })
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
    .add('/', 'post', async ({ data }) => {
      data.id && (data._id = data.id)
    })

  service.onReady()
    .then(() => {
      const { user } = service
      router.use(msm(user, {
        list: listOpts,
        get: getOpts
      }))

      // 拦截处理_id
      user
        .on('list', (opts, doc) => {
          if (doc && doc.rows) {
            for (const item of doc.rows) {
              item._id && (item.id = item._id.toString())
              const { creator } = item
              creator && creator._id && (creator.id = creator._id.toString())
            }
          }
        })
        .on('get', (opts, doc) => {
          if (doc) {
            const item = doc
            item._id && (item.id = item._id.toString())
            const { creator } = item
            creator && creator._id && (creator.id = creator._id.toString())
          }
        })
        .on('create', (opts, doc) => {
          doc && (doc.id = doc._id.toString())
        })
    })

  return router
}
