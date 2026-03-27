/**
 * API client — thin fetch wrapper for the CFA API.
 * Handles base URL, JSON parsing, error normalization, and offline detection.
 * Design: AD7 — throws OfflineError when navigator.onLine is false so stores
 * can fall back to IndexedDB / sync queue transparently.
 */

const BASE_URL = '/api' // Proxied by Vite in dev, real domain in prod

class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    // Fail fast when the browser knows we are offline — saves a failed fetch attempt
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      throw new OfflineError()
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Send cookies (BetterAuth session)
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: 'Error desconocido' } }))
      const message = (error as { error?: { message?: string } }).error?.message ?? `HTTP ${response.status}`
      throw new ApiError(message, response.status, error)
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return undefined as T
    }

    return response.json() as Promise<T>
  }

  get<T>(path: string): Promise<T> {
    return this.request<T>('GET', path)
  }

  post<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>('POST', path, body)
  }

  put<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>('PUT', path, body)
  }

  patch<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>('PATCH', path, body)
  }

  delete<T>(path: string): Promise<T> {
    return this.request<T>('DELETE', path)
  }
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly data: unknown,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/**
 * Thrown when a request is attempted while `navigator.onLine` is false.
 * Stores/components catch this and fall back to cached / queued data.
 */
export class OfflineError extends Error {
  constructor() {
    super('Sin conexión — no hay internet disponible')
    this.name = 'OfflineError'
  }
}

export const apiClient = new ApiClient(BASE_URL)
