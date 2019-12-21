const crypto = require('crypto')

function crypt (s) {
  let m = crypto.createHash('md5')
  m.update(s)
  return m.digest('hex')
}

function sha256 (s) {
  let m = crypto.createHash('sha256')
  m.update(s)
  return m.digest('hex')
}

module.exports = { md5: crypt, sha256 }
