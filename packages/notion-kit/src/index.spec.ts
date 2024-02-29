import { expect, describe, it } from 'bun:test'
import { createNotionAccessor } from './index'

const TEST_DB_1_ID = '6963eba998344add85613bf0da080dc2'
const TEST_DB_2_ID = 'b2225b7d48a440908090383df6cb5a6b'

/** TODO */
const getNotionClient = () => null as any

describe(createNotionAccessor.name, () => {
  it('should fetch & update record via ID property', async () => {
    const accessor = createNotionAccessor(getNotionClient, TEST_DB_1_ID, {
      숫자: {
        type: 'number',
      },
    })

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
    const accessor = createNotionAccessor(getNotionClient, TEST_DB_2_ID, {
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
    })

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
