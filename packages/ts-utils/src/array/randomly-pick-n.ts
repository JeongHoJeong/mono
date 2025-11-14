export function randomlyPickN<T>(array: T[], n: number): T[] {
  const shuffled = array.sort(() => Math.random() - 0.5)
  return shuffled.slice(0, n)
}
