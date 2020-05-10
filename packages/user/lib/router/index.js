const avatar = require('./avatar')
const { ms } = require('jm-server')

module.exports = function (service, opts = {}) {
  async function signon (opts) {
    const { data: { username, password } } = opts
    return service.signon(username, password)
  }

  async function signup (opts) {
    const { ip, data } = opts
    if (ip) {
      data.ip = ip
    }
    let doc = await service.signup(data)
    return {
      id: doc.id,
      uid: doc.uid
    }
  }

  async function exists (opts) {
    const { params: { id } } = opts
    const doc = await service.findUser(id)
    if (doc) {
      return { ret: doc.id }
    } else {
      return { ret: false }
    }
  }

  async function updateUser (opts) {
    const { params: { id }, data } = opts
    await service.updateUser(id, data)
    return { ret: true }
  }

  async function updatePassword (opts) {
    const { params: { id }, data: { oldPassword, password } } = opts
    await service.updatePassword(
      id,
      oldPassword,
      password
    )
    return { ret: true }
  }

  async function updateExt (opts) {
    const { Mode } = service
    const { params: { id, extmode }, data } = opts
    let mode = Mode.merge
    if (extmode === 'ext') {
    } else if (extmode === 'extreplace') {
      mode = Mode.replace
    } else if (extmode === 'extassign') {
      mode = Mode.assign
    } else {
      return
    }
    await service.updateUserExt(id, data, mode)
    return { ret: true }
  }

  const router = ms.router()

  router
    .add('/signon', 'post', signon)
    .add('/signup', 'post', signup)
    .use('/users/:id/avatar', avatar(service, opts))
    .add('/users/:id/exists', 'get', exists)
    .add('/users', 'post', signup)
    .add('/users/:id', 'post', updateUser)
    .add('/users/:id/password', 'post', updatePassword)
    .add('/users/:id/password', 'put', updatePassword)
    .add('/users/:id/:extmode', 'post', updateExt)

  service.onReady().then(() => {
    router.use('/users', service.backend.router)
  })

  return router
}
