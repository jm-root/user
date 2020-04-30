module.exports = class {
  constructor (app, name, fn) {
    Object.assign(this, { app, name })
    this.name = name
    app[name] = fn
  }

  unuse () {
    const { app, name } = this
    delete app[name]
  }
}
