const mongoose = require('mongoose')

let Schema = mongoose.Schema

let schemaDefine = {
  uid: {type: Number, unique: true, sparse: true, index: true}, // 用户ID号
  account: {type: String, unique: true, sparse: true, index: true}, // 帐户
  email: {type: String, unique: true, sparse: true, index: true}, // 邮箱
  mobile: {type: String, unique: true, sparse: true, index: true}, // 手机号
  password: {type: String}, // 密码，按salt加密后的密文
  salt: {type: String},
  wechat: {type: String}, // 微信号
  nick: {type: String}, // 昵称，可重复
  avatarUrl: {type: String}, // 头像网址
  gender: {type: String}, // 性别
  country: {type: String}, // 国家
  province: {type: String}, // 省
  city: {type: String}, // 市
  area: {type: String}, // 区
  birthday: {type: Date}, // 生日
  active: {type: Boolean, default: true}, // 是否激活
  status: {type: Number, default: 1}, // -1:已删除 0:无效 1:有效
  creator: {type: Schema.Types.ObjectId, ref: 'user'}, // 创建人,介绍人等等
  crtime: {type: Date, default: Date.now}, // 创建时间
  moditime: {type: Date}, // 修改时间
  ip: {type: String}, // 注册时ip
  name: {type: String}, // 真实姓名
  idtype: {type: Number, default: 0}, // 身份证类型，默认0 居民身份证
  idcard: {type: String}, // 身份证号
  address: {type: String}, // 详细地址
  signature: {type: String}, // 签名
  tags: [String],
  ext: Schema.Types.Mixed // 其他，保留字段
}

module.exports = function (schema) {
  schema || (schema = new Schema())
  schema.add(schemaDefine)
  return schema
}
