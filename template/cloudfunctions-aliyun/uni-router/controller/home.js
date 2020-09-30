/**
 * 文档：https://github.com/fxy060608/uni-cloud-router#%E6%8E%A7%E5%88%B6%E5%99%A8controller
 */
const {
    Controller
} = require('uni-cloud-router')
module.exports = class HomeController extends Controller {
    async index() {
        return {
            msg: 'hi, uniCloud',
        }
    }
}
