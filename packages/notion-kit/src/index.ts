import { z } from 'zod'
import {
  FilterOption,
  FilterOptionTree,
  ListOption,
  Accessor,
  GeneralSchema,
} from '@jeonghojeong/accessor'
import {
  CreatedTimePropertyItemObjectResponse,
  DatePropertyItemObjectResponse,
  LastEditedTimePropertyItemObjectResponse,
  MultiSelectPropertyItemObjectResponse,
  NumberPropertyItemObjectResponse,
  QueryDatabaseParameters,
  RelationPropertyItemObjectResponse,
  RichTextPropertyItemObjectResponse,
  SelectPropertyItemObjectResponse,
  StatusPropertyItemObjectResponse,
  TitlePropertyItemObjectResponse,
  UniqueIdPropertyItemObjectResponse,
  UrlPropertyItemObjectResponse,
} from '@notionhq/client/build/src/api-endpoints'
import {
  NotionFieldToZodType,
  NotionSchema,
  NotionSchemaToGeneralSchema,
} from './schema'
import type { Client } from '@notionhq/client'

interface NotionPageMetadata {
  uuid: string
}

export interface NotionAccessor<S extends GeneralSchema>
  extends Accessor<S, NotionPageMetadata> {}

function extractNotionPropertyValue(
  property:
    | UniqueIdPropertyItemObjectResponse
    | TitlePropertyItemObjectResponse
    | NumberPropertyItemObjectResponse
    | RichTextPropertyItemObjectResponse
    | RelationPropertyItemObjectResponse
    | CreatedTimePropertyItemObjectResponse
    | UrlPropertyItemObjectResponse
    | StatusPropertyItemObjectResponse
    | MultiSelectPropertyItemObjectResponse
    | SelectPropertyItemObjectResponse
    | LastEditedTimePropertyItemObjectResponse
    | DatePropertyItemObjectResponse
) {
  return (
    (() => {
      if (property.type === 'title') {
        return (
          property.title.plain_text ?? (property as any).title[0]?.plain_text
        )
      } else if (property.type === 'number') {
        return property.number
      } else if (property.type === 'unique_id') {
        return property.unique_id.number
      } else if (property.type === 'rich_text') {
        return (
          property.rich_text.plain_text ??
          (property as any).rich_text[0]?.plain_text
        )
      } else if (property.type === 'relation') {
        return property.relation.id
      } else if (property.type === 'created_time') {
        return new Date(property.created_time)
      } else if (property.type === 'url') {
        return property.url
      } else if (property.type === 'status') {
        return property.status?.name
      } else if (property.type === 'multi_select') {
        return property.multi_select.map((item) => item.name)
      } else if (property.type === 'select') {
        return property.select?.name
      } else if (property.type === 'last_edited_time') {
        return new Date(property.last_edited_time)
      } else if (property.type === 'date') {
        // TODO: handle end date
        return property.date?.start ? new Date(property.date?.start) : undefined
      }
      // TODO: provide more context
      throw new Error(`Not implemented: ${(property as any).type}`)
    })() ?? undefined
  )
}

function makeNotionCondition(condition: FilterOption<any, any>) {
  if ('eq' in condition) {
    return {
      equals: condition.eq,
    }
  } else if ('ne' in condition) {
    return {
      does_not_equal: condition.ne,
    }
  } else if ('ge' in condition) {
    return {
      greater_than_or_equal_to: condition.ge,
    }
  } else if ('gt' in condition) {
    return {
      greater_than: condition.gt,
    }
  } else if ('le' in condition) {
    return {
      less_than_or_equal_to: condition.le,
    }
  } else if ('lt' in condition) {
    return {
      less_than: condition.lt,
    }
  } else if ('contains' in condition) {
    return {
      contains: condition.contains,
    }
  } else if ('doesNotContain' in condition) {
    return {
      does_not_contain: condition.doesNotContain,
    }
  } else if ('startsWith' in condition) {
    return {
      starts_with: condition.startsWith,
    }
  } else if ('endsWith' in condition) {
    return {
      ends_with: condition.endsWith,
    }
  } else if ('isEmpty' in condition) {
    return {
      is_empty: true,
    }
  } else if ('isNotEmpty' in condition) {
    return {
      is_not_empty: true,
    }
  } else {
    throw new Error(`Unknown filter condition: ${JSON.stringify(condition)}`)
  }
}

