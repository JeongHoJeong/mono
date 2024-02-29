import { expect, describe, it } from 'bun:test'
import { createNotionAccessor } from './index'
import { Client } from '@notionhq/client'
import { z } from 'zod'

const testInputSchema = z.object({
  notionToken: z.string(),
  databases: z.object({
    _1: z.string(),
    _2: z.string(),
  }),
})

const testInput = testInputSchema.parse({
  notionToken: process.env.TEST_NOTION_TOKEN,
  databases: {
    _1: process.env.TEST_NOTION_DB_ID_1,
    _2: process.env.TEST_NOTION_DB_ID_2,
  },
})

const getNotionClient = () =>
  Promise.resolve(new Client({ auth: testInput.notionToken }))

describe(createNotionAccessor.name, () => {
  it('should fetch & update record via ID property', async () => {
    const accessor = createNotionAccessor(
      getNotionClient,
      testInput.databases._1,
      {
        숫자: {
          type: 'number',
        },
      }
    )

    const testItemId = '4'
    const newRandomInteger = Math.floor(Math.random() * 1000)

    await accessor.update(testItemId, {
      숫자: newRandomInteger,
    })

    const value = await accessor.get(testItemId)
    expect(value).toEqual({
      숫자: newRandomInteger,
      _meta: {
        uuid: expect.any(String),
      },
    })
  })

  it('should list items with filter and sort', async () => {
    const accessor = createNotionAccessor(
      getNotionClient,
      testInput.databases._2,
      {
        이름: {
          type: 'title',
        },
        '출처상 위치': {
          type: 'rich_text',
        },
        요약: {
          type: 'rich_text',
        },
        학습: {
          type: 'status',
        },
        ID: {
          type: 'id',
        },
      }
    )

    {
      const result = await accessor.list({
        filter: {
          and: [
            {
              학습: {
                eq: '대기',
              },
            },
            {
              이름: {
                contains: 'attention',
              },
            },
          ],
        },
        sort: [
          {
            property: 'ID',
            direction: 'ascending',
          },
        ],
      })

      // TODO: better checking
      expect(result.items).toBeArray()
    }

    {
      const result = await accessor.list({
        filter: {
          or: [
            {
              이름: {
                contains: '개발',
              },
            },
            {
              이름: {
                contains: '기억',
              },
            },
          ],
        },

        sort: [
          {
            property: '이름',
            direction: 'ascending',
          },
        ],
      })

      // TODO: better checking
      expect(result.items).toBeArray()
    }
  })
})
