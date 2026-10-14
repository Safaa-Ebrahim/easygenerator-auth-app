import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import { signIn as signInRequest, type SignInRequest } from '../api/auth'
import { AuthContext, type AuthContextValue, type SignOutReason } from './AuthContext'
import { clearSession, createSession, loadSession, saveSession, type Session } from './session'

// One id for every "session ended" notice, so an expiry timer and a 401
// arriving together still produce a single toast.
const SESSION_TOAST_ID = 'session-ended'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(() => loadSession())

  const signIn = useCallback(async (credentials: SignInRequest) => {
    const response = await signInRequest(credentials)
    const next = createSession(response)
    saveSession(next)
    setSession(next)
  }, [])

  const signOut = useCallback((reason: SignOutReason = 'user') => {
    clearSession()
    setSession(null)
    if (reason === 'expired') {
      toast.info('Your session has expired. Please sign in again.', { id: SESSION_TOAST_ID })
    } else {
      toast.success('You have been signed out.', { id: SESSION_TOAST_ID })
    }
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
    () => ({ session, signIn, signOut }),
    [session, signIn, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
