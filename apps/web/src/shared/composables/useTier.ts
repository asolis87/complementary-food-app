/**
 * Tier composable — reactive tier checks for UI gating.
 * Design: AD11 — frontend counterpart to backend requireTier hook.
 */

import type { UserTier } from '@cfa/shared'
import { FEATURE_TIERS, tierAtLeast } from '@cfa/shared'
import { computed } from 'vue'
import { useAuthStore } from '@/shared/stores/authStore.js'

export function useTier() {
  const authStore = useAuthStore()

  const tier = computed((): UserTier => authStore.tier)
  const isAnonymous = computed(() => tier.value === 'ANONYMOUS')
  const isFree = computed(() => tier.value === 'FREE')
  const isPro = computed(() => tier.value === 'PRO')

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
    tier,
    isAnonymous,
    isFree,
    isPro,
    canAccess,
    atLeast,
  }
}
