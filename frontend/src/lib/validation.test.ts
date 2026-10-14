import { describe, expect, it } from 'vitest'
import {
  getPasswordChecks,
  validateEmail,
  validateName,
  validateNewPassword,
  validateSignIn,
  validateSignUp,
} from './validation'

describe('validateName', () => {
  it('requires at least 3 non-whitespace characters', () => {
    expect(validateName('')).toBe('Name is required.')
    expect(validateName('  ')).toBe('Name is required.')
    expect(validateName('Al')).toMatch(/at least 3/)
    expect(validateName('  Al  ')).toMatch(/at least 3/)
    expect(validateName('Ada')).toBeUndefined()
  })

  it('rejects names longer than the backend limit', () => {
    expect(validateName('a'.repeat(101))).toMatch(/at most 100/)
  })
})

describe('validateEmail', () => {
  it.each(['', 'plainaddress', 'missing@tld', 'two words@example.com', '@example.com'])(
    'rejects %j',
    (email) => {
      expect(validateEmail(email)).toBeDefined()
    },
  )

  it.each(['ada@example.com', ' ada@example.com ', 'first.last+tag@sub.example.co'])(
    'accepts %j',
    (email) => {
      expect(validateEmail(email)).toBeUndefined()
    },
  )
})

describe('validateNewPassword', () => {
  it('requires a password', () => {
    expect(validateNewPassword('')).toBe('Password is required.')
  })

  it.each([
    ['Ab1!', /at least 8 characters/],
    ['abcdefgh', /at least one number, at least one special character/],
    ['abcdefg1', /at least one special character/],
    ['1234567!', /at least one letter/],
    ['abcdefg!', /at least one number/],
  ])('reports the unmet requirements for %j', (password, message) => {
    expect(validateNewPassword(password)).toMatch(message)
  })

  it('accepts a password meeting every requirement', () => {
    expect(validateNewPassword('Secur3!pass')).toBeUndefined()
  })

  it('rejects passwords over the bcrypt-safe limit of 72 characters', () => {
    expect(validateNewPassword(`${'a'.repeat(70)}1!a`)).toMatch(/at most 72/)
  })
})

describe('getPasswordChecks', () => {
  it('reports each requirement individually', () => {
    const met = Object.fromEntries(getPasswordChecks('abc1').map((check) => [check.id, check.met]))
    expect(met).toEqual({ length: false, letter: true, number: true, special: false })
  })
})

describe('form validators', () => {
  it('returns only the fields with errors', () => {
    expect(validateSignUp({ name: 'Ada', email: 'bad', password: 'Secur3!pass' })).toEqual({
      email: expect.any(String),
    })
    expect(validateSignIn({ email: 'ada@example.com', password: '' })).toEqual({
      password: 'Password is required.',
    })
    expect(validateSignIn({ email: 'ada@example.com', password: 'x' })).toEqual({})
  })
})
