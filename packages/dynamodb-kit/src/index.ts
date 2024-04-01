import {
  Accessor,
  FilterLeaf,
  FilterOption,
  FilterOptionTree,
  GeneralSchema,
  ListOption,
} from '@jeonghojeong/accessor'
import { DynamoDBClient, QueryCommand } from '@aws-sdk/client-dynamodb'
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb'
import { z } from 'zod'
import { DynamoDBSchema, DynamoDBSchemaToGeneralSchema } from './schema'

function isOKHttpStatusCode(code: number | undefined) {
  if (code === undefined) {
    return false
  }

  return Math.floor(code / 100) === 2
}

function makeUnitExpression(
  attrName: string,
  valueName: string,
  filterOption: FilterOption<any, any>
) {
  if ('eq' in filterOption) {
    return `#${attrName} = :${valueName}`
  } else if ('ne' in filterOption) {
    return `#${attrName} <> :${valueName}`
  } else if ('ge' in filterOption) {
    return `#${attrName} >= :${valueName}`
  } else if ('gt' in filterOption) {
    return `#${attrName} > :${valueName}`
  } else if ('le' in filterOption) {
    return `#${attrName} <= :${valueName}`
  } else if ('lt' in filterOption) {
    return `#${attrName} < :${valueName}`
  } else if ('contains' in filterOption) {
    return `contains(#${attrName}, :${valueName})`
  } else {
    throw new Error('Unknown filter option')
  }
}

function extractValueFromFilterOption(option: FilterOption<any, any>) {
  const entries = Object.entries(option)
  if (entries.length !== 1) {
    throw new Error('Invalid filter leaf')
  }
  const value = entries[0]![1]

  if (value === null || value === undefined) {
    throw new Error('Invalid filter leaf')
  }

  if (typeof value === 'string') {
    return {
      S: value,
    }
  }

  if (typeof value === 'number') {
    return {
      N: value.toString(),
    }
  }

  throw new Error('Invalid filter leaf')
}

/** Syntax ref: https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Expressions.OperatorsAndFunctions.html#Expressions.OperatorsAndFunctions.Syntax */
export function makeFilter(
  joinBy: 'and' | 'or',
  subFilters: (FilterOptionTree<any> | FilterLeaf<any>)[],
  variablePrefix: string = 'v'
): {
  attributeValues: Record<string, any>
  attributeNames: Record<string, string>
  expression: string
} {
  const expressions = subFilters.map<ReturnType<typeof makeFilter>>(
    (subFilter, idx) => {
      // When it's a tree
      if ('and' in subFilter || 'or' in subFilter) {
        const subSubFilters: (FilterOptionTree<any> | FilterLeaf<any>)[] =
          (subFilter as any).and ?? ((subFilter as any).or as any)

        const { expression, attributeNames, attributeValues } = makeFilter(
          joinBy,
          subSubFilters,
          `${variablePrefix}_${idx}`
        )

        return {
          attributeValues,
          attributeNames,
          expression,
        }
      }

      // When it's a leaf
      const entries = Object.entries(subFilter)
      if (entries.length === 1) {
        const entry = entries[0]!
        const key = entry[0]
        const value = entry[1]!
        const variableName = `${variablePrefix}_${idx}_${key}`

        return {
          attributeValues: {
            [`:${variableName}`]: extractValueFromFilterOption(value),
          },
          attributeNames: {
            [`#${key}`]: key,
          },
          expression: makeUnitExpression(key, variableName, value),
        }
      } else {
        return makeFilter(
          'and',
          entries.map(([key, value]) => {
            return {
              [key]: value,
            }
          }),
          variablePrefix
        )
      }
    }
  )

  const expression = `(${expressions
    .map((e) => e.expression)
    .join(` ${joinBy} `)})`
  return {
    attributeValues: Object.fromEntries(
      expressions.flatMap((e) => Object.entries(e.attributeValues))
    ),
    attributeNames: Object.fromEntries(
      expressions.flatMap((e) => Object.entries(e.attributeNames))
    ),
    expression,
  }
}

export interface DynamoDBAccessor<S extends GeneralSchema>
  extends Accessor<S, undefined> {}

