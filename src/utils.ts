import { pathToRegexp } from 'path-to-regexp'
import { Context } from './Router'

type MatchFn = (_ctx: Context) => boolean

type Condition = string | RegExp | MatchFn | Condition[]

export const FAILED_CODE = 'INVOKE_FUNCTION_FAILED'

export const runInUniCloud = typeof uniCloud !== 'undefined'

export interface MatchOptions {
  enable?: boolean
  match?: Condition
  ignore?: Condition
}

const NO = () => false
const YES = () => true

function routeMatch(pattern: Condition) {
  if (typeof pattern === 'string') {
    const reg = pathToRegexp(pattern, [], { end: false })
    if (reg.global) reg.lastIndex = 0
    return (ctx: any) => reg.test(ctx.event.action)
  }
  if (pattern instanceof RegExp) {
    return (ctx: any) => {
      if (pattern.global) pattern.lastIndex = 0
      return pattern.test(ctx.event.action)
    }
  }
  if (typeof pattern === 'function') return pattern
  if (Array.isArray(pattern)) {
    const matchs = pattern.map((item) => routeMatch(item)) as any
    return (ctx: any) => matchs.some((match: Function) => match(ctx))
  }
  throw new Error(
    'match/ignore pattern must be RegExp, Array or String, but got ' + pattern
  )
}

export function createRouteMatch(options?: MatchOptions) {
  if (!options) {
    return YES
  }
  const { enable, match, ignore } = options
  if (enable === false) {
    return NO
  }
  if (!match && !ignore) {
    return YES
  }
  if (match && ignore) {
    throw new Error('options.match and options.ignore can not both present')
  }
  const matchFn = match ? routeMatch(match) : routeMatch(ignore!)
  return function routeMatch(ctx: Context) {
    const matched = matchFn(ctx)
    return match ? matched : !matched
  }
}
