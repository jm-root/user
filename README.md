# user

用户账号系统, 用于存储用户基本信息和密码管理

## Features
- 账号信息登记
- 账号登录验证

  支持方式：
  - id验证
  - 账号验证
  - 邮箱验证
  - 手机号验证
  - 密码验证
  
- 基本信息更改
  
## 服务说明
- 服务基于[`jm-server`](https://github.com/jm-root/server/tree/master/packages/jm-server)框架建立
- 密码加密方式有：md5、sha256、sm3
- 数据库存储方式支持mongodb和mysql, 可根据db配置参数决定采用方式
- 需要开启操作事件监听, 可通过gateway配置参数开启, 需与[`mq`](https://github.com/jm-root/mq)服务搭配使用
    - 事件监听有: ['user.signon','user.singup','user.create','user.update','user.delete','user.status']
- 搭配使用服务
    - [gateway](https://github.com/jm-root/gateway)(网关服务,代理其它服务接口调用)
    - [passport](https://github.com/jm-root/passport)(该服务将通过gateway服务调用user服务相应接口实现账号注册和登录功能,详细说明请看passport服务)
    - [mq](https://github.com/jm-root/mq)(消息队列服务)
    
## 详细API
API文档请参见：[swagger文档](http://apidoc.jamma.cn/?urls.primaryName=user%202.1)
  
## 构建运行
````
// 安装依赖包
lerna bootstrap
// 项目启动
npm run start
````

## 部署

采用docker部署，容器默认监听80端口

docker镜像: `jamma/user`

环境变量见后面的[环境变量](#环境变量)说明
````
docker run -d name user  -e xxx jamma/user
````

## 环境变量

基本配置 请参考 [jm-server](https://github.com/jm-root/server/tree/master/packages/jm-server)

| 配置项           | 默认值        | 描述        |
| :---             |  :---:       | :---        |
|db                |              |必填, 数据库连接地址, 如：mysql://xxx或mongodb://xxx|
|secret            |""            |密钥, 用于加密明文密码|
|hash              |"sha256"      |密码哈希算法, 支持sha256, md5, sm3|
|table_name        |"user"        |数据表定义名称|
|table_name_prefix |""            |数据表名称前缀|
|sequence_user_id  |"userId"      |uid序列名称|
|disable_auto_uid  |false         |是否禁用自动Uid生成|
|service_name      |"user"        |链路追踪登记的服务名称|
|jaeger            |              |选填, 链路跟踪, 默认不开启, 如配置了链路地址将开启|
|gateway           |              |选填, Gateway服务器Uri, 如果配置了此参数，自动启用jm-user-mq|

