import { z } from 'zod'

type NotionFieldType =
  | 'title'
  | 'rich_text'
  | 'number'
  | 'select'
  | 'status'
  | 'multi_select'
  | 'date'
  | 'person'
  | 'file'
  | 'checkbox'
  | 'url'
  | 'email'
  | 'phone_number'
  | 'formula'
  | 'relation'
  | 'rollup'
  | 'created_time'
  | 'created_by'
  | 'last_edited_time'
  | 'last_edited_by'
  | 'id'

const _NotionFieldToZodType = {
  title: z.string(),
  rich_text: z.string(),
  number: z.number(),
  select: z.string(),
  multi_select: z.array(z.string()),
  date: z.date(),
  person: z.any(),
  file: z.any(),
  checkbox: z.boolean(),
  url: z.string(),
  email: z.string(),
  phone_number: z.string(),
  formula: z.string(),
  relation: z.any(),
  rollup: z.any(),
  created_time: z.date(),
  created_by: z.string(),
  last_edited_time: z.date(),
  last_edited_by: z.string(),
  status: z.string(),
  id: z.number(),
}
type _NotionFieldToZodType = typeof _NotionFieldToZodType

export const NotionFieldToZodType: {
  [K in keyof typeof _NotionFieldToZodType]: ReturnType<
    _NotionFieldToZodType[K]['optional']
  >
} = Object.fromEntries(
  Object.entries(_NotionFieldToZodType).map(([key, value]) => [
    key,
    value.optional(),
  ])
) as any

export type NotionFieldToZodType = typeof NotionFieldToZodType

export type NotionSchema = {
  [key: string]: {
    type: NotionFieldType
  }
}

export type NotionSchemaToGeneralSchema<NS extends {}> = {
  [K in keyof NS]: NS extends NotionSchema
    ? {
        type: NotionFieldToZodType[NS[K]['type']]
        isKey: NS[K]['type'] extends 'id' ? true : false
      }
    : never
}
