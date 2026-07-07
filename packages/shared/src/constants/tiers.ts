/**
 * Tier limits and feature access matrix for the trial-first model.
 * Every new user gets a 21-day PRO trial. FREE tier is for lockout (expired/no subscription).
 */

import type { UserTier } from '../types/user.js'

/** Trial configuration */
export const TRIAL_DURATION_DAYS = 21
export const TRIAL_PLAN = 'TRIAL' as const

/** Maximum saved plates per tier (FREE = 0, locked out) */
export const PLATE_LIMITS: Record<UserTier, number> = {
  FREE: 0,
  PRO: Infinity,
}

/** Maximum saved snacks per tier (FREE = 0, locked out) */
export const SNACK_LIMITS: Record<UserTier, number> = {
  FREE: 0,
  PRO: Infinity,
}

/** Maximum baby profiles per tier (FREE = 0, locked out) */
export const BABY_PROFILE_LIMITS: Record<UserTier, number> = {
  FREE: 0,
  PRO: 3,
}

/** Bitácora history window in days (FREE = 0, locked out; Infinity = no limit) */
export const DIARY_WINDOW_DAYS: Record<UserTier, number> = {
  FREE: 0,
  PRO: Infinity,
}

/** Features requiring at least a certain tier */
export const FEATURE_TIERS = {
  savePlates: 'FREE' as UserTier,
  babyProfile: 'FREE' as UserTier,
  bitacora: 'FREE' as UserTier,
  exportPdf: 'FREE' as UserTier,
  exportPngClean: 'PRO' as UserTier,
  exportPdfClean: 'PRO' as UserTier,
  weeklyMenu: 'PRO' as UserTier,
  allergenTracker: 'PRO' as UserTier,
  fullBitacora: 'PRO' as UserTier,
  bitacoraReactions: 'PRO' as UserTier,
  bitacoraPdf: 'PRO' as UserTier,
  menuSharing: 'PRO' as UserTier,
  multipleBabyProfiles: 'PRO' as UserTier,
} as const

/** Pricing in MXN cents (Stripe uses smallest currency unit) */
export const PRICING = {
  monthly: {
    amountMxn: 99_00, // $99 MXN
    stripePriceKey: 'price_monthly',
  },
  yearly: {
    amountMxn: 999_00, // $999 MXN
    stripePriceKey: 'price_yearly',
    savingsPercent: 17, // "Ahorra 17%"
  },
}

/** Tier ordering for comparisons */
const TIER_ORDER: Record<UserTier, number> = {
  FREE: 1,
  PRO: 2,
}

/** Returns true if `userTier` satisfies the `requiredTier` */
export function tierAtLeast(userTier: UserTier, requiredTier: UserTier): boolean {
  return TIER_ORDER[userTier] >= TIER_ORDER[requiredTier]
}
