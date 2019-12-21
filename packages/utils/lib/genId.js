const { ObjectId } = require('bson')

module.exports = function genId () {
  return new ObjectId().toString()
}
