export function assertExhaustive(value: never): void {
  throw new Error(`Expected value to be never, but found: ${value}`)
}
