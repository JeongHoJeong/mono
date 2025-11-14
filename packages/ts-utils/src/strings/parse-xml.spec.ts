import { describe, expect, it } from 'bun:test'
import { parseXML } from './parse-xml'

describe(parseXML.name, () => {
  it('parses basic XML', () => {
    const result = parseXML('<main>content</main>')
    expect(result).toMatchSnapshot()
  })

  it('parses nested XML', () => {
    const result = parseXML('<ul><li>Item 1</li><li>Item 2</li></ul>')
    expect(result).toMatchSnapshot()
  })
})
