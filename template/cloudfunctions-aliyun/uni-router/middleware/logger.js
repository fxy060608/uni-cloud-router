/**
 * 文档：https://github.com/fxy060608/uni-cloud-router#%E4%B8%AD%E9%97%B4%E4%BB%B6middleware 
 */
module.exports = (options) => {
    return async function logger(ctx, next) {
        console.log('>> ', ctx.event)
        await next()
        console.log('<< ', ctx.body)
    }
}
