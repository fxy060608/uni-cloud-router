const { Controller } = require('../../../dist/index')
module.exports =  class UserControoler extends Controller {
  async login() {
    const { ctx } = this
    ctx.body = { id: 1 }
  }
  async update() {
    const { ctx, service } = this
    ctx.body = service.user.login()
  }
}