export function createDynamoDBAccessor<S extends DynamoDBSchema>(
  {
    table: tableInfo,
    partition,
  }: {
    table: {
      name: string
      partitionKey: string
      rangeKey: string
      region: string
    }
    partition: string
  },
  schema: S
): DynamoDBAccessor<DynamoDBSchemaToGeneralSchema<S>> {
  const zodSchema = z.object(
    Object.fromEntries(
      Object.entries(schema).map(([key, value]) => [key, value.type])
    )
  )

  const client = new DynamoDBClient({
    region: tableInfo.region,
  })

  const ddbDocClient = DynamoDBDocumentClient.from(client)

  return {
    async get(key: string) {
      const retrieved = await ddbDocClient.send(
        new GetCommand({
          TableName: tableInfo.name,
          Key: {
            [tableInfo.partitionKey]: partition,
            [tableInfo.rangeKey]: key,
          },
        })
      )

      if (!isOKHttpStatusCode(retrieved.$metadata.httpStatusCode)) {
        // TODO: better error message
        throw new Error('Failed to retrieve')
      }

      if (retrieved.Item === undefined) {
        return undefined
      }

      return zodSchema.parse(retrieved.Item) as any
    },

    async set(key: string, value: any) {
      // TODO: defend it to not use hash_key and range_key directly

      const updated = await ddbDocClient.send(
        new PutCommand({
          TableName: tableInfo.name,
          Item: {
            // TODO: prevent setting range_key and custom key at the same time
            ...zodSchema.parse(value),
            [tableInfo.partitionKey]: partition,
            [tableInfo.rangeKey]: key,
          },
        })
      )

      if (!isOKHttpStatusCode(updated.$metadata.httpStatusCode)) {
        // TODO: better error message
        throw new Error('Failed to update')
      }
    },

    async update(key: string, value: any) {
      const updated = await ddbDocClient.send(
        new UpdateCommand({
          TableName: tableInfo.name,
          Key: {
            [tableInfo.partitionKey]: partition,
            [tableInfo.rangeKey]: key,
          },
          UpdateExpression: `SET ${Object.keys(value)
            .map((key) => `#${key} = :${key}`)
            .join(', ')}`,
          ExpressionAttributeNames: Object.fromEntries(
            // TODO: maybe restrict keys to not contain special characters like `.`, `$`, space, etc.
            Object.keys(value).map((key) => [`#${key}`, key])
          ),
          ExpressionAttributeValues: Object.fromEntries(
            Object.entries(value).map(([key, value]) => [':' + key, value])
          ),
        })
      )

      if (!isOKHttpStatusCode(updated.$metadata.httpStatusCode)) {
        // TODO: better error message
        throw new Error('Failed to update')
      }
    },

    async list(option?: ListOption<DynamoDBSchemaToGeneralSchema<S>>) {
      // TODO: use cursor
      const { cursor, filter, sort, limit } = option ?? {}

      if (sort !== undefined && sort.length > 0) {
        if (sort.length > 1) {
          throw new Error('Only one sort condition is supported')
        }
        if (sort?.[0]?.property !== tableInfo.rangeKey) {
          throw new Error('Only range key can be used for sorting')
        }
      }

      const effectiveSort = sort?.[0]
      const options =
        filter === undefined
          ? undefined
          : 'and' in filter
          ? makeFilter('and', filter.and)
          : 'or' in filter
          ? makeFilter('or', filter.or)
          : undefined

      const res = await ddbDocClient.send(
        new QueryCommand({
          TableName: tableInfo.name,
          KeyConditionExpression: `#partition = :partition`,
          ExpressionAttributeNames: {
            ...options?.attributeNames,
            '#partition': tableInfo.partitionKey,
          },
          ExpressionAttributeValues: {
            ...options?.attributeValues,
            ':partition': {
              S: partition,
            },
          },
          FilterExpression: options?.expression,
          ExclusiveStartKey: cursor?.value,
          ScanIndexForward: effectiveSort?.direction
            ? effectiveSort.direction === 'ascending'
              ? true
              : effectiveSort.direction === 'descending'
              ? false
              : undefined
            : undefined,
          Limit: limit,
        })
      )

      if (!isOKHttpStatusCode(res.$metadata.httpStatusCode)) {
        throw new Error('Failed to query')
      }

      const items =
        res.Items?.map((item) =>
          zodSchema.parse(
            Object.fromEntries(
              Object.entries(item).map(([key, value]: [string, any]) => [
                key,
                // TODO: handle various types correctly
                value.S ?? value.N ?? value.BOOL,
              ])
            )
          )
        ) ?? []

      return {
        cursor: {
          _type: 'Cursor',
          value: res.LastEvaluatedKey,
        },
        items,
      } as any
    },

    async add() {
      throw new Error('It is not possible to create a new record without key.')
    },
  }
}
