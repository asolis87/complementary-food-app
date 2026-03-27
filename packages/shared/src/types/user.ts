/**
 * User-related types: tiers, profiles, auth.
 */

/** User subscription tier */
export type UserTier = 'ANONYMOUS' | 'FREE' | 'PRO'

/** Baby profile */
export interface BabyProfile {
  id: string
  userId: string
  name: string
  birthDate: string // ISO date string
  acStartDate?: string // Alimentación complementaria start date
  notes?: string
  createdAt: string
  updatedAt: string
  deletedAt?: string
}

/** User with tier info (for auth composable) */
export interface AuthUser {
  id: string
  email?: string
  name?: string
  tier: UserTier
  createdAt: string
}

/** Reaction types for food log entries */
export type Reaction =
  | 'LIKED'
  | 'REJECTED'
  | 'RASH'
  | 'GAS'
  | 'DIARRHEA'
  | 'CONSTIPATION'
  | 'VOMITING'

/** Human-readable Spanish labels for reactions */
export const REACTION_LABELS: Record<Reaction, string> = {
  LIKED: 'Le gustó',
  REJECTED: 'Rechazado',
  RASH: 'Sarpullido',
  GAS: 'Gases',
  DIARRHEA: 'Diarrea',
  CONSTIPATION: 'Estreñimiento',
  VOMITING: 'Vómito',
}
