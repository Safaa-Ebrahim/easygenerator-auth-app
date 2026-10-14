import { useEffect, useState } from 'react'
import { getProfile, type Profile } from '../api/auth'
import { ApiError, describeApiError } from '../api/client'
import { useAuth } from '../auth/useAuth'
import { Alert } from '../components/Alert'
import { BrandMark } from '../components/BrandMark'
import { Button } from '../components/Button'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { LogOutIcon } from '../components/icons'
import { Spinner } from '../components/Spinner'
import { UserBadge } from '../components/UserBadge'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

const statusClasses = 'flex max-w-110 flex-col items-center gap-4 text-center text-muted'

type ProfileState =
  | { status: 'loading' }
  | { status: 'ready'; profile: Profile }
  | { status: 'error'; message: string }

export function ApplicationPage() {
  useDocumentTitle('Application')
  const { session, signOut } = useAuth()
  const [state, setState] = useState<ProfileState>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)
  const [confirmingLogout, setConfirmingLogout] = useState(false)

  // Confirm the token with the backend's protected endpoint before showing
  // the page; a 401 means it is expired or invalid, so end the session.
  useEffect(() => {
    if (!session) return
    const controller = new AbortController()

    getProfile(session.accessToken, controller.signal)
      .then((profile) => setState({ status: 'ready', profile }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        if (error instanceof ApiError && error.status === 401) {
          signOut('expired')
          return
        }
        setState({ status: 'error', message: describeApiError(error) })
      })

    return () => controller.abort()
  }, [session, signOut, attempt])

  const retry = () => {
    setState({ status: 'loading' })
    setAttempt((current) => current + 1)
  }

  return (
    <div className="flex min-h-svh flex-col">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-surface px-4 py-3 sm:px-8 sm:py-4">
        <BrandMark />
        <div className="flex min-w-0 items-center gap-4">
          {session && <UserBadge name={session.user.name} email={session.user.email} />}
          <Button
            variant="soft"
            className="px-3"
            onClick={() => setConfirmingLogout(true)}
          >
            <span className="flex items-center gap-2">
              <LogOutIcon size={18} />
              {/* Icon-only on mobile; the label stays available to screen readers. */}
              <span className="max-[479px]:sr-only">Log out</span>
            </span>
          </Button>
        </div>
      </header>

      <ConfirmDialog
        open={confirmingLogout}
        title="Confirm Logout"
        description="Are you sure you want to log out? You will need to sign in again to access your account."
        confirmLabel="Log out"
        confirmVariant="danger"
        onConfirm={() => signOut('user')}
        onCancel={() => setConfirmingLogout(false)}
      />

      <main className="grid flex-1 place-items-center px-4 py-8">
        {state.status === 'loading' && (
          <div className={statusClasses} role="status">
            <Spinner large />
            <p>Verifying your session…</p>
          </div>
        )}

        {state.status === 'error' && (
          <div className={statusClasses}>
            <Alert>{state.message}</Alert>
            <Button onClick={retry}>Try again</Button>
          </div>
        )}

        {state.status === 'ready' && (
          <section
            className="flex max-w-160 flex-col gap-3 text-center"
            aria-labelledby="welcome-title"
          >
            <h1
              id="welcome-title"
              className="text-[clamp(1.75rem,4vw+1rem,3rem)] leading-[1.15] font-bold tracking-tight"
            >
              Welcome to the application.
            </h1>
            <p className="text-lg text-muted">
              You are signed in as <strong>{session?.user.name ?? state.profile.email}</strong>.
            </p>
          </section>
        )}
      </main>
    </div>
  )
}
