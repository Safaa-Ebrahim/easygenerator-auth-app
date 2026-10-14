import { isRecord } from '../api/client'

/** Router state accepted by the sign-in page. Never contains secrets. */
export interface SignInLocationState {
  /** Prefills the email after registration. */
  email?: string
  /** Where to return after signing in. */
  from?: string
}

/** Router state is untyped (and user-controllable), so validate it. */
export function parseSignInState(state: unknown): SignInLocationState {
  if (!isRecord(state)) return {}
  const result: SignInLocationState = {}
  if (typeof state.email === 'string') result.email = state.email
  // Only allow in-app paths to avoid redirecting somewhere unexpected.
  if (typeof state.from === 'string' && state.from.startsWith('/') && !state.from.startsWith('//')) {
    result.from = state.from
  }
  return result
}
