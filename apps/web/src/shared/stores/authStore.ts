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
   */
  async function signUp(email: string, password: string, name: string): Promise<void> {
    loading.value = true
    error.value = null
    try {
      await apiClient.post<AuthResponse>('/auth/sign-up/email', {
        email,
        password,
        name,
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

  /** Clear any auth error (call before showing form) */
  function clearError(): void {
    error.value = null
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
    // Actions
    checkSession,
    signIn,
    signUp,
    signOut,
    clearError,
    // Aliases for backward compat with existing callers
    fetchSession: checkSession,
    login: signIn,
    register: signUp,
    logout: signOut,
  }
})
