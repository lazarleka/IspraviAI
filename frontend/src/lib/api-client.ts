// The only way the app talks to the FastAPI backend. Vite proxies /api to :8000 in development.
// Error shape and pagination follow docs/entities.md ("Conventions").
import { clearToken, getToken } from '@/lib/auth-token'

export type Page<T> = {
  total: number
  items: T[]
  pages: number
}

export type FieldErrors = Record<string, string>

export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly fieldErrors: FieldErrors

  constructor(status: number, message: string, code: string, fieldErrors: FieldErrors = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.fieldErrors = fieldErrors
  }
}

type ApiFetchOptions = Omit<RequestInit, 'body'> & {
  json?: unknown
  body?: BodyInit
}

type ErrorBody = {
  detail?: unknown
  code?: unknown
  fieldErrors?: unknown
}

function isFieldErrors(value: unknown): value is FieldErrors {
  return (
    typeof value === 'object' && value !== null && Object.values(value).every((v) => typeof v === 'string')
  )
}

async function toApiError(response: Response): Promise<ApiError> {
  let body: ErrorBody = {}
  try {
    body = (await response.json()) as ErrorBody
  } catch {
    // Not JSON: the backend is down and the Vite proxy answered 502/504, or another non-API error.
    if (response.status >= 502 && response.status <= 504) {
      return new ApiError(
        response.status,
        'Server trenutno nije dostupan. Pokušaj malo kasnije.',
        'server_unavailable',
      )
    }
  }
  const message = typeof body.detail === 'string' ? body.detail : 'Nešto nije u redu. Pokušaj ponovo.'
  const code = typeof body.code === 'string' ? body.code : 'http_error'
  const fieldErrors = isFieldErrors(body.fieldErrors) ? body.fieldErrors : {}
  return new ApiError(response.status, message, code, fieldErrors)
}

export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { json, headers, ...rest } = options
  const token = getToken()

  const requestHeaders = new Headers(headers)
  if (json !== undefined) requestHeaders.set('Content-Type', 'application/json')
  if (token) requestHeaders.set('Authorization', `Bearer ${token}`)

  let response: Response
  try {
    response = await fetch(`/api${path}`, {
      ...rest,
      headers: requestHeaders,
      body: json === undefined ? rest.body : JSON.stringify(json),
    })
  } catch {
    throw new ApiError(0, 'Server nije dostupan. Provjeri internet vezu.', 'network_error')
  }

  if (!response.ok) {
    const error = await toApiError(response)
    // An expired or invalid token signs the user out; a wrong password on login does not (no token sent).
    if (response.status === 401 && token) clearToken()
    throw error
  }

  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}
