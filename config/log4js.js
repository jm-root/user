module.exports = {
  appenders: {
    console: { type: 'console' },
    user: {
      type: 'dateFile',
      filename: 'logs/user',
      pattern: 'yyyyMMdd.log',
      alwaysIncludePattern: true
    }
  },
  categories: {
    default: { appenders: [ 'console' ], level: 'info' },
    user: { appenders: [ 'console', 'user' ], level: 'info' }
  }
}
