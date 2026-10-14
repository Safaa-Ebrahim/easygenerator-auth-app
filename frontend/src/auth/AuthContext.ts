import { createContext } from 'react'
import type { SignInRequest } from '../api/auth'
import type { Session } from './session'

/** Why the last session ended; used to show the right notice on sign-in. */
export type SignOutReason = 'user' | 'expired'

export interface AuthContextValue {
  session: Session | null
  lastSignOutReason: SignOutReason | null
  signIn: (credentials: SignInRequest) => Promise<void>
  signOut: (reason?: SignOutReason) => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
