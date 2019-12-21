module.exports = function (service) {
  const { user } = service
  user.belongsTo(user, { as: 'creator', constraints: false })
}
