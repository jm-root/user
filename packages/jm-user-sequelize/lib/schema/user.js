const { plusModelHook } = require('../utils')

module.exports = function (sequelize, DataTypes) {
  const modelName = 'user'
  const { config: {
    table_name: tableName,
    table_name_prefix: prefix = ''
  } = {} } = sequelize

  const model = sequelize.define(modelName,
    {
      id: { type: DataTypes.STRING(50), primaryKey: true },
      uid: { type: DataTypes.INTEGER, unique: true, autoIncrement: true, comment: '用户ID号' },
      account: { type: DataTypes.STRING(50), unique: true, comment: '帐户' },
      email: { type: DataTypes.STRING(50), unique: true, comment: '邮箱' },
      mobile: { type: DataTypes.STRING(20), unique: true, comment: '手机号' },
      password: { type: DataTypes.STRING(128), comment: '密码，按salt加密后的密文' },
      salt: { type: DataTypes.STRING(128) },
      wechat: { type: DataTypes.STRING(50), comment: '微信号' },
      nick: { type: DataTypes.STRING(50), comment: '昵称，可重复' },
      avatarUrl: { type: DataTypes.STRING(250), comment: '头像网址' },
      gender: { type: DataTypes.TINYINT, defaultValue: 0, comment: '性别 默认0未知 1男 2女' },
      age: { type: DataTypes.TINYINT, defaultValue: 0, comment: '年龄' },
      country: { type: DataTypes.STRING(50), comment: '国家' },
      province: { type: DataTypes.STRING(50), comment: '省' },
      city: { type: DataTypes.STRING(50), comment: '市' },
      area: { type: DataTypes.STRING(50), comment: '区' },
      birthday: { type: DataTypes.DATE, comment: '生日' },
      active: { type: DataTypes.TINYINT, defaultValue: 1, comment: '是否激活' },
      status: { type: DataTypes.TINYINT, defaultValue: 1, comment: '-1:已删除 0:无效 1:有效' },
      ip: { type: DataTypes.STRING(50), comment: '注册时ip' },
      name: { type: DataTypes.STRING(50), comment: '真实姓名' },
      idtype: { type: DataTypes.INTEGER, defaultValue: 0, comment: '身份证类型，默认0 居民身份证' },
      idcard: { type: DataTypes.STRING(50), comment: '身份证号' },
      address: { type: DataTypes.STRING(250), comment: '详细地址' },
      signature: { type: DataTypes.STRING(250), comment: '签名' },
      tags: { type: DataTypes.JSON, comment: '标签' },
      ext: { type: DataTypes.JSON, comment: '附加信息' }
    },
    {
      tableName: `${prefix}${tableName || modelName}`,
      createdAt: 'crtime',
      updatedAt: 'moditime',
      deletedAt: 'deltime'
    })

  // model.belongsTo(model, { as: 'creator', constraints: false })

  plusModelHook(model)

  return model
}
