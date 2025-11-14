import { describe, test, expect } from 'bun:test'
import { splitWithSizeLimit } from './strings'

type TestCase = [
  testString: string,
  lengthLimit: number,
  {
    numSegments?: number
    segments?: string[]
  },
]

describe(splitWithSizeLimit.name, () => {
  test.each<TestCase>([
    [
      'a\nb\nc',
      4,
      {
        segments: ['a\nb\n', 'c'],
      },
    ],
    [
      'abcd\nef',
      3,
      {
        segments: ['ab\n', 'cd\n', 'ef'],
      },
    ],
    [
      'abcde',
      5,
      {
        // It seems weird, but to lower implementation complexity, for now we just split it into two segments.
        segments: ['abcd\n', 'e'],
      },
    ],
    [
      'abcde',
      4,
      {
        segments: ['abc\n', 'de'],
      },
    ],
    [
      '',
      2,
      {
        segments: [''],
      },
    ],
    [
      'abc',
      10,
      {
        segments: ['abc'],
      },
    ],
    [
      'abc',
      2,
      {
        segments: ['a\n', 'b\n', 'c'],
      },
    ],
    [
      'Divide at proper points.\nAvoid dividing in the middle of a sentence if it can be avoided.',
      80,
      {
        segments: [
          'Divide at proper points.\n',
          'Avoid dividing in the middle of a sentence if it can be avoided.',
        ],
      },
    ],
  ])('case: %#', (testString, lengthLimit, expected) => {
    const result = splitWithSizeLimit(testString, lengthLimit)

    if (expected.segments) {
      expect(result).toEqual(expected.segments)
    }

    if (expected.numSegments !== undefined) {
      expect(result.length).toBe(expected.numSegments)
    }

    // Expect all segments are less than or equal to lengthLimit characters.
    result.forEach((segment) => {
      expect(segment.length).toBeLessThanOrEqual(lengthLimit)
    })

    // Expect nothing is changed except line breaks.
    expect(result.join('').replaceAll('\n', '')).toBe(
      testString.replaceAll('\n', ''),
    )
  })

  test('exceptions', () => {
    expect(() => splitWithSizeLimit('abc', 0)).toThrow('at least 2')
    expect(() => splitWithSizeLimit('abc', -1)).toThrow('at least 2')
    expect(() => splitWithSizeLimit('abc', 1.5)).toThrow('integer')
    expect(() => splitWithSizeLimit('abc', Infinity)).toThrow('integer')
  })
})
