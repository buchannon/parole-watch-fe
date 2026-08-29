import { describe, expect, it } from 'vitest'
import { validatePassword } from './password'

describe('validatePassword', () => {
  it('rejects short passwords', () => {
    const result = validatePassword('Ab1!')
    expect(result.valid).toBe(false)
    expect(result.errors.join(' ')).toMatch(/at least 8/)
  })

  it('rejects passwords lacking two or more character classes', () => {
    const result = validatePassword('abcdefgh')
    expect(result.valid).toBe(false)
    expect(result.errors.join(' ')).toMatch(/lowercase, uppercase, digit, symbol/)
  })

  it('accepts a password meeting all four required classes', () => {
    const result = validatePassword('MediumStr0ng!Pass')
    expect(result.valid).toBe(true)
    expect(result.errors).toEqual([])
    expect(result.label).toBe('Strong')
  })

  it('accepts an 8-char password with exactly two classes', () => {
    expect(validatePassword('abcdefg1').valid).toBe(true)
    expect(validatePassword('abcdefGH').valid).toBe(true)
  })

  it('accepts an 8-char password with exactly three classes', () => {
    expect(validatePassword('abcdefG1').valid).toBe(true)
    expect(validatePassword('Abcdef12').valid).toBe(true)
  })

  it('labels weaker but valid passwords as medium', () => {
    const result = validatePassword('abcDEFG1')
    expect(result.valid).toBe(true)
    expect(result.label).toBe('Medium')
  })

  it('labels weak passwords', () => {
    const result = validatePassword('weak')
    expect(result.valid).toBe(false)
    expect(result.label).toBe('Weak')
  })
})
