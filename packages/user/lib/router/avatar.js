const { ms } = require('jm-server')

module.exports = function (service) {
  const router = ms.router()
  router
    .add('/', 'post', async ({ params: { id }, data: { imageData } } = {}) => {
      await service.avatar.save(id, imageData)
      return { ret: service.avatar.get(id) }
    })
    .add('/', 'get', ({ params: { id } } = {}) => {
      return { ret: service.avatar.get(id) }
    })
  return router
}
