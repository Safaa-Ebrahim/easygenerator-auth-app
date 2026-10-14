import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { jsonResponse, mockFetch, renderApp, testUser } from '../test/utils'

describe('SignInPage', () => {
  it('requires a valid email and a password', async () => {
    const fetchMock = mockFetch(() => jsonResponse(500, {}))
    const { user } = renderApp('/signin')

    await user.type(screen.getByLabelText('Email'), 'ada@')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(screen.getByText(/enter a valid email/i)).toBeInTheDocument()
    expect(screen.getByText('Password is required.')).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('shows an error and clears the password for invalid credentials', async () => {
    mockFetch(() =>
      jsonResponse(401, {
        statusCode: 401,
        message: 'Invalid email or password',
        error: 'Unauthorized',
      }),
    )
    const { user } = renderApp('/signin')

    await user.type(screen.getByLabelText('Email'), 'ada@example.com')
    await user.type(screen.getByLabelText('Password'), 'wrong-Passw0rd!')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Incorrect email or password.')
    expect(screen.getByLabelText('Password')).toHaveValue('')
    expect(screen.queryByText('Password is required.')).not.toBeInTheDocument()
    expect(window.sessionStorage.length).toBe(0)
  })

  it('reports network failures', async () => {
    mockFetch(() => Promise.reject(new TypeError('Failed to fetch')))
    const { user } = renderApp('/signin')

    await user.type(screen.getByLabelText('Email'), 'ada@example.com')
    await user.type(screen.getByLabelText('Password'), 'Secur3!pass')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/unable to reach the server/i)
  })

  it('stores the session and opens the application on success', async () => {
    const fetchMock = mockFetch((url) =>
      url.endsWith('/auth/signin')
        ? jsonResponse(200, {
            accessToken: 'jwt-token',
            tokenType: 'Bearer',
            expiresIn: 900,
            user: testUser,
          })
        : jsonResponse(200, {
            message: 'Protected endpoint accessed successfully',
            user: { userId: testUser.id, email: testUser.email },
          }),
    )
    const { user } = renderApp('/signin')

    await user.type(screen.getByLabelText('Email'), 'ada@example.com')
    await user.type(screen.getByLabelText('Password'), 'Secur3!pass')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(
      await screen.findByRole('heading', { name: 'Welcome to the application.' }),
    ).toBeInTheDocument()

    const stored = JSON.parse(window.sessionStorage.getItem('auth.session') ?? '{}')
    expect(stored).toMatchObject({ accessToken: 'jwt-token', user: testUser })
    expect(JSON.stringify(stored)).not.toContain('Secur3!pass')

    const profileCall = fetchMock.mock.calls.find(([url]) => String(url).endsWith('/auth/profile'))
    expect(profileCall?.[1]?.headers).toMatchObject({ Authorization: 'Bearer jwt-token' })
  })
})
