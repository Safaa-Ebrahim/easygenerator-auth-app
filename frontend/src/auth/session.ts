import { isAuthUser, type AuthUser, type SignInResponse } from '../api/auth'
import { isRecord } from '../api/client'

/*
 * Token storage trade-off
 * -----------------------
 * The backend returns a short-lived bearer token in the response body
 * and has no refresh token or cookie support, so the token must live in
 * JavaScript-accessible storage. sessionStorage keeps the session across page
 * reloads but is scoped to one tab and cleared when the tab closes, which
 * limits exposure compared with localStorage. It is still readable by any
 * script running on the page, so it does NOT protect against XSS; an httpOnly,
 * SameSite cookie issued by the backend would be the stronger option.
 */

const STORAGE_KEY = 'auth.session'

export interface Session {
  accessToken: string
  /**
   * Epoch milliseconds when the token expires, derived from the backend's
   * `expiresIn`. Only used to end the session locally; the backend remains the
   * authority and rejects expired tokens with 401.
   */
  expiresAt: number
  user: AuthUser
}

export function createSession(response: SignInResponse, now = Date.now()): Session {
  return {
    accessToken: response.accessToken,
    expiresAt: now + response.expiresIn * 1000,
    user: response.user,
  }
}

export function isSessionExpired(session: Session, now = Date.now()): boolean {
  return now >= session.expiresAt
}

function isSession(value: unknown): value is Session {
  return (
    isRecord(value) &&
    typeof value.accessToken === 'string' &&
    value.accessToken.length > 0 &&
    typeof value.expiresAt === 'number' &&
    isAuthUser(value.user)
  )
}

/** Returns the stored session, discarding it if it is malformed or expired. */
export function loadSession(now = Date.now()): Session | null {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (isSession(parsed) && !isSessionExpired(parsed, now)) return parsed
  } catch {
    // Storage unavailable or corrupted: fall through and clear it.
  }
  clearSession()
  return null
}

export function saveSession(session: Session): void {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session))
  } catch {
    // Storage can be unavailable (e.g. privacy mode); the in-memory session
    // still works until the page is reloaded.
  }
}

export function clearSession(): void {
  try {
    window.sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // Nothing to clear if storage is unavailable.
  }
}
