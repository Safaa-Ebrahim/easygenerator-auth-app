import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { vi } from 'vitest'
import App from '../App'
import { AuthProvider } from '../auth/AuthProvider'
import { saveSession, type Session } from '../auth/session'

export type FetchHandler = (url: string, init: RequestInit) => Response | Promise<Response>

/** Replaces global fetch for the current test; reset by `unstubGlobals`. */
export function mockFetch(handler: FetchHandler) {
  const fetchMock = vi.fn((input: RequestInfo | URL, init: RequestInit = {}) =>
    Promise.resolve(handler(String(input), init)),
  )
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

export function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

export const testUser = { id: 'user-1', name: 'Ada Lovelace', email: 'ada@example.com' }

export function storeSession(overrides: Partial<Session> = {}) {
  saveSession({
    accessToken: 'test-token',
    expiresAt: Date.now() + 10 * 60 * 1000,
    user: testUser,
    ...overrides,
  })
}

export function renderApp(initialPath: string, state?: unknown) {
  const user = userEvent.setup()
  const result = render(
    <MemoryRouter initialEntries={[{ pathname: initialPath, state }]}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </MemoryRouter>,
  )
  return { user, ...result }
}
