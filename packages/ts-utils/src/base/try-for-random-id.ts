export async function tryForRandomId<T>(
  options: {
    min: number
    max: number
    maxTry: number
  },
  callback: (id: number) => Promise<
    | {
        done: true
        result: T
      }
    | {
        done: false
      }
  >,
): Promise<T> {
  for (let i = 0; i < options.maxTry; i++) {
    const id =
      Math.floor(Math.random() * (options.max - options.min + 1)) + options.min
    const result = await callback(id)
    if (result.done) {
      return result.result
    }
  }
  throw new Error(`Max tries exceeded: ${options.maxTry}`)
}
