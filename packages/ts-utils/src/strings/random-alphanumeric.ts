const UPPERCASE_CHARACTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const LOWERCASE_CHARACTERS = UPPERCASE_CHARACTERS.toLowerCase()
const NUMERIC_CHARACTERS = '0123456789'

export function randomAlphanumeric(
  length: number,
  option: {
    numeric?: boolean
    uppercase?: boolean
    lowercase?: boolean
  },
): string {
  if (!option.numeric && !option.uppercase && !option.lowercase) {
    throw new Error('At least one character type must be specified')
  }

  const characters = [
    ...(option.uppercase ? UPPERCASE_CHARACTERS : []),
    ...(option.lowercase ? LOWERCASE_CHARACTERS : []),
    ...(option.numeric ? NUMERIC_CHARACTERS : []),
  ]
  return Array.from(
    { length },
    () => characters[Math.floor(Math.random() * characters.length)],
  ).join('')
}
