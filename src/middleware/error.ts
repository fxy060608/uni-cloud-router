import { Context } from '../Router'

export function error(msg: string) {
  const middleware = async function error(ctx: Context) {
    ctx.throw(msg)
  }
  middleware._name = 'error'
  return middleware
}
