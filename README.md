# user

用户系统

## 配置参数

基本配置 请参考 [jm-server] (https://github.com/jm-root/ms/tree/master/packages/jm-server)

db [] mongodb服务器Uri

secret [''] 密钥

sequence_user_id ['userId'] uid序列名称

table_name [''] 表名称, 默认 user

table_name_prefix [''] 表名称前缀

disable_auto_uid [false] 禁用自动Uid生成

gateway Gateway服务器Uri, 如果配置了此参数，自动启用jm-user-mq
