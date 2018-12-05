const MS = require('jm-ms-core')
let ms = new MS()
module.exports = function (service, opts) {
  let router = ms.router()
  router
    .add('/', 'post', async function (opts = {}) {
      await service.avatar.save(opts.params.id, opts.data.imageData)
      return { ret: service.avatar.get(opts.params.id) }
    })
    .add('/', 'get', function (opts) {
      return { ret: service.avatar.get(opts.params.id) }
    })
  return router
}
