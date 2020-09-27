import path from 'path'
import { Next } from 'koa'

import { Context, Router } from '../src/Router'
import { FAILED_CODE } from '../src/utils'
const baseDir = path.resolve(__dirname, './example')
const router = new Router({
  baseDir,
})
const uniCloudContext = {}
const auth = async (ctx: Context, next: Next) => {
  if (!ctx.event.token) {
    const err = new Error('auth failed')
    ;(err as any).code = 20001
    throw err
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
    expect(await router.serve({}, uniCloudContext)).toEqual({
      code: FAILED_CODE,
      message: 'action is required',
    })
  })
  test('action must contain "/"', async () => {
    expect(await router.serve({ action: 'user' }, uniCloudContext)).toEqual({
      code: FAILED_CODE,
      message: 'action must contain "/"',
    })
  })
  test('controller is not found', async () => {
    expect(
      await router.serve({ action: 'admin/login' }, uniCloudContext)
    ).toEqual({
      code: FAILED_CODE,
      message: 'controller/admin not found',
    })
  })
  test('method is not a function', async () => {
    expect(
      await router.serve({ action: 'user/logout' }, uniCloudContext)
    ).toEqual({
      code: FAILED_CODE,
      message: 'controller/user.logout is not a function',
    })
  })
  test('auth failed', async () => {
    expect(
      await new Router({
        baseDir,
      })
        .use(auth)
        .serve({ action: 'user/update' }, uniCloudContext)
    ).toEqual({
      code: 20001,
      message: 'auth failed',
    })
  })
  test('auth success', async () => {
    expect(
      await new Router({
        baseDir,
      })
        .use(auth)
        .serve({ action: 'user/update', token: '123' }, uniCloudContext)
    ).toEqual({ id: 1 })
  })
  test('data', async () => {
    expect(
      await router.serve(
        { action: 'user/data', data: { a: 1 } },
        uniCloudContext
      )
    ).toEqual({ a: 1 })
  })
  test('throw by middleware', async () => {
    expect(
      await new Router({ baseDir })
        .use((ctx) => ctx.throw('ERROR'))
        .serve({ action: 'user/login' }, uniCloudContext)
    ).toEqual({ code: FAILED_CODE, message: 'ERROR' })
  })
  test('throw by controller', async () => {
    expect(
      await router.serve({ action: 'user/throwByController' }, uniCloudContext)
    ).toEqual({ code: 'C_USER_ERR', message: 'ERROR' })
  })
  test('throw by service', async () => {
    expect(
      await router.serve({ action: 'user/throwByService' }, uniCloudContext)
    ).toEqual({ code: 'S_USER_ERR', message: 'ERROR' })
  })
  describe('http', () => {
    test('action must contain "/"', async () => {
      expect(await router.serve({ path: '/user' }, uniCloudContext)).toEqual({
        code: FAILED_CODE,
        message: 'action must contain "/"',
      })
    })
    test('controller is not found', async () => {
      expect(
        await router.serve({ path: '/admin/login' }, uniCloudContext)
      ).toEqual({
        code: FAILED_CODE,
        message: 'controller/admin not found',
      })
    })
    test('auth failed', async () => {
      expect(
        await router.use(auth).serve({ action: 'user/update' }, uniCloudContext)
      ).toEqual({
        code: 20001,
        message: 'auth failed',
      })
    })
    test('get', async () => {
      expect(
        ((await router.serve(
          {
            path: '/user/data',
            token: 1,
            httpMethod: 'GET',
            headers: {},
            queryStringParameters: { a: 1 },
          },
          uniCloudContext
        )) as any).body
      ).toEqual(JSON.stringify({ a: 1 }))
    })
    test('post', async () => {
      expect(
        ((await router.serve(
          {
            path: '/user/data',
            token: 1,
            httpMethod: 'POST',
            headers: {},
            body: JSON.stringify({ a: 1 }),
          },
          uniCloudContext
        )) as any).body
      ).toEqual(JSON.stringify({ a: 1 }))
    })
  })
})
