# jm-user

general user service

## use:

```javascript
var s = require('jm-user')();
```

## run:

```javascript
npm start
```

## 配置参数

基本配置 请参考 [jm-server] (https://github.com/jm-root/jm-server)

db [] mongodb服务器Uri

secret [''] 密钥

sequence_user_id ['userId'] uid序列名称

model_name ['user'] model名称

table_name [''] 表名称, 默认同modelName

table_name_prefix [''] 表名称前缀

disable_auto_uid [false] 禁用自动Uid生成
