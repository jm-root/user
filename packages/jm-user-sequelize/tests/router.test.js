const $ = require('./service')

let user = {
  account: 'jeff',
  password: '123',
  mobile: '13600000000',
  email: 'jeff@jamma.cn',
  nick: 'jeff',
  ext: {
    a: 123,
    o: {
      name: 123,
      b: 345
    },
    o1: 456,
    aa: [1, 2],
    ao: [{ a: 1 }, { b: 1 }]
  }
}

let router = null
let service = null
beforeAll(async () => {
  await $.onReady()
  service = $
  router = $.router
})

afterAll(async () => {
  await init()
})

let init = async function () {
  let doc = await service.user.destroy({ where: { account: user.account } })
  return doc
}

let prepare = async function () {
  await init()
  let doc = await service.user.create(user)
  return doc
}

describe('router', () => {
  test('findone', async () => {
    let doc = await prepare()
    doc = await router.get(`/findone`, { id: doc.id })
    console.log(doc)
    expect(doc).toBeTruthy()

    doc = await router.get(`/findone`, { account: 'none' })
    console.log(doc)
    expect(!doc).toBeTruthy()
  })

  test('list', async () => {
    let doc = await prepare()
    doc = await router.get('', { rows: 2 })
    console.log(doc)
    expect(doc.page).toBeTruthy()
  })
})
