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
let ext = {
  a: 1234,
  o: {
    name: 1234,
    b: 3456
  },
  o2: {
    m: '222',
    n: 1
  },
  aa: [1, 3],
  ao: [{ a: 2 }, { c: 1 }]
}

let router = null
let service = null
beforeAll(async () => {
  await $.onReady()
  service = $
  router = $.router()
})

afterAll(async () => {
  await init()
})

let init = async function () {
  const { backend: { router } } = service
  const doc = await service.findUser(user.account)
  if (!doc) return
  await router.delete(`/${doc.id}`)
}

let prepare = async function () {
  await init()
  let doc = await service.signup(user)
  user.id = doc.id
  return doc
}

describe('router', () => {
  test('signon and updatePassword', async () => {
    let { id } = await prepare()
    const { account: username, password } = user
    let doc = await router.post(`/signon`, { username, password })
    console.log(doc)
    expect(doc.id === id).toBeTruthy()
    const newpassword = '888'
    await router.post(`/users/${id}/password`, { oldPassword: password, password: newpassword })
    doc = await router.post(`/signon`, { username, password: newpassword })
    console.log(doc)
    expect(doc.id === id).toBeTruthy()
  })

  test('exists', async () => {
    let doc = await prepare()
    doc = await router.get(`/users/${doc.id}/exists`)
    console.log(doc)
    expect(doc.ret).toBeTruthy()

    doc = await router.get(`/users/none/exists`)
    console.log(doc)
    expect(!doc.ret).toBeTruthy()
  })

  test('list', async () => {
    let doc = await prepare()
    doc = await router.get('/users', { rows: 2 })
    console.log(doc)
    expect(doc.page).toBeTruthy()
  })

  test('update ext', async () => {
    let doc = await prepare()
    let id = doc.id
    doc = await router.post(`/users/${id}/ext`, ext)
    console.log(doc)
    expect(doc.ret).toBeTruthy()
    doc = await router.get(`/users/${id}`)
    console.log('updateUserExt merge: \n%s', JSON.stringify(doc, null, 2))
  })

  test('update ext replace', async () => {
    let doc = await prepare()
    let id = doc.id
    doc = await router.post(`/users/${id}/extreplace`, ext)
    console.log(doc)
    expect(doc.ret).toBeTruthy()
    doc = await router.get(`/users/${id}`)
    console.log('updateUserExt extreplace: \n%s', JSON.stringify(doc, null, 2))
  })

  test('update ext assign', async () => {
    let doc = await prepare()
    let id = doc.id
    doc = await router.post(`/users/${id}/extassign`, ext)
    console.log(doc)
    expect(doc.ret).toBeTruthy()
    doc = await router.get(`/users/${id}`)
    console.log('updateUserExt extassign: \n%s', JSON.stringify(doc, null, 2))
  })
})
