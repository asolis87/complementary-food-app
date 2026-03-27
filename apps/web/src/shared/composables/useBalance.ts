/**
 * useBalance — reactive wrapper around the shared A/L balance utility.
 *
 * Accepts a reactive list of plate items and returns a reactive BalanceResult
 * that recomputes automatically whenever the items change.
 *
 * The calculation is done LOCALLY using the shared pure function, which means:
 *  - Instant feedback — no network latency
 *  - Works offline (no API call required)
 *
 * Design: AD8 — offline-first balance via pure shared function.
 */

import type { BalanceResult } from '@cfa/shared'
import { calculateBalance, getBalanceSeverity } from '@cfa/shared'
import type { Ref } from 'vue'
import { computed } from 'vue'
import type { PlateItemDraft } from '@/shared/stores/plateStore.js'

/**
 * @param items - Reactive ref containing the current list of plate draft items
 */
export function useBalance(items: Ref<PlateItemDraft[]>) {
  /**
   * The full balance result — score, counts, and traffic-light label.
   * Returns a zero-score "balanced" result when the plate is empty.
   */
  const balance = computed((): BalanceResult | null => {
    if (!items.value.length) return null
    return calculateBalance(
      items.value.map((item) => ({ alClassification: item.food.alClassification })),
    )
  })

  /** Traffic-light colour: 'green' | 'yellow' | 'red' — null when plate is empty */
  const severity = computed(() => {
    if (!balance.value) return null
    return getBalanceSeverity(balance.value.score)
  })

  /** Convenience booleans for conditional rendering */
  const isBalanced = computed(() => balance.value?.label === 'balanced')
  const isAstringent = computed(() => balance.value?.label === 'astringent')
  const isLaxative = computed(() => balance.value?.label === 'laxative')

  return {
    balance,
    severity,
    isBalanced,
    isAstringent,
    isLaxative,
  }
}
