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
    return ctx.data
  }

  async error(){
    throw new Error('123')
  }

  async throwByController() {
    return this.throw('C_USER_ERR', 'ERROR')
  }

  async throwByService() {
    return this.service.user.error()
  }
}
