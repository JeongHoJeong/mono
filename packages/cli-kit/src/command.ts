import { parseArgv } from './parse-argv'
import type { ArgvConfig, Command } from './types'

export function run<ArgCfg extends ArgvConfig>(
  command: Command<ArgCfg>,
  argv: string[],
) {
  if ('subcommands' in command) {
    const matchingSubCommand = Object.entries(command.subcommands ?? {}).find(
      ([name]) => name === argv[0],
    )

    if (matchingSubCommand) {
      return run(matchingSubCommand[1], argv.slice(1))
    }

    throw new Error(`Unknown subcommand: ${argv[0]}`)
  }

  const args = parseArgv(command.config, argv)
  return command.action(args) ?? { ok: true }
}
