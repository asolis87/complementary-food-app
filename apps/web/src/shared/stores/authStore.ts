/**
 * Auth Pinia store — manages user session and tier.
 * Design: AD5 — anonymous → free → Pro flow.
 *
 * Actions:
 *   checkSession()       — restore session on app mount
 *   signIn(email, pwd)   — email/password sign-in
 *   signUp(email, pwd, name) — register new account
 *   signOut()            — sign out
 *   signInAnonymous()    — create anonymous session (zero-friction)
 *   upgradeAnonymous(email, pwd, name) — convert anonymous → registered
 */

import type { AuthUser, UserTier } from '@cfa/shared'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { apiClient, ApiError } from '../api/client.js'

interface SessionResponse {
  user: (AuthUser & { isAnonymous?: boolean }) | null
  tier: UserTier
}

interface AuthResponse {
  user: AuthUser & { isAnonymous?: boolean }
  token?: string
}

export const useAuthStore = defineStore('auth', () => {
  // ─── State ────────────────────────────────────────────────────────────────
  const user = ref<(AuthUser & { isAnonymous?: boolean }) | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // ─── Getters ──────────────────────────────────────────────────────────────
  const isAuthenticated = computed(() => user.value !== null)
  const tier = computed((): UserTier => user.value?.tier ?? 'ANONYMOUS')
  const isAnonymous = computed(() => user.value?.isAnonymous === true)
  const isPro = computed(() => tier.value === 'PRO')
  const isFree = computed(() => tier.value === 'FREE')
  const displayName = computed(() => user.value?.name ?? user.value?.email ?? 'Invitado')

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
        : 'No se pudo iniciar sesión. Revisá tus datos.'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Register a new account.
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
    } catch (err) {
      error.value = err instanceof ApiError
        ? err.message
        : 'No se pudo crear la cuenta. Intentá de nuevo.'
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
   * Create an anonymous session (zero-friction, no account needed).
   * BetterAuth anonymous plugin creates a real session with isAnonymous=true.
   */
  async function signInAnonymous(): Promise<void> {
    loading.value = true
    error.value = null
    try {
      await apiClient.post('/auth/anonymous', {})
      await checkSession()
    } catch (err) {
      error.value = err instanceof ApiError
        ? err.message
        : 'No se pudo crear la sesión anónima.'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Convert an anonymous session to a full registered account.
   * BetterAuth merges the anonymous data automatically.
   */
  async function upgradeAnonymous(email: string, password: string, name: string): Promise<void> {
    loading.value = true
    error.value = null
    try {
      await apiClient.post('/auth/sign-up/email', {
        email,
        password,
        name,
      })
      await checkSession()
    } catch (err) {
      error.value = err instanceof ApiError
        ? err.message
        : 'No se pudo crear la cuenta.'
      throw err
    } finally {
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
    // Getters
    isAuthenticated,
    tier,
    isAnonymous,
    isPro,
    isFree,
    displayName,
    // Actions
    checkSession,
    signIn,
    signUp,
    signOut,
    signInAnonymous,
    upgradeAnonymous,
    clearError,
    // Aliases for backward compat with existing callers
    fetchSession: checkSession,
    login: signIn,
    register: signUp,
    logout: signOut,
  }
})
