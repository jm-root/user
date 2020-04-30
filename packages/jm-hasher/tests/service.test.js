const { hasher: service } = require('../lib')

describe('service', () => {
  test('md5', async () => {
    console.log(service.md5('123'))
  })

  test('sha256', async () => {
    console.log(service.sha256('123'))
  })

  test('sm3', async () => {
    console.log(service.sm3('123'))
  })
})
