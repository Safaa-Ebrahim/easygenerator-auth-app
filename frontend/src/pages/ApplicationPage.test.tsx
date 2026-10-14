import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { jsonResponse, mockFetch, renderApp, storeSession, testUser } from '../test/utils'

const profileOk = () =>
  jsonResponse(200, {
    message: 'Protected endpoint accessed successfully',
    user: { userId: testUser.id, email: testUser.email },
  })

describe('protected application page', () => {
  it('redirects visitors without a session to sign-in', async () => {
    const fetchMock = mockFetch(profileOk)
    renderApp('/app')

    expect(await screen.findByRole('heading', { name: 'Welcome back' })).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('redirects unknown routes through the guard', async () => {
    mockFetch(profileOk)
    renderApp('/does-not-exist')
    expect(await screen.findByRole('heading', { name: 'Welcome back' })).toBeInTheDocument()
  })

  it('verifies the token with the backend before showing the welcome message', async () => {
    storeSession()
    const fetchMock = mockFetch(profileOk)
    renderApp('/app')

    expect(screen.getByText('Verifying your session…')).toBeInTheDocument()
    expect(
      await screen.findByRole('heading', { name: 'Welcome to the application.' }),
    ).toBeInTheDocument()
    expect(fetchMock.mock.calls[0][1]?.headers).toMatchObject({
      Authorization: 'Bearer test-token',
    })
  })

  it('ends the session when the backend rejects the token', async () => {
    storeSession()
    mockFetch(() => jsonResponse(401, { statusCode: 401, message: 'Unauthorized' }))
    renderApp('/app')

    expect(
      await screen.findByText('Your session has expired. Please sign in again.'),
    ).toBeInTheDocument()
    expect(window.sessionStorage.getItem('auth.session')).toBeNull()
  })

  it('does not restore an expired stored session', async () => {
    storeSession({ expiresAt: Date.now() - 1000 })
    const fetchMock = mockFetch(profileOk)
    renderApp('/app')

    expect(await screen.findByRole('heading', { name: 'Welcome back' })).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('offers a retry when the profile request fails', async () => {
    storeSession()
    let calls = 0
    mockFetch(() => {
      calls += 1
      return calls === 1 ? Promise.reject(new TypeError('Failed to fetch')) : profileOk()
    })
    const { user } = renderApp('/app')

    expect(await screen.findByRole('alert')).toHaveTextContent(/unable to reach the server/i)
    await user.click(screen.getByRole('button', { name: 'Try again' }))
    expect(
      await screen.findByRole('heading', { name: 'Welcome to the application.' }),
    ).toBeInTheDocument()
  })

  it('logs out, clears the stored session and returns to sign-in', async () => {
    storeSession()
    mockFetch(profileOk)
    const { user } = renderApp('/app')

    await screen.findByRole('heading', { name: 'Welcome to the application.' })
    await user.click(screen.getByRole('button', { name: 'Log out' }))

    expect(await screen.findByText('You have been signed out.')).toBeInTheDocument()
    expect(window.sessionStorage.getItem('auth.session')).toBeNull()
  })

  it('sends signed-in users away from the auth forms', async () => {
    storeSession()
    mockFetch(profileOk)
    renderApp('/signin')

    expect(
      await screen.findByRole('heading', { name: 'Welcome to the application.' }),
    ).toBeInTheDocument()
  })
})
