import { Next } from 'koa'
import { parse } from 'querystring'
import { Context } from '../Router'
import { FAILED_CODE } from '../utils'

function isHttp(event: UniCloudEvent, ctx: UniCloudContext) {
  const env = (ctx as any).env
  if (env && env.MP_SOURCE === 'http') {
    return true
  }
  return !!(event.httpMethod && event.headers)
}

type Data = { [key: string]: string }

const isObject = (field: unknown): field is Data => typeof field !== 'string'

const CONTENT_TYPE = 'content-type'
const JSON_TYPE = 'application/json'
const FORM_TYPE = 'application/x-www-form-urlencoded'

function initContextType(headers: Data) {
  const key = Object.keys(headers).find(
    (key) => key.toLowerCase() === CONTENT_TYPE
  )
  if (key) {
    headers[CONTENT_TYPE] = headers[key].toLowerCase()
    if (key !== CONTENT_TYPE) {
      delete headers[key]
    }
  } else {
    headers[CONTENT_TYPE] = JSON_TYPE
  }
}

function extend(ctx: Context, isHttpRequest: boolean) {
  if (isHttpRequest) {
    const { headers, httpMethod, body, queryStringParameters } = ctx.event
    initContextType(headers)
    ctx.query = queryStringParameters
    if (httpMethod === 'GET') {
      ctx.data = ctx.query
    } else {
      ctx.data = Object.create(null)
      if (body) {
        const contextType = headers[CONTENT_TYPE]
        if (contextType === JSON_TYPE) {
          try {
            ctx.data = JSON.parse(body)
          } catch (e) {}
        } else if (contextType === FORM_TYPE) {
          ctx.data = parse(body)
        }
      }
    }
  }
  ctx.set = function set(field: Data | string, val?: string | string[]) {
    if (arguments.length === 2) {
      if (Array.isArray(val)) {
        val = val.map((v) => (typeof v === 'string' ? v : String(v)))
      } else if (typeof val !== 'string') {
        val = String(val)
      }
      ctx.headers[field as string] = val as string
    } else if (isObject(field)) {
      for (const key in field) {
        ctx.set(key, field[key])
      }
    }
  }
}

export function parseAction(event: UniCloudEvent) {
  if (!event.action && event.path) {
    event.action = event.path.substr(1)
  }
  let action = String(event.action || '')
  if (action.startsWith('/')) {
    event.action = action = action.substr(1)
  }
  return action
}

export async function http(ctx: Context, next: Next) {
  const isHttpRequest = isHttp(ctx.event, ctx.context)
  extend(ctx, isHttpRequest)
  if (!isHttpRequest) {
    await next()
  } else {
    const contentTypeHeader = { [CONTENT_TYPE]: JSON_TYPE }
    try {
      await next()
    } catch (e) {
      const ret = {
        code: e.code || FAILED_CODE,
        message: e.message,
      }
      if (ctx.config.debug === true) {
        ;(ret as any).stack = e.stack || ''
      }
      return (ctx.body = {
        mpserverlessComposedResponse: true, // aliyun
        statusCode: 400,
        headers: contentTypeHeader,
        body: JSON.stringify(ret),
      })
    }
    const contextType = ctx.headers[CONTENT_TYPE] || JSON_TYPE
    ctx.body = {
      mpserverlessComposedResponse: true, // aliyun
      isBase64Encoded: !!ctx.isBase64Encoded,
      statusCode: ctx.status,
      headers: Object.assign(ctx.headers, { [CONTENT_TYPE]: contextType }),
      body: contextType === JSON_TYPE ? JSON.stringify(ctx.body) : ctx.body,
    }
  }
}