export function createNotionAccessor<NS extends NotionSchema>(
  getNotionClient: () => Promise<Client>,
  databaseId: string,
  notionSchema: NS
): NotionAccessor<NotionSchemaToGeneralSchema<NS>> {
  const _notionClient = getNotionClient()

  const zodSchema = z.object(
    Object.fromEntries(
      Object.entries(notionSchema).map(([key, { type }]) => [
        key,
        NotionFieldToZodType[type],
      ])
    )
  )

  /** TODO: its inner types are messy and not correct. Fix it. */
  function makeNotionFilter(
    filter: FilterOptionTree<NotionSchemaToGeneralSchema<NS>> | any
  ): QueryDatabaseParameters['filter'] {
    if ('or' in filter) {
      return {
        or: filter.or.flatMap(
          (subFilter: any) => makeNotionFilter(subFilter as any) as any
        ),
      }
    }

    if ('and' in filter) {
      return {
        and: filter.and.flatMap(
          (subFilter: any) => makeNotionFilter(subFilter as any) as any
        ),
      }
    }

    if (typeof filter === 'object') {
      return Object.entries(filter).flatMap(([key, _condition]) => {
        const notionType = notionSchema[key]?.type

        if (!notionType) {
          throw new Error(`Not implemented type: ${key}, ${notionSchema[key]}`)
        }

        const condition: FilterOption<
          NotionSchemaToGeneralSchema<NS>,
          any
        > = _condition as any

        return [
          {
            type: notionType,
            property: key,
            [notionType]: makeNotionCondition(condition),
          },
        ]
      }) as any
    }

    throw new Error('Not a valid filter option tree.')
  }

  function makeNotionProperties(values: any) {
    return Object.fromEntries(
      Object.entries(values).flatMap(([propertyName, value]) => {
        if (value === undefined) {
          return []
        }

        const notionType = notionSchema[propertyName]?.type

        if (!notionType) {
          throw new Error('Not implemented')
        }

        return [
          [
            propertyName,
            {
              type: notionType,
              [notionType]:
                // TODO: Implement other types
                notionType === 'title'
                  ? [{ text: { content: value } }]
                  : notionType === 'rich_text'
                  ? [{ text: { content: value } }]
                  : notionType === 'status'
                  ? { name: value }
                  : value,
            },
          ],
        ]
      })
    ) as any
  }

  async function getPageIdFromUniqueId(uniqueId: string) {
    const notionClient = await _notionClient
    const retrieved = await notionClient.databases.query({
      database_id: databaseId,
      filter: {
        property: 'ID',
        unique_id: {
          equals: Number(uniqueId),
        },
      },
    })

    return retrieved.results[0]?.id
  }

  return {
    async get(key: string) {
      const notionClient = await _notionClient
      const retrieved = await notionClient.databases.query({
        database_id: databaseId,
        filter: {
          property: 'ID',
          unique_id: {
            equals: Number(key),
          },
        },
      })

      const item = retrieved.results[0]

      if (!item) {
        throw new Error(
          `Page with ID ${key} not found in database ${databaseId}`
        )
      }

      if (!('properties' in item)) {
        throw new Error(
          `Properties not found in the retrieved item: Key: ${key}, DatabaseId: ${databaseId}`
        )
      }

      const plainValues = Object.fromEntries(
        Object.entries(item.properties ?? {}).map(
          ([key, value]: [string, any]) =>
            [key, extractNotionPropertyValue(value)] as const
        )
      )

      return {
        ...zodSchema.parse(plainValues),
        _meta: {
          uuid: item.id,
        },
      } as any
    },

    async set() {
      throw new Error(
        'It is not possible to create a new page specifying the unique_id in Notion.'
      )
    },

    async add(value: any): Promise<{ _meta: NotionPageMetadata }> {
      const notionClient = await _notionClient

      const result = await notionClient.pages.create({
        parent: {
          database_id: databaseId,
        },
        properties: makeNotionProperties(value),
      })

      return {
        // TODO: Return key that can be used in `get`
        _meta: {
          uuid: result.id,
        },
      }
    },

    async update(key: string, value: any) {
      const notionClient = await _notionClient

      const pageId = await getPageIdFromUniqueId(key)

      if (!pageId) {
        throw new Error(
          `Page with ID ${key} not found in database ${databaseId}`
        )
      }

      await notionClient.pages.update({
        page_id: pageId,
        properties: makeNotionProperties(value),
      })
    },

    async list(options?: ListOption<NotionSchemaToGeneralSchema<NS>>) {
      const { cursor, filter, sort } = options ?? {}

      const notionClient = await _notionClient
      const retrieved = await notionClient.databases.query({
        database_id: databaseId,
        start_cursor: cursor?.value,
        filter: filter ? makeNotionFilter(filter) : undefined,
        sorts: sort as any,
      })

      const items = retrieved.results.map((notionItem) => {
        const plainValues = Object.fromEntries(
          Object.entries((notionItem as any)?.properties ?? {})
            .filter(([key]) => key in notionSchema)
            .map(
              ([key, value]: [string, any]) =>
                [key, extractNotionPropertyValue(value)] as const
            )
        )

        return {
          ...zodSchema.parse(plainValues),
          _meta: {
            uuid: notionItem.id,
          },
        } as any
      })

      return {
        cursor: {
          _type: 'Cursor',
          value: retrieved.next_cursor,
        },
        items,
      }
    },
  }
}
