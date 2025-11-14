import { z } from 'zod'
import { test, expect } from 'bun:test'
import { assert } from '@jeonghojeong/ts-utils'
import { createDynamoDBAccessor } from './index'

const tableZod = z.object({
  table: z.object({
    name: z.string().min(1),
    partitionKey: z.string().min(1),
    rangeKey: z.string().min(1),
    region: z.string().min(1),
  }),
  partition: z.string().min(1),
})

const accessorTableInfo = tableZod.safeParse({
  table: {
    name: process.env.TEST_DYNAMODB_TABLE_NAME,
    partitionKey: process.env.TEST_DYNAMODB_PARTITION_KEY,
    rangeKey: process.env.TEST_DYNAMODB_RANGE_KEY,
    region: process.env.TEST_DYNAMODB_REGION,
  },
  partition: process.env.TEST_DYNAMODB_PARTITION,
})

test.skipIf(!process.env.ALLOW_SIDE_EFFECTS_IN_TEST)(
  createDynamoDBAccessor.name,
  async () => {
    assert(
      accessorTableInfo.success,
      'error' in accessorTableInfo
        ? accessorTableInfo.error
        : `Failed to parse DynamoDB table info`,
    )

    const accessor = createDynamoDBAccessor(accessorTableInfo.data, {
      value: {
        type: z.string(),
      },
    })

    expect(await accessor.get('__non_existing_key__')).toBeUndefined()

    await accessor.set('existing_key', {
      value: 'foo',
    })

    expect(await accessor.get('existing_key')).toEqual({
      _meta: undefined,
      value: 'foo',
    })
  },
)
