import { describe, expect, it } from 'bun:test'

import { input } from './input-factory'

describe('input factory', () => {
  describe('string type', () => {
    it('creates required string input', () => {
      const stringInput = input('string').required()
      expect(stringInput.isOptional).toBe(false)
      expect(stringInput.transform('hello')).toEqual({ result: 'hello' })
    })

    it('creates optional string input', () => {
      const stringInput = input('string').optional()
      expect(stringInput.isOptional).toBe(true)
      expect(stringInput.transform('world')).toEqual({ result: 'world' })
    })
  })

  describe('int type', () => {
    it('creates required int input', () => {
      const intInput = input('int').required()
      expect(intInput.isOptional).toBe(false)
      expect(intInput.transform('42')).toEqual({ result: 42 })
    })

    it('returns error for invalid int', () => {
      const intInput = input('int').required()
      expect(intInput.transform('abc')).toEqual({
        error: '"abc" is not a valid integer',
      })
    })

    it('handles negative integers', () => {
      const intInput = input('int').required()
      expect(intInput.transform('-123')).toEqual({ result: -123 })
    })
  })

  describe('float type', () => {
    it('creates required float input', () => {
      const floatInput = input('float').required()
      expect(floatInput.isOptional).toBe(false)
      expect(floatInput.transform('3.14')).toEqual({ result: 3.14 })
    })

    it('returns error for invalid float', () => {
      const floatInput = input('float').required()
      expect(floatInput.transform('not-a-number')).toEqual({
        error: '"not-a-number" is not a valid number',
      })
    })

    it('handles integers as floats', () => {
      const floatInput = input('float').required()
      expect(floatInput.transform('42')).toEqual({ result: 42 })
    })
  })

  describe('boolean type', () => {
    it('creates required boolean input', () => {
      const boolInput = input('boolean').required()
      expect(boolInput.isOptional).toBe(false)
      expect(boolInput.transform('anything')).toEqual({ result: true })
    })

    it('always returns true', () => {
      const boolInput = input('boolean').optional()
      expect(boolInput.transform('')).toEqual({ result: true })
      expect(boolInput.transform('false')).toEqual({ result: true })
    })
  })

  describe('custom transform', () => {
    it('accepts custom transform function', () => {
      const customInput = input((raw: string) => ({
        result: raw.toUpperCase(),
      })).required()

      expect(customInput.transform('hello')).toEqual({ result: 'HELLO' })
    })

    it('custom transform with validation', () => {
      const emailInput = input((raw: string) => {
        if (!raw.includes('@')) {
          return { error: 'Invalid email format' }
        }
        return { result: raw.toLowerCase() }
      })

      expect(emailInput.isOptional).toBe(false)
      expect(emailInput.transform('Test@Example.com')).toEqual({
        result: 'test@example.com',
      })
      expect(emailInput.transform('invalid')).toEqual({
        error: 'Invalid email format',
      })
    })
  })

  describe('type inference', () => {
    it('infers correct types', () => {
      const stringInput = input('string').required()
      const intInput = input('int').optional()

      {
        const _ =
          // Type checks - these should compile without errors
          {
            transform: () => ({ result: '' }),
            isOptional: false,
            required: () => stringInput,
            optional: () => input('string').optional(),
          } satisfies typeof stringInput

        void _
      }

      {
        const _ =
          // Type checks - these should compile without errors
          {
            transform: () => ({ result: 0 }),
            isOptional: true,
            required: () => input('int').required(),
            optional: () => intInput,
          } satisfies typeof intInput

        void _
      }
    })
  })
})
