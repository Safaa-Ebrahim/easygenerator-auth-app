import { describe, expect, it } from 'vitest'
import { getInitials } from './initials'

describe('getInitials', () => {
  it.each([
    ['Ada Lovelace', 'AL'],
    ['  ada   byron lovelace ', 'AL'],
    ['Ada', 'A'],
    ['', '?'],
  ])('%j -> %s', (name, expected) => {
    expect(getInitials(name)).toBe(expected)
  })
})
