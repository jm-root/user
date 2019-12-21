const jm = require('jm-dao')
const event = require('jm-event')
const _schema = require('../schema/user')
const consts = require('../consts')

let Err = consts.Err

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
  if (!disableAutoUid) {
    schema.pre('save', function (next) {
      let self = this
      if (self.uid !== undefined) return next()
      schema.createUid(function (err, val) {
        if (err) {
          return next(err)
        }
        self.uid = val
        next()
      })
    })

    schema.createUid = function (cb) {
      sq.next(sequenceUserId, {}, function (err, val) {
        if (err) {
          return cb(err, Err.FA_CREATE_USER_UID)
        }
        cb(null, val)
      })
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

  let model = jm.dao({
    db: service.db,
    modelName,
    tableName,
    prefix,
    schema,
    schemaExt
  })
  event.enableEvent(model, { force: true, clean: true })

  return model
}
