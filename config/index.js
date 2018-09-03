require('log4js').configure(require('path').join(__dirname, 'log4js.json'))
const config = require('config')
if (process.env['disable_mq']) delete config.modules['jm-user-mq']
module.exports = config
