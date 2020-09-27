import { request, HttpClient } from 'urllib'
import { Db } from '@cloudbase/database'
import { DefaultContext, DefaultState } from 'koa'
import noader from 'noader'

import { Context } from './Router'
import { FAILED_CODE, runInUniCloud } from './utils'

export interface ExtendableContext {
  event: {
    [name: string]: any
    action: string
  }
  context: any
  config: Record<string, any>
  service: Record<string, any>
  controller: Record<string, any>
  // request
  query: Record<string, any>
  data: Record<string, any>
  // response
  status: number // http only
  headers: Record<string, string> // http only
  set(_field: { [key: string]: string }): void // http only
  set(_field: string, _val: string | string[]): void // http only
  body: Record<string, any>
  throw(_message: string): never
  throw(_code: string | number, _message: string): never
  // uniCloud
  db: Db
  curl: typeof request
  httpclient: HttpClient
}

export class BaseContext {
  ctx: Context
  db: Db
  config: Record<string, any>
  service: Record<string, any>
  controller: Record<string, any>
  curl: typeof request
  httpclient: HttpClient
  throw: ExtendableContext['throw']

  constructor(ctx: Context) {
    this.ctx = ctx
    // utils
    this.config = ctx.config
    this.service = ctx.service
    this.controller = ctx.controller
    this.throw = ctx.throw
    // uniCloud
    this.db = ctx.db
    this.curl = ctx.curl
    this.httpclient = ctx.httpclient
  }
}

export function createContext<StateT = DefaultState, CustomT = DefaultContext>(
  config: Record<string, any>,
  event: UniCloudEvent,
  context: UniCloudContext,
  serviceDir: string,
  controllerDir: string
) {
  const ctx = {
    state: {},
    event,
    context,
  } as Context<StateT, CustomT>
  // utils
  ctx.config = config
  ctx.service = noader(serviceDir, ctx)
  ctx.controller = noader(controllerDir, ctx)
  // request
  ctx.query = Object.create(null)
  ctx.data = event.data || Object.create(null)
  // response
  ctx.status = 200
  ctx.headers = Object.create(null)
  ctx.throw = (code?: string | number, message?: string) => {
    if (message) {
      throw {
        code,
        message,
      }
    }
    throw { code: FAILED_CODE, message: code }
  }
  // uniCloud
  if (runInUniCloud) {
    ctx.db = uniCloud.database()
    ctx.curl = uniCloud.httpclient.request
    ctx.httpclient = uniCloud.httpclient
  }
  return ctx
}
