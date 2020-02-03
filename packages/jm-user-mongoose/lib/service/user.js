const mongoose = require('mongoose')
const event = require('jm-event')
const _schema = require('../schema/user')
const consts = require('../consts')

module.exports = function (service, opts = {}) {
  const modelName = 'user'
  const {
    table_name: tableName,
    table_name_prefix: prefix = '',
    schemaExt,
    disable_auto_uid: disableAutoUid,
    sequence_user_id: sequenceUserId = consts.SequenceUserId
  } = opts

  let sq = service.sq
  let schema = opts.schema || _schema()
  schemaExt && (schema.add(schemaExt))

  if (!disableAutoUid) {
    schema.pre('save', async function (next) {
      let self = this
      if (self.uid !== undefined) return next()
      self.uid = await schema.createUid()
      next()
    })

    schema.createUid = async function () {
      return sq.next(sequenceUserId)
    }
  }

  schema
    .post('save', function (doc) {
      doc && (service.emit(`${modelName}.update`, { id: doc.id }))
    })
    .post('remove', function (doc) {
      doc && (service.emit(`${modelName}.delete`, { id: doc.id }))
    })
    .post('findOneAndRemove', function (doc) {
      doc && (service.emit(`${modelName}.delete`, { id: doc.id }))
    })
    .post('update', function (doc) {
      if (!doc.result.nModified) return
      this.model
        .find(this._conditions)
        .then(function (docs) {
          docs.forEach(function (doc) {
            service.emit(`${modelName}.update`, { id: doc.id })
          })
        })
    })
    .post('findOneAndUpdate', function (doc) {
      doc && (service.emit(`${modelName}.update`, { id: doc.id }))
    })

  const model = mongoose.model(modelName, schema, `${prefix}${tableName || modelName}`)
  event.enableEvent(model, { force: true, clean: true })

  return model
}
