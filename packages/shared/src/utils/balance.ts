/**
 * A/L Balance calculation — the core algorithm.
 *
 * Design Decision AD8: Pure function, deterministic scoring.
 * score = (astringent - laxative) / total
 * Range: -1.0 (all laxative) to +1.0 (all astringent), 0.0 = balanced.
 * Neutral foods do NOT affect the score.
 *
 * Spec: REQ-AL-01
 */

import type { BalanceLabel, BalanceResult } from '../types/balance.js'
import { BALANCE_THRESHOLD, IMBALANCE_THRESHOLD } from '../constants/balance.js'

type FoodWithClassification = {
  alClassification: 'ASTRINGENT' | 'LAXATIVE' | 'NEUTRAL'
}

// Legacy alias — keeps backward compatibility for internal consumers
type FoodWithEffect = {
  bowelEffect: 'ASTRINGENT' | 'LAXATIVE' | 'NEUTRAL'
}

type FoodInput = FoodWithClassification | FoodWithEffect

function getClassification(item: FoodInput): 'ASTRINGENT' | 'LAXATIVE' | 'NEUTRAL' {
  if ('alClassification' in item) return item.alClassification
  return item.bowelEffect
}

/**
 * Calculate the A/L balance score for a set of foods.
 *
 * @param items - Array of foods with their A/L classification (or legacy bowelEffect)
 * @returns BalanceResult with score, counts, and traffic-light label
 *
 * @example
 * // 2 astringent, 2 laxative, 1 neutral → score 0.0 (balanced)
 * calculateBalance([
 *   { alClassification: 'ASTRINGENT' },
 *   { alClassification: 'ASTRINGENT' },
 *   { alClassification: 'LAXATIVE' },
 *   { alClassification: 'LAXATIVE' },
 *   { alClassification: 'NEUTRAL' },
 * ])
 */
export function calculateBalance(items: FoodInput[]): BalanceResult {
  const astringent = items.filter((i) => getClassification(i) === 'ASTRINGENT').length
  const laxative = items.filter((i) => getClassification(i) === 'LAXATIVE').length
  const neutral = items.filter((i) => getClassification(i) === 'NEUTRAL').length
  const total = astringent + laxative + neutral

  if (total === 0) {
    return {
      score: 0,
      astringent: 0,
      laxative: 0,
      neutral: 0,
      total: 0,
      label: 'balanced',
      labelEs: 'Equilibrado',
    }
  }

  // Neutral foods don't affect the score — score is based only on A vs L
  const score = (astringent - laxative) / total

  const label = getBalanceLabel(score)
  const labelEs = getBalanceLabelEs(score)

  return { score, astringent, laxative, neutral, total, label, labelEs }
}

function getBalanceLabel(score: number): BalanceLabel {
  if (Math.abs(score) <= BALANCE_THRESHOLD) return 'balanced'
  return score > 0 ? 'astringent' : 'laxative'
}

function getBalanceLabelEs(score: number): string {
  if (Math.abs(score) <= BALANCE_THRESHOLD) return 'Equilibrado'
  if (Math.abs(score) <= IMBALANCE_THRESHOLD) {
    return score > 0 ? 'Más astringente' : 'Más laxante'
  }
  return score > 0 ? 'Muy astringente' : 'Muy laxante'
}

/**
 * Determine the traffic-light severity for display purposes.
 * green = balanced, yellow = leaning, red = heavily imbalanced
 */
export function getBalanceSeverity(score: number): 'green' | 'yellow' | 'red' {
  const abs = Math.abs(score)
  if (abs <= BALANCE_THRESHOLD) return 'green'
  if (abs <= IMBALANCE_THRESHOLD) return 'yellow'
  return 'red'
}
