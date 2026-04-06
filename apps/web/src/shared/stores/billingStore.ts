/**
 * Billing Pinia store — manages subscription state and Stripe interactions.
 * Spec: REQ-PAY-01, REQ-PAY-02, Trial-First Model
 */

import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { apiClient, ApiError } from '../api/client.js'

// ─── Types ─────────────────────────────────────────────────────────────────

export type SubscriptionStatus =
  | 'ACTIVE'
  | 'TRIALING'
  | 'PAST_DUE'
  | 'CANCELED'
  | 'EXPIRED'

export interface Subscription {
  id: string
  status: SubscriptionStatus
  interval: 'MONTHLY' | 'YEARLY'
  stripePriceId: string | null
  stripeCustomerId: string | null
  currentPeriodEnd: string | null  // ISO date string from server
  trialEnd: string | null
  cancelAtPeriodEnd: boolean
  canceledAt: string | null
  createdAt: string
}

interface SubscriptionResponse {
  data: Subscription | null
}

interface CheckoutResponse {
  data: {
    url: string
    sessionId: string
  }
}

interface PortalResponse {
  data: {
    url: string
  }
}

interface StartTrialResponse {
  data: Subscription
}

// ─── Store ──────────────────────────────────────────────────────────────────

export const useBillingStore = defineStore('billing', () => {
  // ─── State ─────────────────────────────────────────────────────────────────
  const subscription = ref<Subscription | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // ─── Getters ───────────────────────────────────────────────────────────────
  
  /** True if user has an active trial subscription */
  const isTrialing = computed(() => 
    subscription.value?.status === 'TRIALING'
  )
  
  /** True if user's trial has expired */
  const isExpired = computed(() => 
    subscription.value?.status === 'EXPIRED'
  )

  // ─── Actions ───────────────────────────────────────────────────────────────

  /**
   * Fetch the current user's subscription from the API.
   */
  async function fetchSubscription(): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const response = await apiClient.get<SubscriptionResponse>('/billing/subscription')
      subscription.value = response.data
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        // Not logged in — no subscription
        subscription.value = null
      } else {
        error.value = 'No se pudo cargar tu suscripción.'
      }
    } finally {
      loading.value = false
    }
  }

  /**
   * Create a Stripe Checkout session and redirect the user to Stripe.
   * @param priceId — Stripe Price ID (monthly or yearly)
   */
  async function createCheckout(priceId: string): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const response = await apiClient.post<CheckoutResponse>('/billing/create-checkout', {
        priceId,
      })
      // Redirect to Stripe Checkout hosted page
      window.location.href = response.data.url
    } catch (err) {
      error.value = err instanceof ApiError
        ? err.message
        : 'No se pudo iniciar el proceso de pago. Intentá de nuevo.'
      loading.value = false
    }
    // Note: loading stays true during redirect — that's intentional UX
  }

  /**
   * Open Stripe Customer Portal so the user can manage their subscription.
   */
  async function openPortal(): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const response = await apiClient.post<PortalResponse>('/billing/create-portal', {})
      window.location.href = response.data.url
    } catch (err) {
      error.value = err instanceof ApiError
        ? err.message
        : 'No se pudo abrir el portal de facturación.'
      loading.value = false
    }
  }

  /**
   * Start a trial subscription (no Stripe).
   * Used for plan selection during onboarding.
   * @param plan — 'TRIAL' | 'PRO_MONTHLY' | 'PRO_YEARLY'
   */
  async function startTrial(plan: 'TRIAL' | 'PRO_MONTHLY' | 'PRO_YEARLY'): Promise<Subscription> {
    loading.value = true
    error.value = null
    try {
      const response = await apiClient.post<StartTrialResponse>('/billing/start-trial', { plan })
      subscription.value = response.data
      return response.data
    } catch (err) {
      error.value = err instanceof ApiError
        ? err.message
        : 'No se pudo iniciar la prueba. Intentá de nuevo.'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Delete the user's account and all associated data.
   * Calls DELETE /api/profiles/me which wipes everything via Prisma transaction.
   * After success, clear local store state. Caller handles redirect.
   */
  async function deleteAccount(): Promise<void> {
    loading.value = true
    error.value = null
    try {
      await apiClient.delete('/profiles/me')
      // Clear billing state
      subscription.value = null
    } catch (err) {
      error.value = err instanceof ApiError
        ? err.message
        : 'No se pudo eliminar la cuenta. Intentá de nuevo.'
      throw err
    } finally {
      loading.value = false
    }
  }

  /** Clear error state */
  function clearError(): void {
    error.value = null
  }

  return {
    // State
    subscription,
    loading,
    error,
    // Getters
    isTrialing,
    isExpired,
    // Actions
    fetchSubscription,
    createCheckout,
    openPortal,
    startTrial,
    deleteAccount,
    clearError,
  }
})
