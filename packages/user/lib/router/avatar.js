const { ms } = require('jm-server')

module.exports = function (service) {
  const router = ms.router()
  const saveAvatar = async ({ params: { id }, data: { imageData } } = {}) => {
    await service.avatar.save(id, imageData)
    return { ret: service.avatar.get(id) }
  }
  router
    .add('/', 'post', saveAvatar)
    .add('/', 'put', saveAvatar)
    .add('/', 'get', ({ params: { id } } = {}) => {
      return { ret: service.avatar.get(id) }
    })
  return router
}
