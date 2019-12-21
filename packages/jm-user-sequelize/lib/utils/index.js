const log = require('jm-log4js')
const { Op } = require('sequelize')
const genId = require('./genId')

const logger = log.getLogger('user')

module.exports = {
  genId,

  // 创建查询是否存在的router
  createExistsRouter (router, model, fields) {
    router.add('/:any/exists', 'get', async opts => {
      let { any } = opts.params
      any && (any = decodeURI(any))
      const where = {}
      for (const key of fields) {
        where[key] = any
      }
      const doc = await model.findOne({
        attributes: ['id'],
        where: {
          [Op.or]: where
        }
      })
      let ret = doc ? 1 : 0
      return { ret }
    })
  },

  // id 和 事件
  plusModelHook (model) {
    // 创建时，自动生成id
    model.beforeCreate(async item => {
      item.id || (item.id = genId())
    })

    model.afterCreate(async item => {
      const name = `${model.name}.create`
      const { id } = item
      model.service.emit(name, id)
      logger.info(name, id)
    })

    async function attachIds (item) {
      let doc = await model.findAll({
        where: item.where,
        attributes: ['id']
      })
      doc && (doc = doc.map(item => item.id))
      item.ids = doc
    }

    model.afterBulkUpdate(async item => {
      await attachIds(item)
      if (!item.ids) return
      for (const id of item.ids) {
        const name = `${model.name}.update`
        logger.info(name, id)
        await model.service.emit(name, id)
      }
    })

    model.beforeBulkDestroy(attachIds)

    model.afterBulkDestroy(async item => {
      if (!item.ids) return
      for (const id of item.ids) {
        const name = `${model.name}.delete`
        logger.info(name, id)
        await model.service.emit(name, id)
      }
    })
  }

}
