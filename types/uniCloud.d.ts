declare module 'noader'

type UniCloudEvent = Record<string, any>

interface UniCloudContext {}

declare var uniCloud: {
  $args: any
  $ctx: any
  httpclient: any
  database: () => any
}
