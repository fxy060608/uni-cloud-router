import { Context } from '../src/Router'
import { createRouteMatch, MatchOptions } from '../src/utils'

function createRouteMatchAlias(options?: MatchOptions) {
  const matchFn = createRouteMatch(options)
  return function (action: string) {
    return matchFn({ event: { action } } as Context)
  }
}

describe('route match', () => {
  const route = 'api/login'
  test('options not present', () => {
    expect(createRouteMatchAlias()(route)).toBeTruthy()
  })
  test('options.enable = false', () => {
    expect(createRouteMatchAlias({ enable: false })(route)).toBeFalsy()
  })
  test('options.match and options.ignore both not present should always return true', () => {
    expect(createRouteMatchAlias({})(route)).toBeTruthy()
  })
  test('options.match and options.ignore both present should throw', () => {
    expect(() =>
      createRouteMatchAlias({ match: [], ignore: [] })(route)
    ).toThrowError('options.match and options.ignore can not both present')
  })
  describe('match', () => {
    test('support string', () => {
      const matchFn = createRouteMatchAlias({ match: 'api' })
      expect(matchFn('api')).toBeTruthy()
      expect(matchFn('api/')).toBeTruthy()
      expect(matchFn('api/login')).toBeTruthy()
      expect(matchFn('api/hello')).toBeTruthy()
      expect(matchFn('api1')).toBeFalsy()
    })
    test('support regexp', () => {
      const matchFn = createRouteMatchAlias({ match: /^api\// })
      expect(matchFn('api')).toBeFalsy()
      expect(matchFn('api/')).toBeTruthy()
      expect(matchFn('api/login')).toBeTruthy()
      expect(matchFn('api/hello')).toBeTruthy()
      expect(matchFn('api1')).toBeFalsy()
    })
    test('support global regexp', () => {
      const matchFn = createRouteMatchAlias({ match: /^api/g })
      expect(matchFn('api')).toBeTruthy()
      expect(matchFn('api/')).toBeTruthy()
      expect(matchFn('api/login')).toBeTruthy()
      expect(matchFn('api/hello')).toBeTruthy()
      expect(matchFn('api1')).toBeTruthy()
      expect(matchFn('v1/api1')).toBeFalsy()
    })
    test('support array', () => {
      const matchFn = createRouteMatchAlias({
        match: [
          (ctx: any) => ctx.event.action.startsWith('api'),
          '/ajax',
          /^foo$/,
        ],
      })
      expect(matchFn('api/hello')).toBeTruthy()
      expect(matchFn('api/')).toBeTruthy()
      expect(matchFn('api')).toBeTruthy()
      expect(matchFn('api1/hello')).toBeTruthy()
      expect(matchFn('api1')).toBeTruthy()
      expect(matchFn('v1/api1')).toBeFalsy()
      expect(matchFn('/ajax/api')).toBeTruthy()
      expect(matchFn('foo')).toBeTruthy()
    })
  })
  describe('ignore', () => {
    test('support string', () => {
      const matchFn = createRouteMatchAlias({ ignore: 'api' })
      expect(matchFn('api')).toBeFalsy()
      expect(matchFn('api/')).toBeFalsy()
      expect(matchFn('api/login')).toBeFalsy()
      expect(matchFn('api/hello')).toBeFalsy()
      expect(matchFn('api1')).toBeTruthy()
    })
    test('support regexp', () => {
      const matchFn = createRouteMatchAlias({ ignore: /^api\// })
      expect(matchFn('api')).toBeTruthy()
      expect(matchFn('api/')).toBeFalsy()
      expect(matchFn('api/login')).toBeFalsy()
      expect(matchFn('api/hello')).toBeFalsy()
      expect(matchFn('api1')).toBeTruthy()
    })
    test('support global regexp', () => {
      const matchFn = createRouteMatchAlias({ ignore: /^api/g })
      expect(matchFn('api')).toBeFalsy()
      expect(matchFn('api/')).toBeFalsy()
      expect(matchFn('api/login')).toBeFalsy()
      expect(matchFn('api/hello')).toBeFalsy()
      expect(matchFn('api1')).toBeFalsy()
      expect(matchFn('v1/api1')).toBeTruthy()
    })
    test('support array', () => {
      const matchFn = createRouteMatchAlias({
        ignore: [
          (ctx: any) => ctx.event.action.startsWith('api'),
          '/ajax',
          /^foo$/,
        ],
      })
      expect(matchFn('api/hello')).toBeFalsy()
      expect(matchFn('api/')).toBeFalsy()
      expect(matchFn('api')).toBeFalsy()
      expect(matchFn('api1/hello')).toBeFalsy()
      expect(matchFn('api1')).toBeFalsy()
      expect(matchFn('v1/api1')).toBeTruthy()
      expect(matchFn('/ajax/api')).toBeFalsy()
      expect(matchFn('foo')).toBeFalsy()
    })
  })
})
