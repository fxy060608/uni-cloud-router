import {
  jsonTypes,
  formTypes,
  isJsonType,
  isFormType,
} from '../src/middleware/http/type'

describe('http', () => {
  test('text/plain', () => {
    expect(isJsonType('text/plain')).toBeFalsy()
    expect(isFormType('text/plain')).toBeFalsy()
  })
  test('application/json;charset=UTF-8', () => {
    expect(isJsonType('application/json;charset=UTF-8')).toBe(
      'application/json'
    )
  })
  jsonTypes.forEach((type) => {
    test(type, () => {
      expect(isJsonType(type)).toBeTruthy()
    })
  })
  formTypes.forEach((type) => {
    test(type, () => {
      expect(isFormType(type)).toBeTruthy()
    })
  })
})
