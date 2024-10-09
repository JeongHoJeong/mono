import { z } from 'zod'

interface Cursor {
  _type: 'Cursor'
  value: any
}

export interface ListOption<S extends GeneralSchema> {
  filter?: FilterOptionTree<S>
  sort?: SortOption<S>[]
  cursor?: Cursor
  limit?: number
}

export type FilterOption<S extends GeneralSchema, K extends keyof S> = {
  eq?: z.infer<S[K]['type']>
  ne?: z.infer<S[K]['type']>
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

export type FilterOptionTree<S extends GeneralSchema> =
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

export interface Accessor<S extends GeneralSchema, Metadata> {
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
    value: Partial<z.infer<ZodObjectified<S>>>
  ) => Promise<void>
  list: (options?: ListOption<S>) => Promise<{
    cursor: Cursor
    items: (z.infer<ZodObjectified<S>> & {
      _meta: Metadata
    })[]
  }>
}
