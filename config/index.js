require('log4js').configure(require('./log4js'))
process.env.NODE_CONFIG_DIR = require('path').join(__dirname)
const config = require('config')
if (process.env['disable_mq']) delete config.modules['jm-user-mq']
module.exports = config
