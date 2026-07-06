<template>
  <section
    class="dashboard-card stage-tip-card"
    role="region"
    :aria-label="`Tip de la etapa: ${stageLabel}`"
  >
    <!-- Card header -->
    <div class="card-header">
      <h2 class="card-title stage-label">Tip para {{ stageLabel }}</h2>
      <button
        class="reshuffle-btn"
        type="button"
        :aria-label="'Cambiar tip'"
        title="Cambiar tip"
        @click="handleReshuffle"
      >
        <span class="material-symbols-outlined" aria-hidden="true">refresh</span>
      </button>
    </div>

    <!-- Tip text -->
    <div class="tip-content">
      <span class="tip-icon" aria-hidden="true">💡</span>
      <p class="tip-text">{{ tip }}</p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useStageTip } from '@/shared/composables/useDashboardTips.js'
import type { AgeStage } from '@pakulab/shared'

const props = defineProps<{
  babyAgeMonths: number
}>()

// Display-only stage labels (es-MX). The age→stage mapping itself lives in
// useStageTip (single source of truth); this map only turns that stage into copy.
const AGE_STAGE_LABELS: Record<AgeStage, string> = {
  SIX_TO_NINE_MONTHS: '6-9 meses',
  TEN_TO_TWELVE_MONTHS: '10-12 meses',
  THIRTEEN_TO_SEVENTEEN_MONTHS: '13-17 meses',
  EIGHTEEN_TO_TWENTY_THREE_MONTHS: '18-23 meses',
}

const { tip, reshuffle, stage } = useStageTip(props.babyAgeMonths)
const stageLabel = computed(() => AGE_STAGE_LABELS[stage])

function handleReshuffle() {
  reshuffle()
}
</script>

<style scoped>
/* ═══════════════════════════════════════════════════════════════════════
   StageTipCard — CRITICAL-2 (REQ-D2)
   Age-aware tip card mirroring BalanceInsightCard structure
   ═══════════════════════════════════════════════════════════════════════ */

.stage-tip-card {
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-3);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--md3-space-2);
}

.card-title {
  margin: 0;
  font-family: var(--md3-font-headline);
  font-size: var(--md3-headline-sm);
  font-weight: var(--md3-weight-bold);
  color: var(--md3-on-surface);
}

.reshuffle-btn {
  all: unset;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: var(--md3-rounded-full);
  background: var(--md3-surface-container-high);
  color: var(--md3-primary);
  cursor: pointer;
  transition: all var(--md3-transition-normal);
}

.reshuffle-btn:hover {
  background: var(--md3-primary-container);
  transform: rotate(90deg);
}

.reshuffle-btn:active {
  transform: scale(0.95) rotate(90deg);
}

.reshuffle-btn .material-symbols-outlined {
  font-size: 1.25rem;
}

.tip-content {
  display: flex;
  align-items: flex-start;
  gap: var(--md3-space-3);
}

.tip-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.tip-text {
  margin: 0;
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-md);
  line-height: 1.5;
  color: var(--md3-on-surface);
}
</style>
