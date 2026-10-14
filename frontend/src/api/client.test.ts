import { describe, expect, it } from 'vitest'
import { jsonResponse, mockFetch } from '../test/utils'
import { getProfile, signIn } from './auth'
import { ApiError, apiRequest, describeApiError } from './client'

describe('apiRequest', () => {
  it('sends JSON to the configured base URL with a bearer token', async () => {
    const fetchMock = mockFetch(() => jsonResponse(200, { ok: true }))

    await expect(
      apiRequest('/auth/test', { method: 'POST', body: { a: 1 }, token: 'abc' }),
    ).resolves.toEqual({ ok: true })

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('http://localhost:3000/auth/test')
    expect(init?.method).toBe('POST')
    expect(init?.body).toBe('{"a":1}')
    expect(init?.headers).toMatchObject({
      Authorization: 'Bearer abc',
      'Content-Type': 'application/json',
    })
  })

  it('turns NestJS error bodies into an ApiError with details', async () => {
    mockFetch(() =>
      jsonResponse(400, {
        statusCode: 400,
        message: ['email must be an email', 'name must be longer'],
        error: 'Bad Request',
      }),
    )

    const error = await apiRequest('/x').catch((caught: unknown) => caught)
    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({
      kind: 'http',
      status: 400,
      message: 'email must be an email',
      details: ['email must be an email', 'name must be longer'],
    })
  })

  it('reports network failures without leaking the underlying error', async () => {
    mockFetch(() => Promise.reject(new TypeError('Failed to fetch')))

    await expect(apiRequest('/x')).rejects.toMatchObject({
      kind: 'network',
      status: null,
      message: expect.stringMatching(/unable to reach the server/i),
    })
  })

  it('rejects successful responses that are not JSON', async () => {
    mockFetch(() => new Response('<html>proxy page</html>', { status: 200 }))
    await expect(apiRequest('/x')).rejects.toMatchObject({ kind: 'invalid-response' })
  })

  it('handles error responses without a JSON body', async () => {
    mockFetch(() => new Response('Bad Gateway', { status: 502 }))
    await expect(apiRequest('/x')).rejects.toMatchObject({ kind: 'http', status: 502 })
  })
})

describe('auth endpoints', () => {
  it('rejects a sign-in response without an access token', async () => {
    mockFetch(() => jsonResponse(200, { user: { id: '1', name: 'Ada', email: 'a@b.co' } }))
    await expect(signIn({ email: 'a@b.co', password: 'x' })).rejects.toMatchObject({
      kind: 'invalid-response',
    })
  })

  it('returns the profile from the protected endpoint', async () => {
    mockFetch(() =>
      jsonResponse(200, { message: 'ok', user: { userId: '1', email: 'a@b.co' } }),
    )
    await expect(getProfile('token')).resolves.toEqual({ userId: '1', email: 'a@b.co' })
  })
})

describe('describeApiError', () => {
  const http = (status: number, details: string[] = []) =>
    new ApiError('http', details[0] ?? 'raw server message', { status, details })

  it('prefers screen-specific messages for expected statuses', () => {
    expect(describeApiError(http(409), { 409: 'Email taken' })).toBe('Email taken')
  })

  it('maps generic statuses to friendly messages', () => {
    expect(describeApiError(http(400, ['email must be an email']))).toMatch(
      /email must be an email/,
    )
    expect(describeApiError(http(429))).toMatch(/too many attempts/i)
    expect(describeApiError(http(500))).toMatch(/something went wrong/i)
    expect(describeApiError(http(418))).not.toContain('raw server message')
  })

  it('handles unknown errors', () => {
    expect(describeApiError(new Error('boom'))).toMatch(/unexpected error/i)
  })
})
