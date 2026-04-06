/**
 * Tier composable — reactive tier checks for UI gating.
 * Design: AD11 — frontend counterpart to backend requireTier hook.
 * Updated: Trial-First Model — exposes trial-aware subscription state.
 */

import type { UserTier } from '@pakulab/shared'
import { FEATURE_TIERS, tierAtLeast } from '@pakulab/shared'
import { computed } from 'vue'
import { useAuthStore } from '@/shared/stores/authStore.js'

export function useTier() {
  const authStore = useAuthStore()

  // ─── Legacy tier-based checks ─────────────────────────────────────────────
  
  const tier = computed((): UserTier => authStore.tier)
  const isFree = computed(() => tier.value === 'FREE')
  const isPro = computed(() => tier.value === 'PRO')

  // ─── Trial-aware subscription state ────────────────────────────────────────
  
  const subscriptionStatus = computed(() => authStore.subscriptionStatus)
  const trialEnd = computed(() => authStore.trialEnd)
  const isTrialing = computed(() => authStore.isTrialing)
  const isTrialExpired = computed(() => authStore.isTrialExpired)
  const isLockedOut = computed(() => authStore.isLockedOut)
  const trialDaysLeft = computed(() => authStore.trialDaysLeft)

  // ─── Feature access checks ─────────────────────────────────────────────────

  /**
   * Check if the current user has access to a feature.
   * @param feature - Feature key from FEATURE_TIERS
   */
  function canAccess(feature: keyof typeof FEATURE_TIERS): boolean {
    const requiredTier = FEATURE_TIERS[feature]
    return tierAtLeast(tier.value, requiredTier)
  }

  /**
   * Check if user has at least the specified tier.
   */
  function atLeast(requiredTier: UserTier): boolean {
    return tierAtLeast(tier.value, requiredTier)
  }

  return {
    // Legacy tier-based
    tier,
    isFree,
    isPro,
    // Trial-aware state
    subscriptionStatus,
    trialEnd,
    isTrialing,
    isTrialExpired,
    isLockedOut,
    trialDaysLeft,
    // Feature access
    canAccess,
    atLeast,
  }
}
