const MS = require('jm-ms')
const ms = new MS()

/**
 * 创建Gateway
 * @class Gateway
 */
module.exports = class {
  /**
   * 构造
   * @param {object} gateway -
   */
  constructor ({ gateway }) {
    Object.assign(this, { gateway })
  }

  /**
   * 建立服务访问绑定
   * @param {string} name 服务名
   * @param {string} uri 访问路径
   * @returns {Promise<*>} -
   */
  async bind (name, uri) {
    uri || (uri = `/${name}`)
    uri.indexOf('://') === -1 && (uri = this.gateway + uri)
    const doc = await ms.client({ uri })
    this[name] = doc
    return doc
  }
}
