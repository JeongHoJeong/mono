// biome-ignore lint/suspicious/noExplicitAny: To utilize `asserts` keyword.
export function assert(condition: any, message: any): asserts condition {
  if (!condition) {
    throw new Error(message)
  }
}
