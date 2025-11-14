import { describe, test, expect } from 'bun:test'
import { convert, makeTrie } from './trie'

describe(makeTrie.name, () => {
  test('basic behavior', () => {
    const trie = makeTrie([
      ['dog', 'D'],
      ['cat', 'C'],
    ])

    expect(convert('dogcat', trie)).toBe('DC')
  })

  test('handling same leading characters', () => {
    const trie = makeTrie([
      ['aunt', 'Aunt'],
      ['ant', 'Ant'],
      ['ate', 'Ate'],
      ['axe', 'Axe'],
    ])

    expect(convert('aaaant', trie)).toBe('aaaAnt')
    expect(convert('aaunt', trie)).toBe('aAunt')
  })

  test('empty mappings', () => {
    const trie = makeTrie([])

    // Should return input as is if there are no mappings
    expect(convert('test', trie)).toBe('test')
  })

  test('empty input', () => {
    const trie = makeTrie([
      ['a', 'A'],
      ['b', 'B'],
    ])

    expect(convert('', trie)).toBe('')
  })

  test('non-matching input', () => {
    const trie = makeTrie([
      ['a', 'A'],
      ['b', 'B'],
    ])

    expect(convert('abc', trie)).toBe('ABc')
  })

  test('longest match priority', () => {
    const trie = makeTrie([
      ['a', 'A'],
      ['ab', 'AB'],
      ['abc', 'ABC'],
      ['b', 'B'],
      ['bc', 'BC'],
    ])

    // Longest match should take priority
    expect(convert('abc', trie)).toBe('ABC')
    expect(convert('abbc', trie)).toBe('ABBC')
    expect(convert('abcbc', trie)).toBe('ABCBC')
  })

  test('overlapping patterns', () => {
    const trie = makeTrie([
      ['ab', 'AB'],
      ['bc', 'BC'],
    ])

    expect(convert('abc', trie)).toBe('ABc')
    expect(convert('bcd', trie)).toBe('BCd')
  })

  test('prefix patterns', () => {
    const trie = makeTrie([
      ['a', 'A'],
      ['aa', 'AA'],
      ['aaa', 'AAA'],
    ])

    expect(convert('a', trie)).toBe('A')
    expect(convert('aa', trie)).toBe('AA')
    expect(convert('aaa', trie)).toBe('AAA')
    expect(convert('aaaa', trie)).toBe('AAAA')
    expect(convert('aaaaa', trie)).toBe('AAAAA')
  })
})
