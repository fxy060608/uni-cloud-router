import { HttpClient } from 'urllib'
import { Db } from '@cloudbase/database'

import noader from 'noader'

import { Context } from './Router'
import { runInUniCloud } from './utils'
import { DefaultContext, DefaultState } from 'koa'

export interface ExtendableContext {
  event: {
    [name: string]: any
    action: string
  }
  context: any
  service: Record<string, any>
  // response
  body: Record<string, any>
  // uniCloud
  db: Db
  httpclient: HttpClient
}

export class BaseContext {
  ctx: Context
  db: Db
  service: Record<string, any>
  httpclient: HttpClient

  constructor(ctx: Context) {
    this.ctx = ctx
    // request
    this.service = ctx.service
    // uniCloud
    this.db = ctx.db
    this.httpclient = ctx.httpclient
  }
}

export function createContext<StateT = DefaultState, CustomT = DefaultContext>(
  event: UniCloudEvent,
  context: UniCloudContext,
  serviceDir: string
) {
  const ctx = {
    state: {},
    event,
    context,
  } as Context<StateT, CustomT>
  // request
  ctx.service = noader(serviceDir, ctx)
  // uniCloud
  if (runInUniCloud) {
    ctx.db = uniCloud.database()
    ctx.httpclient = uniCloud.httpclient
  }
  return ctx
}
