const avatar = require('./avatar')
const MS = require('jm-ms-core')

let ms = new MS()
module.exports = function (service, opts = {}) {
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

  const router = ms.router()

  router
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

  service.onReady()
    .then(doc => {
      router.use('/users', service.backend.router)
    })

  return router
}
