const logger = require('./middleware/logger.js')
module.exports = {
    debug: true, // 输出调试信息
    baseDir: __dirname, // 应用根目录
    middleware: [ // 中间件
        [logger()]
    ]
}
