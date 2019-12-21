const fse = require('fs-extra')
const event = require('jm-event')

module.exports = function (service, opts = {}) {
  let root = opts.avatar_dir || process.cwd() + '/avatar'
  let prefix = opts.avatar_prefix || ''

  async function save (id, imageData) {
    const file = `${root}${prefix}/${id}.img`
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '')
    const dataBuffer = Buffer.from(base64Data, 'base64')
    return new Promise(function (resolve, reject) {
      fse.ensureFile(file, function (err) {
        if (err) throw err
        fse.writeFile(file, dataBuffer, function (err) {
          if (err) throw err
          resolve(true)
        })
      })
    })
  }

  function get (id) {
    return `${prefix}/${id}.img`
  }

  const model = { save, get }
  event.enableEvent(model)

  return model
}
