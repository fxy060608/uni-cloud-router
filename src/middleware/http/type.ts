export const jsonTypes = [
  'application/json',
  'application/json-patch+json',
  'application/vnd.api+json',
  'application/csp-report',
]

export const formTypes = ['application/x-www-form-urlencoded']

export function isJsonType(contentType: string) {
  return is(contentType, jsonTypes)
}

export function isFormType(contentType: string) {
  return is(contentType, formTypes)
}

function is(type: string, types: string[]) {
  type = normalizeType(type)
  for (let i = 0; i < types.length; i++) {
    const expectedType = types[i]
    if (mimeMatch(types[i], type)) {
      return type[0] === '+' || type.indexOf('*') !== -1 ? type : expectedType
    }
  }
  return false
}

function normalizeType(string: string) {
  return string.split(';')[0]
}

function mimeMatch(expected: string, actual: string) {
  const actualParts = actual.split('/')
  const expectedParts = expected.split('/')
  if (actualParts.length !== 2 || expectedParts.length !== 2) {
    return false
  }
  if (expectedParts[0] !== '*' && expectedParts[0] !== actualParts[0]) {
    return false
  }
  if (expectedParts[1].substr(0, 2) === '*+') {
    return (
      expectedParts[1].length <= actualParts[1].length + 1 &&
      expectedParts[1].substr(1) ===
        actualParts[1].substr(1 - expectedParts[1].length)
    )
  }
  if (expectedParts[1] !== '*' && expectedParts[1] !== actualParts[1]) {
    return false
  }
  return true
}
