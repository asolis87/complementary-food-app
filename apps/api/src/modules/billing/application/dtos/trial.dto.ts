/**
 * Trial DTO — input boundary for the start-trial use case.
 */

export type TrialPlan = 'TRIAL' | 'PRO_MONTHLY' | 'PRO_YEARLY'

export interface StartTrialDto {
  userId: string
  plan: TrialPlan
}
