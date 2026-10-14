import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router'
import { ROUTES } from '../paths'
import type { SignInLocationState, SignInNotice } from './locationState'
import type { SignOutReason } from './AuthContext'
import { useAuth } from './useAuth'

const SIGN_OUT_NOTICES: Record<SignOutReason, SignInNotice> = {
  user: 'signed-out',
  expired: 'expired',
}

/**
 * Hides pages from visitors without a local session. This is a UX guard only:
 * the backend still authorizes every protected request.
 */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { session, lastSignOutReason } = useAuth()
  const location = useLocation()

  if (!session) {
    const state: SignInLocationState = {
      from: location.pathname,
      notice: lastSignOutReason ? SIGN_OUT_NOTICES[lastSignOutReason] : undefined,
    }
    return <Navigate to={ROUTES.signIn} replace state={state} />
  }

  return children
}

/** Sends already signed-in users from the auth forms to the application. */
export function PublicOnlyRoute({ children }: { children: ReactNode }) {
  const { session } = useAuth()
  if (session) return <Navigate to={ROUTES.app} replace />
  return children
}
