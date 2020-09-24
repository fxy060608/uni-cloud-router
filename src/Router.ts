import { Next, DefaultState, DefaultContext } from 'koa'

import path from 'path'
import compose from 'koa-compose'
import { EventEmitter } from 'events'

import {
  createRouteMatch,
  FAILED_CODE,
  MatchOptions,
  runInUniCloud,
} from './utils'
import { createContext, ExtendableContext } from './BaseContext'
import { http, parseAction } from './middleware/http'

type ConfigMiddleware<StateT = DefaultState, CustomT = DefaultContext> = Array<
  [Middleware<StateT, CustomT>, MatchOptions?]
>

interface RouterOptions<StateT = DefaultState, CustomT = DefaultContext> {
  baseDir: string
  middleware?: ConfigMiddleware
}

type ParameterizedContext<
  StateT = DefaultState,
  CustomT = DefaultContext
> = ExtendableContext & {
  state: StateT
} & CustomT

type Middleware<
  StateT = DefaultState,
  CustomT = DefaultContext
> = compose.Middleware<ParameterizedContext<StateT, CustomT>>

export type Context<
  StateT = DefaultState,
  CustomT = DefaultContext
> = ParameterizedContext<StateT, CustomT>
export interface MiddlewareOptions extends MatchOptions {}

const SERVICE_DIR = 'service'
const CONTROLLER_DIR = 'controller'

export class Router<
  StateT = DefaultState,
  CustomT = DefaultContext
> extends EventEmitter {
  private config: Record<string, any>
  private middleware: Middleware<StateT, CustomT>[]
  private serviceDir: string
  private controllerDir: string

  constructor(config: RouterOptions<StateT, CustomT>) {
    super()
    this.middleware = []
    this.config = config || {}

    const { baseDir = process.cwd(), middleware } = this.config
    this.serviceDir = path.resolve(baseDir, SERVICE_DIR)
    this.controllerDir = path.resolve(baseDir, CONTROLLER_DIR)

    this.initMiddleware(middleware)
  }
  /**
   * Use the given middleware `fn`
   * @param middleware
   */
  use(fn: Middleware<StateT, CustomT>, options?: MiddlewareOptions) {
    if (typeof fn !== 'function')
      throw new TypeError('middleware must be a function')
    this.middleware.push(this.wrapMiddleware(fn, options))
    return this
  }
  /**
   * serve cloud function
   * @param event
   * @param context
   */
  async serve(event?: UniCloudEvent, context?: UniCloudContext) {
    const ctx = createContext<StateT, CustomT>(
      this.config,
      event || (runInUniCloud && uniCloud.$args),
      context || (runInUniCloud && uniCloud.$ctx),
      this.serviceDir,
      this.controllerDir
    )
    const controller = this.controller(ctx)
    const fn = compose(this.middleware.concat(controller))
    return new Promise((resolve) => {
      fn(ctx)
        .then(() => {
          resolve(this.respond(ctx))
        })
        .catch((err) => {
          ctx.body = {
            code: err.code || FAILED_CODE,
            message: err.message || err,
          }
          resolve(this.respond(ctx))
        })
    })
  }
  private initMiddleware(middleware?: ConfigMiddleware<StateT, CustomT>) {
    this.use(http) // http url
    if (!Array.isArray(middleware)) {
      return
    }
    middleware.forEach(([mw, options]) => {
      this.use(mw, options)
    })
  }
  private wrapMiddleware(
    fn: Middleware<StateT, CustomT>,
    options?: MiddlewareOptions
  ) {
    const matchFn = createRouteMatch(options)
    const mw = (ctx: ParameterizedContext<StateT, CustomT>, next: Next) => {
      if (!matchFn(ctx)) {
        return next()
      }
      return fn(ctx, next)
    }
    mw._name = (fn as any)._name || fn.name
    return mw
  }
  private controller(ctx: Context) {
    const action = parseAction(ctx.event)
    if (!action) {
      throw new Error('action is required')
    }
    const paths = action.split('/').filter(Boolean)
    const len = paths.length
    if (len === 1) {
      throw new Error('action must contain "/"')
    }
    const methodName = paths[len - 1]
    let controller = ctx.controller
    for (let i = 0; i < len - 1; i++) {
      controller = controller[paths[i]]
    }
    if (!controller) {
      throw new Error(
        `controller/${action.replace(
          new RegExp('/' + methodName + '$'),
          ''
        )} not found`
      )
    }
    const method = controller[methodName]
    if (typeof method !== 'function') {
      throw new Error(
        `controller/${action.replace(
          new RegExp('/' + methodName + '$'),
          '.' + methodName
        )} is not a function`
      )
    }
    const middleware = async function (ctx: Context) {
      const ret = await method.call(controller, ctx)
      if (typeof ret !== 'undefined') {
        ctx.body = ret
      }
    }
    middleware._name = methodName
    return middleware
  }
  private respond(ctx: Context) {
    return ctx.body
  }
}
