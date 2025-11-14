import { describe, test, expect } from 'bun:test'
import {
  compareSemver,
  isSemverEqual,
  isSemverGreaterThan,
  isSemverLessThan,
} from './semver'

test(isSemverGreaterThan.name, () => {
  expect(isSemverGreaterThan('1.0.0', '1.2.0')).toBe(false)
  expect(isSemverGreaterThan('1.0.12', '1.0.5')).toBe(true)
  expect(isSemverGreaterThan('1.0.3', '1.0.5')).toBe(false)
})

test(isSemverLessThan.name, () => {
  expect(isSemverLessThan('1.0.0', '1.2.0')).toBe(true)
  expect(isSemverLessThan('1.0.12', '1.0.5')).toBe(false)
  expect(isSemverLessThan('1.0.3', '1.0.5')).toBe(true)
})

test(isSemverEqual.name, () => {
  expect(isSemverEqual('1.0.0', '2.0.0')).toBe(false)
  expect(isSemverEqual('2.0.0', '1.0.0')).toBe(false)
  expect(isSemverEqual('1.0.0', '1.0.0')).toBe(true)
})

describe(compareSemver.name, () => {
  test('basic comparison', () => {
    expect(isSemverGreaterThan('1.0.3', '1.0')).toBe(true)
  })

  describe('comparison with different lengths', () => {
    test('version1 is longer', () => {
      expect(isSemverGreaterThan('1.0.3', '1.0')).toBe(true)
      expect(isSemverEqual('1.0.0', '1.0')).toBe(true)
    })

    test('version2 is longer', () => {
      expect(isSemverGreaterThan('1.0', '1.0.3')).toBe(false)
      expect(isSemverEqual('1.0', '1.0.0')).toBe(true)
    })
  })
})
