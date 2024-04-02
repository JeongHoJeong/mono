import { test, expect } from 'bun:test'
import { lazy, sequence } from './index'

test(lazy.name, () => {
  const lazyValue = lazy(() => 42)
  expect(lazyValue()).toBe(42)
})

test(sequence.name, async () => {
  let values: number[] = []

  async function appendValueLater(value: number, delay: number) {
    await new Promise((resolve) => setTimeout(resolve, delay))
    values.push(value)
  }

  await sequence([
    () => appendValueLater(1, 10),
    () => appendValueLater(2, 5),
    () => appendValueLater(3, 1),
  ])

  expect(values).toEqual([1, 2, 3])
})
