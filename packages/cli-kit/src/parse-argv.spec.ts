import { describe, expect, it } from 'bun:test'

import { parseArgv } from './parse-argv'
import { input } from './input-factory'
import type { ArgvConfig } from './types'

describe(parseArgv.name, () => {
  it('parses arguments', () => {
    const config = {
      options: {
        name: input('string').required(),
        verbose: input('boolean').optional(),
      },
      arguments: [input('string').required()] as const,
    } satisfies ArgvConfig

    const parsed = parseArgv(config, ['--name', 'foo', '--verbose', 'argument'])

    expect(parsed).toEqual({
      options: {
        name: 'foo',
        verbose: true,
      },
      arguments: ['argument'],
    })

    expect(parsed).toMatchSnapshot()
  })

  it('handles missing required option', () => {
    const config = {
      options: {
        required: input('string').required(),
      },
      arguments: [] as const,
    } satisfies ArgvConfig

    expect(() => parseArgv(config, [])).toThrow(
      'Required option --required is missing',
    )
  })

  it('handles missing required argument', () => {
    const config = {
      options: {},
      arguments: [input('string').required()] as const,
    } satisfies ArgvConfig

    expect(() => parseArgv(config, [])).toThrow(
      'Required argument at position 0 is missing',
    )
  })

  it('handles optional options', () => {
    const config = {
      options: {
        optional: input('string').optional(),
      },
      arguments: [] as const,
    } satisfies ArgvConfig

    const parsed = parseArgv(config, [])

    expect(parsed).toEqual({
      options: {
        optional: undefined,
      },
      arguments: [],
    })
  })

  it('handles multiple arguments', () => {
    const config = {
      options: {},
      arguments: [
        input((str: string) => ({ result: `first: ${str}` })).required(),
        input((str: string) => ({ result: `second: ${str}` })).required(),
        input((str: string) => ({ result: `third: ${str}` })).optional(),
      ] as const,
    } satisfies ArgvConfig

    const parsed = parseArgv(config, ['arg1', 'arg2', 'arg3'])

    expect(parsed).toEqual({
      options: {},
      arguments: ['first: arg1', 'second: arg2', 'third: arg3'],
    })
  })

  it('handles transform errors', () => {
    const config = {
      options: {
        number: input((str: string) => {
          const num = Number(str)
          if (Number.isNaN(num)) {
            return { error: 'Not a valid number' }
          }
          return { result: num }
        }).required(),
      },
      arguments: [] as const,
    } satisfies ArgvConfig

    expect(() => parseArgv(config, ['--number', 'abc'])).toThrow(
      'Error parsing option number: Not a valid number',
    )
  })

  it('handles boolean flags correctly', () => {
    const config = {
      options: {
        flag1: input('boolean').optional(),
        flag2: input('boolean').optional(),
      },
      arguments: [] as const,
    } satisfies ArgvConfig

    const parsed = parseArgv(config, ['--flag1', '--flag2'])

    expect(parsed).toEqual({
      options: {
        flag1: true,
        flag2: true,
      },
      arguments: [],
    })
  })

  it('handles unknown options', () => {
    const config = {
      options: {},
      arguments: [] as const,
    } satisfies ArgvConfig

    const parsed = parseArgv(config, ['--unknown', 'value'])
    expect(parsed).toEqual({
      options: {},
      arguments: [],
    })
  })

  it('handles options with values mixed with arguments', () => {
    const config = {
      options: {
        output: input('string').optional(),
        verbose: input('boolean').optional(),
      },
      arguments: [
        input((str: string) => ({ result: str.toUpperCase() })).required(),
      ] as const,
    } satisfies ArgvConfig

    const parsed = parseArgv(config, [
      'input.txt',
      '--output',
      'output.txt',
      '--verbose',
    ])

    expect(parsed).toEqual({
      options: {
        output: 'output.txt',
        verbose: true,
      },
      arguments: ['INPUT.TXT'],
    })
  })

  it('handles option expecting value at end of argv', () => {
    const config = {
      options: {
        name: input('string').required(),
      },
      arguments: [] as const,
    } satisfies ArgvConfig

    expect(() => parseArgv(config, ['--name'])).toThrow(
      'Option --name requires a value',
    )
  })
})
