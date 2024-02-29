import { z } from 'zod'

export type DynamoDBSchema = {
  [key: string]: {
    type: z.ZodType
    isKey?: boolean
  }
}

export type DynamoDBSchemaToGeneralSchema<S extends DynamoDBSchema> = {
  [K in keyof S]: {
    type: S[K]['type']
    isKey: S[K]['isKey'] extends true ? true : false
  }
}
