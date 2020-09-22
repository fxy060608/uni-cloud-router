import { Next, DefaultState, DefaultContext } from 'koa'

import path from 'path'
import compose from 'koa-compose'
import { EventEmitter } from 'events'

import { createRouteMatch, MatchOptions, runInUniCloud } from './utils'
import { createContext, ExtendableContext } from './BaseContext'

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
  private middleware: Middleware<StateT, CustomT>[]
  private serviceDir: string
  private controllerDir: string

  constructor(options: RouterOptions<StateT, CustomT>) {
    super()
    this.middleware = []
    const { baseDir, middleware } = options

    this.serviceDir = path.resolve(baseDir, SERVICE_DIR)
    this.controllerDir = path.resolve(baseDir, CONTROLLER_DIR)

    this.initMiddleware(middleware)
  }
  initMiddleware(middleware?: ConfigMiddleware<StateT, CustomT>) {
    if (!Array.isArray(middleware)) {
      return
    }
    middleware.forEach(([mw, options]) => {
      this.use(mw, options)
    })
  }
  wrapMiddleware(fn: Middleware<StateT, CustomT>, options?: MiddlewareOptions) {
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
      event || (runInUniCloud && uniCloud.$args),
      context || (runInUniCloud && uniCloud.$ctx),
      this.serviceDir
    )
    const controller = this.controller(ctx)
    const fn = compose(this.middleware.concat(controller))
    return new Promise((resolve, reject) => {
      fn(ctx)
        .then(() => {
          resolve(this.respond(ctx))
        })
        .catch(reject)
    })
  }
  controller(ctx: Context) {
    const action = ctx.event.action
    if (!action) {
      throw new Error('action is required')
    }
    if (action.indexOf('/') === -1) {
      throw new Error('action must contain "/"')
    }
    const lastIndex = action.lastIndexOf('/')
    const methodName = action.substr(lastIndex + 1)
    const controllerPath = path.join(
      this.controllerDir,
      action.substr(0, lastIndex)
    )
    /* eslint-disable no-restricted-globals */
    let ControllerClass = require(controllerPath)

    ControllerClass = ControllerClass.default || ControllerClass
    const controller = new ControllerClass(ctx)
    const method = controller[methodName]
    if (typeof method !== 'function') {
      throw new Error(`${controllerPath}.${methodName} is not a function`)
    }
    return method.bind(controller)
  }
  respond(ctx: Context) {
    return ctx.body
  }
}
