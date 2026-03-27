/**
 * Tier limits and feature access matrix for the CFA freemium model.
 */

import type { UserTier } from '../types/user.js'

/** Maximum saved plates per tier */
export const PLATE_LIMITS: Record<UserTier, number> = {
  ANONYMOUS: 0, // cannot save (session-only)
  FREE: 5,
  PRO: Infinity,
}

/** Maximum baby profiles per tier */
export const BABY_PROFILE_LIMITS: Record<UserTier, number> = {
  ANONYMOUS: 0,
  FREE: 1,
  PRO: 3,
}

/** Bitácora history window in days (Infinity = no limit) */
export const DIARY_WINDOW_DAYS: Record<UserTier, number> = {
  ANONYMOUS: 0,
  FREE: 7,
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
    amountMxn: 799_00, // $799 MXN
    stripePriceKey: 'price_yearly',
    savingsPercent: 33, // "Ahorra 33%"
  },
}

/** Trial trigger thresholds (days of diary OR plates created) */
export const TRIAL_TRIGGER = {
  minPlates: 3,
  minDiaryDays: 3,
  trialDays: 7,
}

/** Tier ordering for comparisons */
const TIER_ORDER: Record<UserTier, number> = {
  ANONYMOUS: 0,
  FREE: 1,
  PRO: 2,
}

/** Returns true if `userTier` satisfies the `requiredTier` */
export function tierAtLeast(userTier: UserTier, requiredTier: UserTier): boolean {
  return TIER_ORDER[userTier] >= TIER_ORDER[requiredTier]
}
