'use strict';
/**
 * 文档：https://github.com/fxy060608/uni-cloud-router
 */
const {
    Router
} = require('uni-cloud-router')
const router = new Router(require('./config.js'))
exports.main = async (event, context) => {
    return router.serve(event, context)
}
