import { group } from './group'
import type { ArgvConfig, ArgvConfigToValues } from './types'

export function parseArgv<ArgCfg extends ArgvConfig>(
  config: ArgCfg,
  argv: string[],
): ArgvConfigToValues<ArgCfg> {
  const parsedOptions: Record<string, unknown> = {}
  const parsedArguments: unknown[] = []

  // Prepare config for group function
  const flags: string[] = []
  const optionsWithValue: string[] = []

  for (const [optionName, optionConfig] of Object.entries(config.options)) {
    const fullOptionName = `--${optionName}`
    // Check if the transform function expects parameters
    if (optionConfig.transform.length > 0) {
      optionsWithValue.push(fullOptionName)
    } else {
      flags.push(fullOptionName)
    }
  }

  // Group the argv into tokens
  const { tokens } = group(argv, {
    options: flags,
    optionsWithValue,
  })

  // Process tokens
  for (const token of tokens) {
    if (token.type === 'option') {
      const optionName = token.name.slice(2) // Remove '--' prefix
      const optionConfig = config.options[optionName]

      if (optionConfig) {
        const expectsArgument = optionConfig.transform.length > 0

        if (expectsArgument) {
          if (token.value !== undefined) {
            const transformResult = optionConfig.transform(token.value)
            if ('result' in transformResult) {
              parsedOptions[optionName] = transformResult.result
            } else {
              throw new Error(
                `Error parsing option ${optionName}: ${transformResult.error}`,
              )
            }
          } else {
            throw new Error(`Option --${optionName} requires a value`)
          }
        } else {
          // This option doesn't expect a value (flag)
          // biome-ignore lint/suspicious/noExplicitAny: transform function is dynamically typed based on arity
          const transformResult = (optionConfig.transform as any)()
          if ('result' in transformResult) {
            parsedOptions[optionName] = transformResult.result
          } else {
            throw new Error(
              `Error parsing option ${optionName}: ${transformResult.error}`,
            )
          }
        }
      }
    } else if (token.type === 'argument') {
      const argIndex = parsedArguments.length
      if (argIndex < config.arguments.length) {
        const argConfig = config.arguments[argIndex]
        if (!argConfig) continue

        const transformResult = argConfig.transform(token.value)

        if ('result' in transformResult) {
          parsedArguments.push(transformResult.result)
        } else {
          throw new Error(
            `Error parsing argument at position ${argIndex}: ${transformResult.error}`,
          )
        }
      }
    }
  }

  // Check for required options
  for (const [optionName, optionConfig] of Object.entries(config.options)) {
    if (!optionConfig.isOptional && !(optionName in parsedOptions)) {
      throw new Error(`Required option --${optionName} is missing`)
    }
  }

  // Check for required arguments
  config.arguments.forEach((argConfig, index) => {
    if (!argConfig.isOptional && index >= parsedArguments.length) {
      throw new Error(`Required argument at position ${index} is missing`)
    }
  })

  return {
    options: parsedOptions,
    arguments: parsedArguments,
  } as ArgvConfigToValues<ArgCfg>
}
