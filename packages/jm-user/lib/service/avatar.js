const fse = require('fs-extra')
const event = require('jm-event')

module.exports = function (service, opts = {}) {
  let root = opts.avatar_dir || process.cwd() + '/avatar'
  let prefix = opts.avatar_prefix || ''

  async function save (id, imageData) {
    const file = `${root}${prefix}/${id}.img`
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '')
    const dataBuffer = Buffer.from(base64Data, 'base64')
    await fse.ensureFile(file)
    await fse.writeFile(file, dataBuffer)
    return true
  }

  function get (id) {
    return `${prefix}/${id}.img`
  }

  const model = { save, get }
  event.enableEvent(model)

  return model
}
