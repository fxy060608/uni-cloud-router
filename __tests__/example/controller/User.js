const { Controller } = require('../../../dist/index')
module.exports = class UserControoler extends Controller {
  async login() {
    const { ctx } = this
    return { id: 1 }
  }
  async update() {
    const { ctx, service } = this
    return await service.user.login()
  }
  async data() {
    const { ctx } = this
    return ctx.data.body
  }
}
