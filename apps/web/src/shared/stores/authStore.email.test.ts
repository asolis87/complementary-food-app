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
      const checkSessionSpy = vi.spyOn(store, 'checkSession').mockResolvedValue()

      mockApiClient.post.mockResolvedValueOnce(undefined)

      await store.verifyEmail(token)

      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/verify-email', { token })
      expect(checkSessionSpy).toHaveBeenCalled()
    })

    it('sets error and throws when API call fails', async () => {
      const store = useAuthStore()
      const token = 'expired-token'
      const apiError = new ApiError('Token expired', 400, {})

      mockApiClient.post.mockRejectedValueOnce(apiError)

      await expect(store.verifyEmail(token)).rejects.toThrow(apiError)
      expect(store.error).toBe('No se pudo verificar el correo. El enlace puede haber expirado.')
    })
  })

  describe('forgotPassword action', () => {
    it('calls POST /auth/forgot-password with email', async () => {
      const store = useAuthStore()
      const email = 'user@example.com'

      mockApiClient.post.mockResolvedValueOnce(undefined)

      await store.forgotPassword(email)

      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/forgot-password', { email })
    })

    it('sets generic error on failure (enumeration prevention)', async () => {
      const store = useAuthStore()
      const email = 'nonexistent@example.com'
      const apiError = new ApiError('Bad request', 400, {})

      mockApiClient.post.mockRejectedValueOnce(apiError)

      await expect(store.forgotPassword(email)).rejects.toThrow(apiError)
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

      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/reset-password', {
        token,
        password: newPassword,
      })
    })

    it('sets error and throws when API call fails', async () => {
      const store = useAuthStore()
      const token = 'expired-token'
      const newPassword = 'newSecurePassword123'
      const apiError = new ApiError('Token expired', 400, {})

      mockApiClient.post.mockRejectedValueOnce(apiError)

      await expect(store.resetPassword(token, newPassword)).rejects.toThrow(apiError)
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

    it('sets error and throws when rate limited (429)', async () => {
      const store = useAuthStore()
      const apiError = new ApiError('Too many requests', 429, {})

      mockApiClient.post.mockRejectedValueOnce(apiError)

      await expect(store.resendVerificationEmail()).rejects.toThrow(apiError)
      expect(store.error).toBe('No se pudo reenviar el correo. Intenta de nuevo.')
    })
  })
})
