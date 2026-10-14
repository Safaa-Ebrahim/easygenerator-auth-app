import { screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { jsonResponse, mockFetch, renderApp, testUser } from '../test/utils'

async function fillForm(
  user: ReturnType<typeof renderApp>['user'],
  { name = 'Ada Lovelace', email = 'ada@example.com', password = 'Secur3!pass' } = {},
) {
  await user.type(screen.getByLabelText('Name'), name)
  await user.type(screen.getByLabelText('Email'), email)
  await user.type(screen.getByLabelText('Password'), password)
}

describe('SignUpPage', () => {
  it('validates every field before calling the API', async () => {
    const fetchMock = mockFetch(() => jsonResponse(500, {}))
    const { user } = renderApp('/signup')

    await user.click(screen.getByRole('button', { name: 'Create account' }))

    expect(screen.getByText('Name is required.')).toBeInTheDocument()
    expect(screen.getByText('Email is required.')).toBeInTheDocument()
    expect(screen.getByText('Password is required.')).toBeInTheDocument()
    expect(screen.getByLabelText('Name')).toHaveFocus()
    expect(screen.getByLabelText('Name')).toHaveAttribute('aria-invalid', 'true')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('explains which password requirements are missing', async () => {
    const fetchMock = mockFetch(() => jsonResponse(500, {}))
    const { user } = renderApp('/signup')

    await fillForm(user, { name: 'Al', email: 'not-an-email', password: 'password' })
    await user.click(screen.getByRole('button', { name: 'Create account' }))

    expect(screen.getByText(/at least 3 characters/)).toBeInTheDocument()
    expect(screen.getByText(/enter a valid email/i)).toBeInTheDocument()
    expect(
      screen.getByText(/at least one number, at least one special character/),
    ).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('registers the user and signs them straight in', async () => {
    const fetchMock = mockFetch((url) => {
      if (url.endsWith('/auth/signup')) {
        return jsonResponse(201, { message: 'User registered successfully', user: testUser })
      }
      if (url.endsWith('/auth/signin')) {
        return jsonResponse(200, {
          accessToken: 'jwt-token',
          tokenType: 'Bearer',
          expiresIn: 900,
          user: testUser,
        })
      }
      return jsonResponse(200, {
        message: 'Protected endpoint accessed successfully',
        user: { userId: testUser.id, email: testUser.email },
      })
    })
    const { user } = renderApp('/signup')

    await fillForm(user, { name: '  Ada Lovelace ', email: ' ada@example.com ' })
    await user.click(screen.getByRole('button', { name: 'Create account' }))

    expect(
      await screen.findByRole('heading', { name: 'Welcome to the application.' }),
    ).toBeInTheDocument()
    expect(await screen.findByText('Your account has been created.')).toBeInTheDocument()

    const [signupUrl, signupInit] = fetchMock.mock.calls[0]
    expect(signupUrl).toMatch(/\/auth\/signup$/)
    expect(JSON.parse(String(signupInit?.body))).toEqual({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      password: 'Secur3!pass',
    })
    const [signinUrl, signinInit] = fetchMock.mock.calls[1]
    expect(signinUrl).toMatch(/\/auth\/signin$/)
    expect(JSON.parse(String(signinInit?.body))).toEqual({
      email: 'ada@example.com',
      password: 'Secur3!pass',
    })
  })

  it('falls back to the sign-in page when the automatic sign-in fails', async () => {
    mockFetch((url) =>
      url.endsWith('/auth/signup')
        ? jsonResponse(201, { message: 'User registered successfully', user: testUser })
        : jsonResponse(429, { statusCode: 429, message: 'ThrottlerException: Too Many Requests' }),
    )
    const { user } = renderApp('/signup')

    await fillForm(user)
    await user.click(screen.getByRole('button', { name: 'Create account' }))

    expect(await screen.findByRole('heading', { name: 'Welcome back' })).toBeInTheDocument()
    expect(
      await screen.findByText('Your account has been created. Please sign in.'),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toHaveValue('ada@example.com')
    expect(screen.getByLabelText('Password')).toHaveValue('')
    expect(window.sessionStorage.getItem('auth.session')).toBeNull()
  })

  it('shows a clear message when the email is already registered', async () => {
    mockFetch(() =>
      jsonResponse(409, {
        statusCode: 409,
        message: 'Email is already registered',
        error: 'Conflict',
      }),
    )
    const { user } = renderApp('/signup')

    await fillForm(user)
    await user.click(screen.getByRole('button', { name: 'Create account' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'An account with this email already exists.',
    )
    expect(screen.getByRole('button', { name: 'Create account' })).toBeEnabled()
  })

  it('ignores repeated submits while the request is pending', async () => {
    let respond: (response: Response) => void = () => {}
    const fetchMock = mockFetch(
      () =>
        new Promise<Response>((resolve) => {
          respond = resolve
        }),
    )
    const { user } = renderApp('/signup')

    await fillForm(user)
    const form = screen.getByRole('button', { name: 'Create account' }).closest('form')!
    form.requestSubmit()
    form.requestSubmit()

    const button = await screen.findByRole('button', { name: 'Creating account…' })
    expect(button).toBeDisabled()
    await user.click(button)
    expect(fetchMock).toHaveBeenCalledTimes(1)

    respond(jsonResponse(409, { message: 'Email is already registered' }))
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument())
  })

  it('shows a live requirements checklist while the password is being created', async () => {
    const { user } = renderApp('/signup')
    const input = screen.getByLabelText('Password')
    const checklist = () => screen.queryByRole('list', { name: 'Password requirements' })

    expect(checklist()).not.toBeInTheDocument()

    await user.click(input)
    expect(checklist()).toBeInTheDocument()
    expect(input).toHaveAccessibleDescription(/at least 8 characters/i)

    await user.type(input, 'abc1')
    expect(screen.getByText('At least one letter')).toHaveClass('text-success')
    expect(screen.getByText('At least one special character')).not.toHaveClass('text-success')

    await user.type(input, '!xyz')
    expect(checklist()).not.toBeInTheDocument()
  })

  it('does not show the checklist on the sign-in password', async () => {
    const { user } = renderApp('/signin')
    await user.click(screen.getByLabelText('Password'))
    expect(screen.queryByRole('list', { name: 'Password requirements' })).not.toBeInTheDocument()
  })

  it('toggles password visibility accessibly', async () => {
    const { user } = renderApp('/signup')
    const input = screen.getByLabelText('Password')

    expect(input).toHaveAttribute('type', 'password')
    await user.click(screen.getByRole('button', { name: 'Show password' }))
    expect(input).toHaveAttribute('type', 'text')
    await user.click(screen.getByRole('button', { name: 'Hide password' }))
    expect(input).toHaveAttribute('type', 'password')
  })
})
