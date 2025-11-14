import type { z } from 'zod'

interface Cursor {
  _type: 'Cursor'
  // biome-ignore lint/suspicious/noExplicitAny: Too complex
  value: any
}

export interface ListOption<S extends {}> {
  filter?: FilterOptionTree<S>
  sort?: SortOption<S>[]
  cursor?: Cursor
  limit?: number
}

export type FilterOption<S extends {}, K extends keyof S> = {
  // biome-ignore lint/suspicious/noExplicitAny: Too complex
  eq?: S[K] extends { type: any } ? z.infer<S[K]['type']> : never
  // biome-ignore lint/suspicious/noExplicitAny: Too complex
  ne?: S[K] extends { type: any } ? z.infer<S[K]['type']> : never
  ge?: number
  gt?: number
  le?: number
  lt?: number
  contains?: string
  doesNotContain?: string
  startsWith?: string
  endsWith?: string
  isEmpty?: true
  isNotEmpty?: true
}

export type FilterLeaf<S extends GeneralSchema> = {
  [K in keyof S]?: FilterOption<S, K>
}

export type FilterOptionTree<S extends {}> =
  | {
      and: (FilterLeaf<S> | FilterOptionTree<S>)[]
    }
  | {
      or: (FilterLeaf<S> | FilterOptionTree<S>)[]
    }

type SortOption<S extends GeneralSchema> = {
  property: keyof S
  direction: 'ascending' | 'descending'
}

interface SchemaField {
  type: z.ZodType
  isKey: boolean
}

export type GeneralSchema = {
  [key: string]: SchemaField
}

type GeneralSchemaMap<S extends GeneralSchema> = {
  [K in keyof S]: S[K]['type']
}

type ZodRawToZodType<Z extends z.ZodRawShape> = ReturnType<typeof z.object<Z>>

type ZodObjectified<S extends GeneralSchema> = ZodRawToZodType<
  GeneralSchemaMap<S>
>

export interface Accessor<S extends {}, Metadata> {
  get: (key: string) => Promise<
    | (z.infer<ZodObjectified<S>> & {
        _meta: Metadata
      })
    | undefined
  >
  set: (key: string, value: z.infer<ZodObjectified<S>>) => Promise<void>
  add: (value: z.infer<ZodObjectified<S>>) => Promise<{
    _meta: Metadata
  }>
  update: (
    key: string,
    value: Partial<z.infer<ZodObjectified<S>>>,
  ) => Promise<void>
  list: (options?: ListOption<S>) => Promise<{
    cursor: Cursor
    items: (z.infer<ZodObjectified<S>> & {
      _meta: Metadata
    })[]
  }>
}
