import { describe, expect, it } from 'bun:test'
import { reorderByIds } from './reorder-by-ids'

describe(reorderByIds.name, () => {
  it('reorders array by given ids', () => {
    const items = [
      { id: 1, name: 'first' },
      { id: 2, name: 'second' },
      { id: 3, name: 'third' },
    ]

    const reordered = reorderByIds(items, [3, 1, 2], (item) => item.id)

    expect(reordered).toMatchSnapshot()
  })

  it('filters out items not in ids array', () => {
    const items = [
      { id: 1, name: 'first' },
      { id: 2, name: 'second' },
      { id: 3, name: 'third' },
    ]

    const reordered = reorderByIds(items, [1, 3], (item) => item.id)

    expect(reordered).toMatchSnapshot()
  })

  it('handles missing ids gracefully', () => {
    const items = [
      { id: 1, name: 'first' },
      { id: 2, name: 'second' },
    ]

    const reordered = reorderByIds(items, [3, 1, 4], (item) => item.id)

    expect(reordered).toMatchSnapshot()
  })
})
