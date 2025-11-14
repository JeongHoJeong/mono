import type { Input, TransformResult } from './types'

type InputType = 'string' | 'int' | 'float' | 'boolean'

type TransformFn<T> = (raw: string) => TransformResult<T>

interface InputBuilder<T, O extends boolean = false> extends Input<T, O> {
  required(): InputBuilder<T, false>
  optional(): InputBuilder<T, true>
}

// biome-ignore lint/suspicious/noExplicitAny: for simplicity
const transforms: Record<InputType, TransformFn<any>> = {
  string: (raw: string) => ({ result: raw }),
  int: (raw: string) => {
    const num = Number.parseInt(raw, 10)
    if (Number.isNaN(num)) {
      return { error: `"${raw}" is not a valid integer` }
    }
    return { result: num }
  },
  float: (raw: string) => {
    const num = Number.parseFloat(raw)
    if (Number.isNaN(num)) {
      return { error: `"${raw}" is not a valid number` }
    }
    return { result: num }
  },
  boolean: () => ({ result: true as const }),
}

function createInputBuilder<T, O extends boolean = false>(
  transform: TransformFn<T>,
  optional: O,
): InputBuilder<T, O> {
  const base = {
    transform,
    isOptional: optional,
  } as Input<T, O>

  return {
    ...base,
    required(): InputBuilder<T, false> {
      return createInputBuilder(transform, false)
    },
    optional(): InputBuilder<T, true> {
      return createInputBuilder(transform, true)
    },
  }
}

export function input(type: 'string'): InputBuilder<string>
export function input(type: 'int'): InputBuilder<number>
export function input(type: 'float'): InputBuilder<number>
export function input(type: 'boolean'): InputBuilder<true>
export function input<T>(transform: TransformFn<T>): InputBuilder<T>
export function input<T>(
  typeOrTransform: InputType | TransformFn<T>,
  // biome-ignore lint/suspicious/noExplicitAny: for simplicity
): InputBuilder<any> {
  const transform =
    typeof typeOrTransform === 'function'
      ? typeOrTransform
      : transforms[typeOrTransform]
  return createInputBuilder(transform, false)
}
