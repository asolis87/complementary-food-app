/**
 * Auth Pinia store — manages user session and tier.
 * Design: AD5 — FREE → PRO flow (anonymous removed).
 *
 * Actions:
 *   checkSession()       — restore session on app mount
 *   signIn(email, pwd)   — email/password sign-in
 *   signUp(email, pwd, name) — register new account
 *   signOut()            — sign out
 */

import type { AuthUser, SubscriptionStatus, UserTier } from '@pakulab/shared'
import { DISCLAIMER_CURRENT_VERSION } from '@pakulab/shared'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { apiClient, ApiError } from '../api/client.js'

interface SessionResponse {
  user: AuthUser | null
  tier: UserTier
}

interface AuthResponse {
  user: AuthUser
  token?: string
}

interface AcceptDisclaimerResponse {
  user: Pick<AuthUser, 'lastAcceptedDisclaimerVersion'>
}

export const useAuthStore = defineStore('auth', () => {
  // ─── State ────────────────────────────────────────────────────────────────
  const user = ref<AuthUser | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // ─── Getters ──────────────────────────────────────────────────────────────
  const isAuthenticated = computed(() => user.value !== null)
  const tier = computed((): UserTier => user.value?.tier ?? 'FREE')
  const isPro = computed(() => tier.value === 'PRO')
  const isFree = computed(() => tier.value === 'FREE')
  const displayName = computed(() => user.value?.name ?? user.value?.email ?? 'Usuario')

  // Email verification computed
  const emailVerified = computed(() => user.value?.emailVerified ?? false)

  // Trial-related computeds
  const subscriptionStatus = computed((): SubscriptionStatus | null =>
    user.value?.subscriptionStatus ?? null
  )
  
  const trialEnd = computed((): Date | null => {
    if (!user.value?.trialEnd) return null
    const date = new Date(user.value.trialEnd)
    return isNaN(date.getTime()) ? null : date
  })
  
  const isTrialing = computed(() => 
    subscriptionStatus.value === 'TRIALING'
  )
  
  const isTrialExpired = computed(() => {
    if (subscriptionStatus.value === 'EXPIRED') return true
    if (subscriptionStatus.value === 'TRIALING') {
      const end = trialEnd.value
      if (!end) return true // trialing without end date = expired
      return end.getTime() < Date.now()
    }
    return false
  })
  
  const isLockedOut = computed(() => 
    isTrialExpired.value && !isPro.value
  )

  const showVerificationBanner = computed(() =>
    isAuthenticated.value && !emailVerified.value
  )

  // ─── Disclaimer ───────────────────────────────────────────────────────────

  /** Current disclaimer version — re-exported for ergonomic access in components (REQ-DC-07) */
  const currentDisclaimerVersion = DISCLAIMER_CURRENT_VERSION

  /**
   * True iff the authenticated user has not yet accepted the current disclaimer version.
   * False when unauthenticated (modal is never shown to anon users — REQ-DC-07, AD-DC-05).
   */
  const mustShowDisclaimer = computed(() => {
    if (user.value === null) return false
    return user.value.lastAcceptedDisclaimerVersion !== DISCLAIMER_CURRENT_VERSION
  })
  
  const trialDaysLeft = computed((): number => {
    if (!isTrialing.value) return 0
    const end = trialEnd.value
    if (!end) return 0
    
    const now = Date.now()
    const endTime = end.getTime()
    
    if (endTime <= now) return 0
    
    const msPerDay = 24 * 60 * 60 * 1000
    return Math.ceil((endTime - now) / msPerDay)
  })

  // ─── Actions ──────────────────────────────────────────────────────────────

  /**
   * Called on app mount — restores an existing session from the server cookie.
   * If there's a valid session, populates `user`.
   */
  async function checkSession(): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const response = await apiClient.get<SessionResponse>('/auth/session-info')
      user.value = response.user ?? null
    } catch {
      user.value = null
    } finally {
      loading.value = false
    }
  }

  /**
   * Sign in with email + password.
   */
  async function signIn(email: string, password: string): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const response = await apiClient.post<AuthResponse>('/auth/sign-in/email', {
        email,
        password,
      })
      // After sign-in, fetch full session-info to get tier
      await checkSession()
      void response // satisfy no-unused-vars
    } catch (err) {
      error.value = err instanceof ApiError
        ? err.message
        : 'No se pudo iniciar sesión. Revisa tus datos.'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Register a new account.
   * AD3: Auto-provision 21-day trial after signup.
   * REQ-EV-01: Send verification email with callbackURL.
   */
  async function signUp(email: string, password: string, name: string): Promise<void> {
    loading.value = true
    error.value = null
    try {
      // Use BetterAuth client SDK for signup to handle email verification properly.
      // Same-origin: nginx proxies /api/* → api container. No CORS, no per-env config.
      const { createAuthClient } = await import('better-auth/client')
      const authClient = createAuthClient()

      const result = await authClient.signUp.email({
        email,
        password,
        name,
      })

      if (result.error) {
        throw new Error(result.error.message || 'No se pudo crear la cuenta')
      }

      // REQ-EV-01: Trigger verification email manually so the callbackURL
      // is respected at call-time (sendOnSignUp ignores it — see bug #692).
      await authClient.sendVerificationEmail({
        email,
        callbackURL: `${window.location.origin}/auth/verify-email`,
      })

      // After sign-up, fetch session to populate user
      await checkSession()

      // AD3: Auto-start trial subscription for new users
      // Import billingStore lazily to avoid circular dependency
      const { useBillingStore } = await import('@/shared/stores/billingStore.js')
      const billingStore = useBillingStore()
      try {
        await billingStore.startTrial('TRIAL')
        // Re-fetch session to get updated subscription status
        await checkSession()
      } catch {
        // Trial creation failed - user still has account, but no trial
        // They can retry from PlanSelectionPage or PricingPage
        console.error('Failed to auto-start trial after signup')
      }
    } catch (err) {
      error.value = err instanceof ApiError
        ? err.message
        : 'No se pudo crear la cuenta. Intenta de nuevo.'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Sign out. Clears local state and invalidates the server session.
   */
  async function signOut(): Promise<void> {
    loading.value = true
    error.value = null
    try {
      await apiClient.post('/auth/sign-out', {})
    } catch {
      // Silently ignore sign-out errors
    } finally {
      user.value = null
      loading.value = false
    }
  }

  /**
   * Redirect to Google OAuth via BetterAuth client SDK.
   * The SDK handles the POST, state cookie, and redirect correctly.
   */
  async function signInWithGoogle(): Promise<void> {
    const { createAuthClient } = await import('better-auth/client')
    const authClient = createAuthClient()

    await authClient.signIn.social({
      provider: 'google',
      callbackURL: '/dashboard',
      newUserCallbackURL: '/onboarding/plan',
    })
  }

  /**
   * Accept the current disclaimer version.
   * POSTs to /api/disclaimer/accept and updates user.lastAcceptedDisclaimerVersion
   * from the response. Throws on non-2xx — component handles toast/error UI (REQ-DC-09, AD-DC-05).
   */
  async function acceptDisclaimer(): Promise<void> {
    const response = await apiClient.post<AcceptDisclaimerResponse>('/disclaimer/accept', {
      version: DISCLAIMER_CURRENT_VERSION,
    })
    if (user.value !== null) {
      user.value = {
        ...user.value,
        lastAcceptedDisclaimerVersion: response.user.lastAcceptedDisclaimerVersion,
      }
    }
  }

  /** Clear any auth error (call before showing form) */
  function clearError(): void {
    error.value = null
  }

  /**
   * Verify email with a token from the verification link.
   * REQ-EV-01: Successful email verification.
   */
  async function verifyEmail(token: string): Promise<void> {
    loading.value = true
    error.value = null
    try {
      await apiClient.post('/auth/verify-email', { token })
      // Refresh session to get updated emailVerified state
      await checkSession()
    } catch (err) {
      error.value = err instanceof ApiError
        ? err.message
        : 'No se pudo verificar el correo. El enlace puede haber expirado.'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Request a password reset email.
   * REQ-FP-01: Returns generic success regardless of email existence (enumeration prevention).
   * BetterAuth endpoint: POST /api/auth/request-password-reset
   */
  async function forgotPassword(email: string): Promise<void> {
    loading.value = true
    error.value = null
    try {
      // BetterAuth endpoint for password reset
      // Use VITE_AUTH_REDIRECT_URL if set, otherwise fallback to current origin
      const authRedirectUrl = import.meta.env.VITE_AUTH_REDIRECT_URL 
        ?? `${window.location.origin}/auth`
      
      await apiClient.post('/auth/request-password-reset', {
        email,
        redirectTo: `${authRedirectUrl}/reset-password`,
      })
      // Always return success (enumeration prevention)
    } catch (err) {
      // Generic error — do not reveal whether email exists
      error.value = err instanceof ApiError
        ? err.message
        : 'No se pudo procesar la solicitud. Intenta de nuevo.'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Reset password with a token from the reset email.
   * REQ-FP-02: Successful password reset.
   * BetterAuth endpoint: POST /api/auth/reset-password
   */
  async function resetPassword(token: string, newPassword: string): Promise<void> {
    loading.value = true
    error.value = null
    try {
      // BetterAuth endpoint for password reset
      await apiClient.post('/auth/reset-password', {
        token,
        newPassword,
      })
    } catch (err) {
      error.value = err instanceof ApiError
        ? err.message
        : 'No se pudo restablecer la contraseña. El enlace puede haber expirado.'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Resend the verification email.
   * REQ-EV-02: Resend with 60-second cooldown enforced by backend rate limiting.
   */
  async function resendVerificationEmail(): Promise<void> {
    loading.value = true
    error.value = null
    try {
      await apiClient.post('/auth/verify-email/resend', {})
    } catch (err) {
      error.value = err instanceof ApiError
        ? err.message
        : 'No se pudo reenviar el correo. Intenta de nuevo.'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    // State
    user,
    loading,
    error,
    // Getters — legacy tier-based
    isAuthenticated,
    tier,
    isPro,
    isFree,
    displayName,
    // Getters — trial-aware
    subscriptionStatus,
    trialEnd,
    isTrialing,
    isTrialExpired,
    isLockedOut,
    trialDaysLeft,
    // Getters — email verification
    emailVerified,
    showVerificationBanner,
    // Getters — disclaimer
    mustShowDisclaimer,
    currentDisclaimerVersion,
    // Actions
    checkSession,
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
    acceptDisclaimer,
    clearError,
    verifyEmail,
    forgotPassword,
    resetPassword,
    resendVerificationEmail,
    // Aliases for backward compat with existing callers
    fetchSession: checkSession,
    login: signIn,
    register: signUp,
    logout: signOut,
  }
})
