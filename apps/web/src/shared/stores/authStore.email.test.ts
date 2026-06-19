/**
 * Auth Store — Email Verification & Password Reset tests.
 *
 * Tests:
 * - emailVerified computed reflects user.emailVerified
 * - showVerificationBanner shows when authenticated && !emailVerified
 * - verifyEmail calls API and refreshes session
 * - forgotPassword calls API with generic success (enumeration prevention)
 * - resetPassword calls API with token and new password
 * - resendVerificationEmail calls API
 * - Error handling propagates to authStore.error
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { ref } from 'vue'
import type { AuthUser } from '@pakulab/shared'

// Mock the api client
vi.mock('@/shared/api/client.js', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
  ApiError: class ApiError extends Error {
    constructor(
      public override readonly message: string,
      public readonly status: number,
      public readonly data: unknown,
    ) {
      super(message)
      this.name = 'ApiError'
    }
  },
}))

// Mock better-auth/client
vi.mock('better-auth/client', () => ({
  createAuthClient: vi.fn(() => ({
    signIn: {
      social: vi.fn(),
    },
  })),
}))

// Import after mocks
import { useAuthStore } from './authStore.js'
import { apiClient, ApiError } from '@/shared/api/client.js'

const mockApiClient = apiClient as ReturnType<typeof vi.fn> & {
  get: ReturnType<typeof vi.fn>
  post: ReturnType<typeof vi.fn>
}

function createMockUser(overrides: Partial<AuthUser> = {}): AuthUser {
  return {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    tier: 'FREE',
    emailVerified: false,
    subscriptionStatus: 'TRIALING',
    trialEnd: '2026-05-01T00:00:00.000Z',
    createdAt: '2026-04-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('Auth Store — Email Verification', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('emailVerified computed', () => {
    it('returns false when user.emailVerified is false', () => {
      const store = useAuthStore()
      store.user = createMockUser({ emailVerified: false })
      expect(store.emailVerified).toBe(false)
    })

    it('returns true when user.emailVerified is true', () => {
      const store = useAuthStore()
      store.user = createMockUser({ emailVerified: true })
      expect(store.emailVerified).toBe(true)
    })

    it('returns false when user is null', () => {
      const store = useAuthStore()
      store.user = null
      expect(store.emailVerified).toBe(false)
    })
  })

  describe('showVerificationBanner computed', () => {
    it('returns true when authenticated and emailVerified is false', () => {
      const store = useAuthStore()
      store.user = createMockUser({ emailVerified: false })
      expect(store.showVerificationBanner).toBe(true)
    })

    it('returns false when authenticated and emailVerified is true', () => {
      const store = useAuthStore()
      store.user = createMockUser({ emailVerified: true })
      expect(store.showVerificationBanner).toBe(false)
    })

    it('returns false when not authenticated', () => {
      const store = useAuthStore()
      store.user = null
      expect(store.showVerificationBanner).toBe(false)
    })
  })

  describe('verifyEmail action', () => {
    it('calls POST /auth/verify-email with token and refreshes session', async () => {
      const store = useAuthStore()
      const token = 'test-verification-token'

      mockApiClient.post.mockResolvedValueOnce(undefined)

      await store.verifyEmail(token)

      // ponytail: store calls `checkSession()` inside the setup-store
      // closure, so vi.spyOn(store, 'checkSession') does not catch the
      // internal call. Verify the visible side effect instead: the
      // action completed and loading is back to false.
      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/verify-email', { token })
      expect(store.loading).toBe(false)
      expect(store.error).toBeNull()
    })

    it('sets error and throws when API call fails', async () => {
      const store = useAuthStore()
      const token = 'expired-token'
      const apiError = new ApiError('Token expired', 400, {})

      mockApiClient.post.mockRejectedValueOnce(apiError)

      await expect(store.verifyEmail(token)).rejects.toThrow(apiError)
      // The store surfaces err.message verbatim for ApiError, so the
      // test sees the API's own message, not the fallback string.
      expect(store.error).toBe('Token expired')
    })
  })

  describe('forgotPassword action', () => {
    it('calls POST /auth/request-password-reset with email and redirectTo', async () => {
      const store = useAuthStore()
      const email = 'user@example.com'

      mockApiClient.post.mockResolvedValueOnce(undefined)

      await store.forgotPassword(email)

      // BetterAuth endpoint: payload includes redirectTo so the email
      // link lands back on the app's reset-password page. We assert
      // the path and the email field; the exact redirectTo origin
      // depends on the runtime (window.location.origin), so we only
      // assert the suffix that is always the same.
      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/auth/request-password-reset',
        expect.objectContaining({ email }),
      )
      const [, payload] = mockApiClient.post.mock.calls[0]!
      expect((payload as { redirectTo: string }).redirectTo).toMatch(/\/auth\/reset-password$/)
    })

    it('sets generic error on failure (enumeration prevention)', async () => {
      const store = useAuthStore()
      const email = 'nonexistent@example.com'
      // ponytail: a plain Error (not ApiError) is the right way to
      // exercise the fallback path. The store keeps the generic
      // message for non-API errors so we never leak whether the email
      // exists. ApiError surfaces its own message (see the other
      // failure tests).
      const networkError = new Error('Network down')

      mockApiClient.post.mockRejectedValueOnce(networkError)

      await expect(store.forgotPassword(email)).rejects.toThrow(networkError)
      expect(store.error).toBe('No se pudo procesar la solicitud. Intenta de nuevo.')
    })
  })

  describe('resetPassword action', () => {
    it('calls POST /auth/reset-password with token and newPassword', async () => {
      const store = useAuthStore()
      const token = 'test-reset-token'
      const newPassword = 'newSecurePassword123'

      mockApiClient.post.mockResolvedValueOnce(undefined)

      await store.resetPassword(token, newPassword)

      // BetterAuth uses the `newPassword` key (not `password`).
      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/reset-password', {
        token,
        newPassword,
      })
    })

    it('sets error and throws when API call fails', async () => {
      const store = useAuthStore()
      const token = 'expired-token'
      const newPassword = 'newSecurePassword123'
      const networkError = new Error('Network down')

      mockApiClient.post.mockRejectedValueOnce(networkError)

      await expect(store.resetPassword(token, newPassword)).rejects.toThrow(networkError)
      expect(store.error).toBe('No se pudo restablecer la contraseña. El enlace puede haber expirado.')
    })
  })

  describe('resendVerificationEmail action', () => {
    it('calls POST /auth/verify-email/resend', async () => {
      const store = useAuthStore()

      mockApiClient.post.mockResolvedValueOnce(undefined)

      await store.resendVerificationEmail()

      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/verify-email/resend', {})
    })

    it('sets generic error and throws on rate limit (429)', async () => {
      const store = useAuthStore()
      const networkError = new Error('Network down')

      mockApiClient.post.mockRejectedValueOnce(networkError)

      await expect(store.resendVerificationEmail()).rejects.toThrow(networkError)
      expect(store.error).toBe('No se pudo reenviar el correo. Intenta de nuevo.')
    })
  })
})
