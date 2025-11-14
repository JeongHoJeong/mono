import { describe, expect, it } from 'bun:test'

import { group } from './group'

describe(group.name, () => {
  it('distinguishes between flags and parameters', () => {
    const grouped = group(['--name', 'foo', '--verbose', 'test.txt'], {
      options: ['--verbose'],
      optionsWithValue: ['--name'],
    })

    expect(grouped).toMatchSnapshot()
  })

  it('does not group flag as a value', () => {
    const grouped = group(['--name', '--verbose'], {
      options: ['--verbose'],
      optionsWithValue: ['--name'],
    })

    expect(grouped).toMatchSnapshot()
  })
})
