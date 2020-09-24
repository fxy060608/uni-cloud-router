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
    await expect(
      router.serve({ action: 'admin/login' }, uniCloudContext)
    ).rejects.toEqual(new Error(`controller/admin not found`))
  })
  test('method is not a function', async () => {
    await expect(
      router.serve({ action: 'user/logout' }, uniCloudContext)
    ).rejects.toEqual(new Error(`controller/user.logout is not a function`))
  })
  test('auth failed', async () => {
    expect(
      await router.use(auth).serve({ action: 'user/update' }, uniCloudContext)
    ).toEqual({
      code: 20001,
      message: 'auth failed',
    })
  })
  test('auth success', async () => {
    expect(
      await router
        .use(auth)
        .serve({ action: 'user/update', token: '123' }, uniCloudContext)
    ).toStrictEqual({ id: 1 })
  })
  test('data', async () => {
    expect(
      await router.serve(
        { action: 'user/data', token: 1, body: { a: 1 } },
        uniCloudContext
      )
    ).toEqual({ a: 1 })
  })
  describe('http', () => {
    test('action must contain "/"', async () => {
      await expect(
        router.serve({ path: '/user' }, uniCloudContext)
      ).rejects.toEqual(new Error('action must contain "/"'))
    })
    test('controller is not found', async () => {
      await expect(
        router.serve({ path: '/admin/login' }, uniCloudContext)
      ).rejects.toEqual(new Error(`controller/admin not found`))
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
            queryStringParameters: { body: { a: 1 } },
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
            body: JSON.stringify({ body: { a: 1 } }),
          },
          uniCloudContext
        )) as any).body
      ).toEqual(JSON.stringify({ a: 1 }))
    })
  })
})
