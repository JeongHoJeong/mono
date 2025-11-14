export type TransformResult<T> =
  | {
      result: T
    }
  | {
      error: string
    }

export interface Input<T, O extends boolean> {
  transform: (raw: string) => TransformResult<T>
  isOptional?: O
}

export type ArgvConfig = {
  options: {
    // biome-ignore lint/suspicious/noExplicitAny: for simplicity
    [key in string]: Input<any, any>
  }
  // biome-ignore lint/suspicious/noExplicitAny: for simplicity
  arguments: Input<any, any>[]
}

type Optionalize<V, O extends boolean> = O extends false
  ? V
  : O extends undefined
    ? V
    : O extends true
      ? V | undefined
      : never

type InputToValue<T> = T extends Input<infer T, infer O>
  ? Optionalize<T, O>
  : never

type InputsToValues<T> = T extends [Input<infer T, infer O>, ...infer Rest]
  ? [InputToValue<Input<T, O>>, ...InputsToValues<Rest>]
  : []

export type ArgvConfigToValues<C extends ArgvConfig> = {
  options: {
    [key in keyof C['options']]: InputToValue<C['options'][key]>
  }
  arguments: InputsToValues<C['arguments']>
}

type CommandResult =
  | {
      ok: true
    }
  | {
      ok: false
      error: string
    }

export type Command<C extends ArgvConfig> =
  | {
      subcommands: {
        // biome-ignore lint/suspicious/noExplicitAny: for simplicity
        [key in string]: Command<any>
      }
    }
  | {
      config: C
      description?: string
      action: (
        args: ArgvConfigToValues<C>,
      ) => CommandResult | Promise<CommandResult>
    }
