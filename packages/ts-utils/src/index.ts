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

// biome-ignore lint/suspicious/noExplicitAny: To utilize `asserts` keyword.
export function assert(condition: any, message: any): asserts condition {
  if (!condition) {
    throw new Error(message)
  }
}

export function sequence<T>(promises: (() => Promise<T>)[]): Promise<T[]> {
  return promises.reduce<Promise<T[]>>(
    (acc, promise) =>
      acc.then((results) => promise().then((result) => [...results, result])),
    Promise.resolve([]),
  )
}

export * from './strings'
