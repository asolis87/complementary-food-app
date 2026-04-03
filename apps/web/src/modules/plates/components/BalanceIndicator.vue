<template>
  <div class="balance-indicator" role="region" aria-label="Indicador de equilibrio A/L">
    <!-- Title -->
    <h3 class="balance-title">
      <span class="material-symbols-outlined balance-title-icon" aria-hidden="true">balance</span>
      Balance Digestivo
    </h3>

    <!-- Scale indicator -->
    <div class="scale-wrapper">
      <!-- Gradient bar -->
      <div
        class="gradient-bar"
        role="meter"
        :aria-valuenow="balance ? Math.round(balance.score * 100) : 0"
        aria-valuemin="-100"
        aria-valuemax="100"
        :aria-label="`Balance del plato: ${balance?.labelEs ?? 'Sin datos'}`"
      >
        <!-- Needle -->
        <div
          class="needle"
          :style="{ left: needlePosition }"
          aria-hidden="true"
        >
          <div class="needle-bar" />
          <div class="needle-dot" />
        </div>
      </div>

      <!-- 3-column labels -->
      <div class="scale-labels" aria-hidden="true">
        <div class="scale-label scale-label--left">
          <p class="scale-label-name scale-label-name--secondary">Laxante</p>
          <p class="scale-label-example">Ciruelas, Pera</p>
        </div>
        <div class="scale-label scale-label--center">
          <p class="scale-label-name scale-label-name--primary">Equilibrado</p>
          <p class="scale-label-example">Mezcla Óptima</p>
        </div>
        <div class="scale-label scale-label--right">
          <p class="scale-label-name scale-label-name--tertiary">Astringente</p>
          <p class="scale-label-example">Arroz, Manzana</p>
        </div>
      </div>
    </div>

    <!-- ProTip card -->
    <div class="protip-card">
      <div class="protip-icon-wrap" aria-hidden="true">
        <span class="material-symbols-outlined protip-icon">tips_and_updates</span>
      </div>
      <div class="protip-content">
        <p class="protip-heading">Consejo Pro</p>
        <p class="protip-text">{{ proTip }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { BalanceResult } from '@pakulab/shared'

const props = defineProps<{
  balance: BalanceResult | null
}>()

/**
 * Convert score (-1 to +1) to a left % position for the needle.
 * Stitch layout: Laxante (left) → Equilibrado (center) → Astringente (right)
 * score -1.0 (laxative) → 0%
 * score  0.0 (balanced) → 50%
 * score +1.0 (astringent) → 100%
 */
const needlePosition = computed(() => {
  const score = props.balance?.score ?? 0
  const pct = (score + 1) * 50
  return `${Math.max(2, Math.min(98, pct))}%`
})

/** Reactive ProTip based on balance state */
const proTip = computed(() => {
  if (!props.balance || props.balance.label === 'balanced') {
    return 'Añadí grasas saludables como palta para ayudar a absorber las vitaminas.'
  }
  if (props.balance.label === 'astringent') {
    return 'El plato tiene tendencia astringente. Sumá frutas como ciruela o pera para equilibrar.'
  }
  // laxative
  return 'El plato tiene tendencia laxante. Sumá arroz, manzana o zanahoria para equilibrar.'
})
</script>

<style scoped>
/* ── Container ──────────────────────────────────────────────────────────────── */
.balance-indicator {
  background: var(--md3-surface-container-low);
  border-radius: var(--md3-rounded-lg);
  padding: var(--md3-space-6);
  font-family: var(--md3-font-body);
}

/* ── Title ──────────────────────────────────────────────────────────────────── */
.balance-title {
  display: flex;
  align-items: center;
  gap: var(--md3-space-2);
  font-family: var(--md3-font-headline);
  font-weight: var(--md3-weight-bold);
  font-size: var(--md3-headline-sm);
  color: var(--md3-on-surface);
  margin: 0 0 var(--md3-space-6) 0;
}

.balance-title-icon {
  color: var(--md3-primary);
  font-size: 1.5rem;
  font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
}

/* ── Scale wrapper ───────────────────────────────────────────────────────────── */
.scale-wrapper {
  padding-top: var(--md3-space-6);
  padding-bottom: var(--md3-space-3);
}

/* ── Gradient bar ────────────────────────────────────────────────────────────── */
.gradient-bar {
  height: 1rem;
  width: 100%;
  border-radius: var(--md3-rounded-full);
  /* secondary-container → primary-container → tertiary-container
     matching the 40%-opacity Stitch gradient using the container tones */
  background: linear-gradient(
    to right,
    var(--md3-secondary-container) 0%,
    var(--md3-primary-container) 50%,
    var(--md3-tertiary-container) 100%
  );
  position: relative;
}

/* ── Needle ──────────────────────────────────────────────────────────────────── */
.needle {
  position: absolute;
  top: -0.25rem;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: left 0.3s ease;
  z-index: 1;
}

.needle-bar {
  width: 0.25rem;
  height: 2rem;
  background: var(--md3-on-surface);
  border-radius: var(--md3-rounded-full);
  box-shadow: var(--md3-shadow-soft);
}

.needle-dot {
  width: 0.75rem;
  height: 0.75rem;
  background: var(--md3-on-surface);
  border-radius: 50%;
  margin-top: -0.25rem;
  box-shadow: var(--md3-shadow-soft);
}

/* ── 3-column labels ─────────────────────────────────────────────────────────── */
.scale-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 1.5rem;
}

.scale-label {
  text-align: center;
}

.scale-label--left {
  text-align: left;
}

.scale-label--right {
  text-align: right;
}

.scale-label-name {
  margin: 0;
  font-size: 0.625rem; /* 10px */
  font-weight: var(--md3-weight-bold);
  text-transform: uppercase;
  letter-spacing: var(--md3-label-tracking);
  font-family: var(--md3-font-label);
}

.scale-label-name--secondary {
  color: var(--md3-secondary);
}

.scale-label-name--primary {
  color: var(--md3-primary);
}

.scale-label-name--tertiary {
  color: var(--md3-tertiary);
}

.scale-label-example {
  margin: 0;
  font-size: var(--md3-label-md);
  color: var(--md3-on-surface-variant);
  font-family: var(--md3-font-body);
  margin-top: 0.125rem;
}

/* ── ProTip card ─────────────────────────────────────────────────────────────── */
.protip-card {
  margin-top: var(--md3-space-6);
  padding: var(--md3-space-3);
  background: var(--md3-surface-container-lowest);
  border-radius: var(--md3-rounded-md);
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.protip-icon-wrap {
  flex-shrink: 0;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  background: var(--md3-primary-container);
  display: flex;
  align-items: center;
  justify-content: center;
}

.protip-icon {
  color: var(--md3-primary);
  font-size: 1.25rem;
  font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24;
}

.protip-content {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.protip-heading {
  margin: 0;
  font-size: var(--md3-label-md);
  font-weight: var(--md3-weight-bold);
  color: var(--md3-on-surface);
  font-family: var(--md3-font-body);
}

.protip-text {
  margin: 0;
  font-size: var(--md3-label-md);
  color: var(--md3-on-surface-variant);
  font-family: var(--md3-font-body);
  line-height: var(--md3-body-line-height);
}
</style>
