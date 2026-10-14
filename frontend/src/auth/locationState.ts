import { isRecord } from '../api/client'

export type SignInNotice = 'registered' | 'expired' | 'signed-out'

/** Router state accepted by the sign-in page. Never contains secrets. */
export interface SignInLocationState {
  notice?: SignInNotice
  email?: string
  from?: string
}

const NOTICES: readonly SignInNotice[] = ['registered', 'expired', 'signed-out']

/** Router state is untyped (and user-controllable), so validate it. */
export function parseSignInState(state: unknown): SignInLocationState {
  if (!isRecord(state)) return {}
  const result: SignInLocationState = {}
  if (NOTICES.includes(state.notice as SignInNotice)) {
    result.notice = state.notice as SignInNotice
  }
  if (typeof state.email === 'string') result.email = state.email
  // Only allow in-app paths to avoid redirecting somewhere unexpected.
  if (typeof state.from === 'string' && state.from.startsWith('/') && !state.from.startsWith('//')) {
    result.from = state.from
  }
  return result
}
