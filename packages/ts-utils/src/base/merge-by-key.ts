export function mergeByKey<
  // biome-ignore lint/suspicious/noExplicitAny: for simplicity
  T extends Record<string, any>,
  // biome-ignore lint/suspicious/noExplicitAny: for simplicity
  U extends Record<string, any>,
>(
  obj1: T,
  obj2: U,
): {
  [K in keyof T | keyof U]: K extends keyof T
    ? K extends keyof U
      ? T[K] & U[K]
      : T[K]
    : K extends keyof U
      ? U[K]
      : never
} {
  // biome-ignore lint/suspicious/noExplicitAny: for simplicity
  const result = {} as any
  const allKeys = new Set([...Object.keys(obj1), ...Object.keys(obj2)])

  for (const key of allKeys) {
    if (key in obj1 && key in obj2) {
      const val1 = obj1[key]
      const val2 = obj2[key]
      if (
        typeof val1 === 'object' &&
        val1 !== null &&
        typeof val2 === 'object' &&
        val2 !== null
      ) {
        result[key] = { ...val1, ...val2 }
      } else {
        result[key] = val2
      }
    } else if (key in obj1) {
      result[key] = obj1[key]
    } else {
      result[key] = obj2[key]
    }
  }

  return result
}
