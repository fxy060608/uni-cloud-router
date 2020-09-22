import path from 'path'
import { Next } from 'koa'

import { Context, Router } from '../src/Router'
const baseDir = path.resolve(__dirname, './example')
const router = new Router({
  baseDir,
})
const uniCloudContext = {}
const auth = async (ctx: Context, next: Next) => {
  if (!ctx.event.token) {
    throw new Error('auth failed')
  }
  await next()
}

describe('Router', () => {
  test('middleware must be a function', async () => {
    expect(() => {
      router.use(1 as any)
    }).toThrow('middleware must be a function')
  })
  test('action is required', async () => {
    await expect(router.serve({}, uniCloudContext)).rejects.toEqual(
      new Error('action is required')
    )
  })
  test('action must contain "/"', async () => {
    await expect(
      router.serve({ action: 'user' }, uniCloudContext)
    ).rejects.toEqual(new Error('action must contain "/"'))
  })
  test('controller is not found', async () => {
    try {
      await router.serve({ action: 'admin/login' }, uniCloudContext)
    } catch (e) {
      expect(e.message).toContain('Cannot find module')
    }
  })
  test('method is not a function', async () => {
    await expect(
      router.serve({ action: 'user/logout' }, uniCloudContext)
    ).rejects.toEqual(
      new Error(
        `${path.join(baseDir, 'controller/user.logout')} is not a function`
      )
    )
  })
  test('auth failed', async () => {
    await expect(
      router.use(auth).serve({ action: 'user/update' }, uniCloudContext)
    ).rejects.toEqual(new Error(`auth failed`))
  })
  test('auth success', async () => {
    expect(
      await router
        .use(auth)
        .serve({ action: 'user/update', token: '123' }, uniCloudContext)
    ).toStrictEqual({ id: 1 })
  })
})
