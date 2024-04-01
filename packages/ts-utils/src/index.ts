const NOT_RAN = Symbol('NOT_RAN')

export function lazy<T>(fn: () => T): () => T {
  let value: T | typeof NOT_RAN = NOT_RAN

  return () => {
    if (value === NOT_RAN) {
      value = fn()
    }
    return value
  }
}

export function assert(condition: any, message: any): asserts condition {
  if (!condition) {
    throw new Error(message)
  }
}
