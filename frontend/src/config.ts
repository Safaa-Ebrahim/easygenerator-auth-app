const DEFAULT_DEV_API_BASE_URL = 'http://localhost:3000'

function resolveApiBaseUrl(): string {
  const configured = import.meta.env.VITE_API_BASE_URL?.trim()
  if (configured) {
    return configured.replace(/\/+$/, '')
  }
  // Development falls back to the backend's default local port. A production
  // build without the variable calls the API on the same origin (for example
  // when both are served behind one reverse proxy).
  return import.meta.env.DEV ? DEFAULT_DEV_API_BASE_URL : ''
}

export const API_BASE_URL = resolveApiBaseUrl()
