module.exports = {
  db: 'db',
  secret: 'secret',
  sequence_user_id: 'sequence_user_id',
  table_name: 'table_name',
  disable_auto_uid: 'disable_auto_uid',
  avatar_prefix: 'avatar_prefix',
  avatar_dir: 'avatar_dir',
  table_name_prefix: 'table_name_prefix',
  service_name: 'service_name',
  hash: 'hash',
  modules: {
    'jm-server-jaeger': {
      config: {
        jaeger: 'jaeger'
      }
    },
    'jm-user-mq': {
      config: {
        gateway: 'gateway'
      }
    }
  }
}
