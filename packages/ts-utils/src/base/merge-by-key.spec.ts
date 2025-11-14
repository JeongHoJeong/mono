import { describe, expect, it } from 'bun:test'
import { mergeByKey } from './merge-by-key'

describe(mergeByKey.name, () => {
  it('merges objects with overlapping keys', () => {
    const obj1 = {
      a: { x: 1, y: 2 },
      b: { z: 3 },
    }
    const obj2 = {
      a: { y: 10, w: 4 },
      c: { m: 5 },
    }

    const merged = mergeByKey(obj1, obj2)

    merged satisfies {
      a: { x: number; y: number; w: number }
      b: { z: number }
      c: { m: number }
    }

    expect(merged).toEqual({
      a: { x: 1, y: 10, w: 4 },
      b: { z: 3 },
      c: { m: 5 },
    })
    expect(merged).toMatchSnapshot()
  })

  it('handles objects with no overlapping keys', () => {
    const obj1 = {
      a: { x: 1 },
      b: { y: 2 },
    }
    const obj2 = {
      c: { z: 3 },
      d: { w: 4 },
    }

    const merged = mergeByKey(obj1, obj2)

    merged satisfies {
      a: { x: number }
      b: { y: number }
      c: { z: number }
      d: { w: number }
    }

    expect(merged).toEqual({
      a: { x: 1 },
      b: { y: 2 },
      c: { z: 3 },
      d: { w: 4 },
    })
    expect(merged).toMatchSnapshot()
  })

  it('handles empty objects', () => {
    const obj1 = {}
    const obj2 = { a: { x: 1 } }

    const merged = mergeByKey(obj1, obj2)

    merged satisfies {
      a: { x: number }
    }

    expect(merged).toEqual({
      a: { x: 1 },
    })
    expect(merged).toMatchSnapshot()
  })

  it('preserves non-object values', () => {
    const obj1 = {
      a: 'string',
      b: 42,
    }
    const obj2 = {
      a: 'override',
      c: true,
    }

    const merged = mergeByKey(obj1, obj2)

    merged satisfies {
      a: string
      b: number
      c: boolean
    }

    expect(merged).toEqual({
      a: 'override',
      b: 42,
      c: true,
    })
    expect(merged).toMatchSnapshot()
  })
})
