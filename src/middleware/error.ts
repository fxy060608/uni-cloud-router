export function error(msg: string) {
  const middleware = async function error() {
    throw new Error(msg)
  }
  middleware._name = 'error'
  return middleware
}
