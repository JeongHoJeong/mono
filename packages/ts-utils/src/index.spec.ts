import { test, expect } from 'bun:test'
import { lazy } from './index'

test(lazy.name, () => {
  const lazyValue = lazy(() => 42)
  expect(lazyValue()).toBe(42)
})
