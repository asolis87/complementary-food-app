<template>
  <div class="balance-indicator" role="region" aria-label="Indicador de equilibrio A/L">
    <!-- Empty state -->
    <div v-if="!balance" class="balance-empty">
      <span class="balance-empty-icon">🍽️</span>
      <p class="balance-empty-text">Agregá alimentos para ver el equilibrio A/L</p>
    </div>

    <template v-else>
      <!-- Score label -->
      <div class="balance-header">
        <span class="balance-label" :class="labelClass">{{ balance.labelEs }}</span>
        <span class="balance-score">{{ scoreDisplay }}</span>
      </div>

      <!-- Gauge bar — meter role for a11y -->
      <div
        class="gauge"
        role="meter"
        :aria-valuenow="balance ? Math.round(balance.score * 100) : 0"
        aria-valuemin="-100"
        aria-valuemax="100"
        :aria-label="`Balance del plato: ${balance?.labelEs ?? 'Sin datos'}`"
      >
        <!-- Background zones -->
        <div class="gauge-zone zone-astringent" aria-hidden="true" />
        <div class="gauge-zone zone-balanced" aria-hidden="true" />
        <div class="gauge-zone zone-laxative" aria-hidden="true" />

        <!-- Needle / marker -->
        <div
          class="gauge-needle"
          :style="{ left: needlePosition }"
          aria-hidden="true"
        />
      </div>

      <!-- Zone labels -->
      <div class="gauge-labels" aria-hidden="true">
        <span class="label-astringent">Astringente</span>
        <span class="label-balanced">Equilibrado</span>
        <span class="label-laxative">Laxante</span>
      </div>

      <!-- Counts -->
      <div class="balance-counts" aria-label="Conteo por clasificación">
        <span class="count count-astringent" :title="`${balance.astringent} alimento(s) astringente(s)`">
          🔴 {{ balance.astringent }} ast.
        </span>
        <span class="count count-neutral" :title="`${balance.neutral} alimento(s) neutro(s)`">
          ⚪ {{ balance.neutral }} neut.
        </span>
        <span class="count count-laxative" :title="`${balance.laxative} alimento(s) laxante(s)`">
          🟢 {{ balance.laxative }} lax.
        </span>
      </div>
    </template>

    <!-- Medical disclaimer — REQUIRED on every A/L screen (REQ-AL-02) -->
    <p class="disclaimer" role="note">
      ⚕️ Esta información es orientativa. Consultá siempre con tu pediatra.
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { BalanceResult } from '@cfa/shared'
import { BALANCE_THRESHOLD, IMBALANCE_THRESHOLD } from '@cfa/shared'

const props = defineProps<{
  balance: BalanceResult | null
}>()

/** Convert score (-1 to +1) to a left % position for the needle */
const needlePosition = computed(() => {
  if (!props.balance) return '50%'
  // score: -1 (laxative, right) to +1 (astringent, left)
  // We want astringent on LEFT → needle at low % when score is high positive
  // Map: score +1 → 5%, score 0 → 50%, score -1 → 95%
  const pct = 50 - props.balance.score * 45
  return `${Math.max(2, Math.min(98, pct))}%`
})

const labelClass = computed(() => {
  if (!props.balance) return ''
  switch (props.balance.label) {
    case 'balanced':
      return 'label-green'
    case 'astringent':
      return 'label-red'
    case 'laxative':
      return 'label-orange'
    default:
      return ''
  }
})

const scoreDisplay = computed(() => {
  if (!props.balance) return ''
  const score = props.balance.score
  const abs = Math.abs(score)
  if (abs <= BALANCE_THRESHOLD) return '✓'
  if (abs <= IMBALANCE_THRESHOLD) return score > 0 ? '↑' : '↓'
  return score > 0 ? '↑↑' : '↓↓'
})
</script>

<style scoped>
.balance-indicator {
  background: white;
  border-radius: 1rem;
  padding: 1rem;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  border: 1px solid #f3f4f6;
}

.balance-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 0;
  color: #9ca3af;
}

.balance-empty-icon {
  font-size: 2rem;
}

.balance-empty-text {
  margin: 0;
  font-size: 0.85rem;
  text-align: center;
}

.balance-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}

.balance-label {
  font-weight: 700;
  font-size: 1.1rem;
}

.label-green {
  color: #10b981;
}

.label-red {
  color: #ef4444;
}

.label-orange {
  color: #f59e0b;
}

.balance-score {
  font-size: 1.25rem;
  color: #6b7280;
}

/* Gauge */
.gauge {
  position: relative;
  height: 16px;
  border-radius: 9999px;
  display: flex;
  overflow: visible;
  margin-bottom: 0.35rem;
}

.gauge-zone {
  flex: 1;
}

.zone-astringent {
  background: linear-gradient(to right, #ef4444, #fca5a5);
  border-radius: 9999px 0 0 9999px;
}

.zone-balanced {
  background: #10b981;
}

.zone-laxative {
  background: linear-gradient(to right, #fde68a, #f59e0b);
  border-radius: 0 9999px 9999px 0;
}

.gauge-needle {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 20px;
  height: 20px;
  background: white;
  border: 3px solid #374151;
  border-radius: 9999px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  transition: left 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  z-index: 1;
}

.gauge-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.65rem;
  color: #9ca3af;
  margin-bottom: 0.75rem;
}

.label-astringent {
  color: #ef4444;
}

.label-balanced {
  color: #10b981;
}

.label-laxative {
  color: #f59e0b;
}

.balance-counts {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 0.75rem;
  font-size: 0.75rem;
  color: #6b7280;
}

.count {
  font-variant-numeric: tabular-nums;
}

/* Disclaimer */
.disclaimer {
  margin: 0;
  font-size: 0.7rem;
  color: #9ca3af;
  text-align: center;
  border-top: 1px solid #f3f4f6;
  padding-top: 0.5rem;
}
</style>
