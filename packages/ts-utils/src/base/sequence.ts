export function sequence<T>(promises: (() => Promise<T>)[]): Promise<T[]> {
  return promises.reduce<Promise<T[]>>(
    (acc, promise) =>
      acc.then((results) => promise().then((result) => [...results, result])),
    Promise.resolve([]),
  )
}
