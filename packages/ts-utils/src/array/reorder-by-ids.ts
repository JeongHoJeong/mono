import { isNonNullish } from '../base/is-non-nullish'

export function reorderByIds<T, ID>(
  array: T[],
  ids: ID[],
  pickId: (item: T) => ID,
): T[] {
  const map = new Map<ID, T>()

  for (const item of array) {
    map.set(pickId(item), item)
  }

  return ids.map((id) => map.get(id)).filter(isNonNullish)
}
