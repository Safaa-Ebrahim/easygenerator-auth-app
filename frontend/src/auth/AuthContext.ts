import { createContext } from 'react'
import type { SignInRequest } from '../api/auth'
import type { Session } from './session'

/** Why the session ended; decides which notice the user sees. */
export type SignOutReason = 'user' | 'expired'

export interface AuthContextValue {
  session: Session | null
  signIn: (credentials: SignInRequest) => Promise<void>
  signOut: (reason?: SignOutReason) => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
