import { ApiError, apiRequest, isRecord } from './client'

// Shapes mirror backend/src/auth (DTOs and AuthService return values).

export interface AuthUser {
  id: string
  name: string
  email: string
}

export interface SignUpRequest {
  name: string
  email: string
  password: string
}

export interface SignInRequest {
  email: string
  password: string
}

export interface SignInResponse {
  accessToken: string
  tokenType: 'Bearer'
  /** Token lifetime in seconds. */
  expiresIn: number
  user: AuthUser
}

export interface Profile {
  userId: string
  email: string
}

function invalidResponse(): ApiError {
  return new ApiError('invalid-response', 'Received an unexpected response from the server.')
}

export function isAuthUser(value: unknown): value is AuthUser {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.email === 'string'
  )
}

function isSignInResponse(value: unknown): value is SignInResponse {
  return (
    isRecord(value) &&
    typeof value.accessToken === 'string' &&
    value.accessToken.length > 0 &&
    value.tokenType === 'Bearer' &&
    typeof value.expiresIn === 'number' &&
    value.expiresIn > 0 &&
    isAuthUser(value.user)
  )
}

function isProfile(value: unknown): value is Profile {
  return isRecord(value) && typeof value.userId === 'string' && typeof value.email === 'string'
}

export async function signUp(data: SignUpRequest): Promise<AuthUser> {
  const payload = await apiRequest('/auth/signup', { method: 'POST', body: data })
  if (!isRecord(payload) || !isAuthUser(payload.user)) throw invalidResponse()
  return payload.user
}

export async function signIn(data: SignInRequest): Promise<SignInResponse> {
  const payload = await apiRequest('/auth/signin', { method: 'POST', body: data })
  if (!isSignInResponse(payload)) throw invalidResponse()
  return payload
}

export async function getProfile(token: string, signal?: AbortSignal): Promise<Profile> {
  const payload = await apiRequest('/auth/profile', { token, signal })
  if (!isRecord(payload) || !isProfile(payload.user)) throw invalidResponse()
  return payload.user
}
