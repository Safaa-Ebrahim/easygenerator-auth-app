import { describe, expect, it } from 'vitest'
import { clearSession, createSession, isSessionExpired, loadSession, saveSession } from './session'

const user = { id: 'u1', name: 'Ada', email: 'ada@example.com' }
const STORAGE_KEY = 'auth.session'

describe('session storage', () => {
  it('derives the expiry from the backend-provided expiresIn', () => {
    const session = createSession(
      { accessToken: 'token', tokenType: 'Bearer', expiresIn: 900, user },
      1_000_000,
    )
    expect(session.expiresAt).toBe(1_000_000 + 900_000)
    expect(isSessionExpired(session, session.expiresAt - 1)).toBe(false)
    expect(isSessionExpired(session, session.expiresAt)).toBe(true)
  })

  it('round-trips a valid session', () => {
    const session = { accessToken: 'token', expiresAt: Date.now() + 60_000, user }
    saveSession(session)
    expect(loadSession()).toEqual(session)
  })

  it('discards an expired session', () => {
    saveSession({ accessToken: 'token', expiresAt: Date.now() - 1, user })
    expect(loadSession()).toBeNull()
    expect(window.sessionStorage.getItem(STORAGE_KEY)).toBeNull()
  })

  it.each([
    ['corrupted JSON', '{not json'],
    ['an unexpected shape', JSON.stringify({ accessToken: 42 })],
    ['an empty token', JSON.stringify({ accessToken: '', expiresAt: Date.now() + 60_000, user })],
  ])('discards %s', (_label, raw) => {
    window.sessionStorage.setItem(STORAGE_KEY, raw)
    expect(loadSession()).toBeNull()
    expect(window.sessionStorage.getItem(STORAGE_KEY)).toBeNull()
  })

  it('clears the stored session', () => {
    saveSession({ accessToken: 'token', expiresAt: Date.now() + 60_000, user })
    clearSession()
    expect(loadSession()).toBeNull()
  })
})
