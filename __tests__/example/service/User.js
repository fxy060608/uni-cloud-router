const { Service } = require('../../../dist/index')
module.exports = class UserService extends Service {
  async login() {
    return { id: 1 }
  }
}
