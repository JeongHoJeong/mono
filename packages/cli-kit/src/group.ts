type Token =
  | {
      type: 'option'
      name: string
      value?: string
    }
  | {
      type: 'argument'
      value: string
    }

interface Result {
  tokens: Token[]
}

export function group(
  argv: string[],
  config: {
    options: string[]
    optionsWithValue: string[]
  },
): Result {
  const tokens: Token[] = []
  const { options: flags, optionsWithValue: paramAcceptingFlags } = config

  let skipCount = 0

  function skipNext() {
    skipCount += 1
  }

  for (const [index, current] of argv.entries()) {
    if (skipCount > 0) {
      skipCount--
      continue
    }

    if (paramAcceptingFlags.includes(current)) {
      const next = argv[index + 1]

      if (next) {
        if (flags.includes(next) || paramAcceptingFlags.includes(next)) {
          tokens.push({
            type: 'option',
            name: current,
          })
          continue
        }
      }

      tokens.push({
        type: 'option',
        name: current,
        value: next,
      })
      skipNext()
    } else if (flags.includes(current)) {
      tokens.push({
        type: 'option',
        name: current,
      })
    } else {
      tokens.push({
        type: 'argument',
        value: current,
      })
    }
  }

  return {
    tokens,
  }
}
