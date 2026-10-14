import { API_BASE_URL } from '../config'

const REQUEST_TIMEOUT_MS = 15_000

export type ApiErrorKind = 'http' | 'network' | 'timeout' | 'invalid-response'

/** Error raised for every failed API call, so callers only handle one type. */
export class ApiError extends Error {
  readonly kind: ApiErrorKind
  /** HTTP status code; `null` when no response was received. */
  readonly status: number | null
  /** Individual messages returned by the server (e.g. validation errors). */
  readonly details: string[]

  constructor(
    kind: ApiErrorKind,
    message: string,
    options: { status?: number | null; details?: string[] } = {},
  ) {
    super(message)
    this.name = 'ApiError'
    this.kind = kind
    this.status = options.status ?? null
    this.details = options.details ?? []
  }
}

export interface RequestOptions {
  method?: 'GET' | 'POST'
  body?: unknown
  /** Bearer access token for protected endpoints. */
  token?: string
  signal?: AbortSignal
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** NestJS errors carry `message` as a string or, for validation, a string array. */
function extractServerMessages(payload: unknown): string[] {
  if (!isRecord(payload)) return []
  const { message } = payload
  if (typeof message === 'string') return [message]
  if (Array.isArray(message)) {
    return message.filter((item): item is string => typeof item === 'string')
  }
  return []
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text()
  if (!text) return null
  try {
    return JSON.parse(text) as unknown
  } catch {
    if (response.ok) {
      throw new ApiError('invalid-response', 'Received an unexpected response from the server.', {
        status: response.status,
      })
    }
    return null
  }
}

/**
 * Performs a JSON request against the backend and returns the parsed body.
 * Response bodies are returned as `unknown`; callers validate their shape.
 */
export async function apiRequest(path: string, options: RequestOptions = {}): Promise<unknown> {
  const { method = 'GET', body, token, signal } = options

  const headers: Record<string, string> = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`

  const controller = new AbortController()
  let timedOut = false
  const timeoutId = setTimeout(() => {
    timedOut = true
    controller.abort()
  }, REQUEST_TIMEOUT_MS)
  const abortFromCaller = () => controller.abort()
  if (signal?.aborted) controller.abort()
  signal?.addEventListener('abort', abortFromCaller, { once: true })

  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    })
  } catch (error) {
    // A caller-initiated abort is not a failure to report; let it propagate.
    if (signal?.aborted) throw error
    if (timedOut) {
      throw new ApiError('timeout', 'The server took too long to respond. Please try again.')
    }
    throw new ApiError(
      'network',
      'Unable to reach the server. Check your connection and try again.',
    )
  } finally {
    clearTimeout(timeoutId)
    signal?.removeEventListener('abort', abortFromCaller)
  }

  const payload = await readJson(response)

  if (!response.ok) {
    const details = extractServerMessages(payload)
    throw new ApiError('http', details[0] ?? `Request failed with status ${response.status}.`, {
      status: response.status,
      details,
    })
  }

  return payload
}

/**
 * Converts any thrown value into a message that is safe to show to users.
 * `statusMessages` lets each screen phrase expected statuses (409, 401, ...).
 */
export function describeApiError(
  error: unknown,
  statusMessages: Partial<Record<number, string>> = {},
): string {
  if (!(error instanceof ApiError)) {
    return 'An unexpected error occurred. Please try again.'
  }
  if (error.kind !== 'http' || error.status === null) {
    return error.message
  }

  const custom = statusMessages[error.status]
  if (custom) return custom

  if (error.status === 400 && error.details.length > 0) {
    return `Please check your details: ${error.details.join('; ')}.`
  }
  if (error.status === 429) {
    return 'Too many attempts. Please wait a moment and try again.'
  }
  if (error.status >= 500) {
    return 'Something went wrong on our side. Please try again later.'
  }
  return 'The request could not be completed. Please try again.'
}
