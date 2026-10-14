import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { signIn as signInRequest, type SignInRequest } from '../api/auth'
import { AuthContext, type AuthContextValue, type SignOutReason } from './AuthContext'
import { clearSession, createSession, loadSession, saveSession, type Session } from './session'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(() => loadSession())
  const [lastSignOutReason, setLastSignOutReason] = useState<SignOutReason | null>(null)

  const signIn = useCallback(async (credentials: SignInRequest) => {
    const response = await signInRequest(credentials)
    const next = createSession(response)
    saveSession(next)
    setLastSignOutReason(null)
    setSession(next)
  }, [])

  const signOut = useCallback((reason: SignOutReason = 'user') => {
    clearSession()
    setLastSignOutReason(reason)
    setSession(null)
  }, [])

  // End the session locally once the token expires. The backend rejects
  // expired tokens regardless; this just keeps the UI in sync.
  useEffect(() => {
    if (!session) return
    const timeoutId = window.setTimeout(
      () => signOut('expired'),
      Math.max(session.expiresAt - Date.now(), 0),
    )
    return () => window.clearTimeout(timeoutId)
  }, [session, signOut])

  const value = useMemo<AuthContextValue>(
    () => ({ session, lastSignOutReason, signIn, signOut }),
    [session, lastSignOutReason, signIn, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
