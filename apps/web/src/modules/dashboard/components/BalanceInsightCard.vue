<template>
  <section
    class="dashboard-card balance-card"
    :class="`balance-card--${insight.severity}`"
    role="region"
    :aria-label="`Balance de la semana: ${insight.labelEs}`"
    tabindex="0"
    @keydown.enter="$emit('viewWeeklyDetail')"
    @keydown.space.prevent="$emit('viewWeeklyDetail')"
    @click="$emit('viewWeeklyDetail')"
  >
    <!-- Loading skeleton -->
    <template v-if="loading">
      <div class="skeleton-line skeleton-line-short" />
      <div class="skeleton-line skeleton-line-medium" />
      <div class="skeleton-line skeleton-line-long" />
    </template>

    <template v-else>
      <!-- Left: Status indicator dot + Label -->
      <div class="balance-status">
        <span class="status-dot" :class="`status-dot--${insight.severity}`">●</span>
        <h2 class="balance-label">{{ insight.labelEs }}</h2>
      </div>

      <!-- Middle: Tip -->
      <div class="balance-tip-wrapper">
        <span class="tip-icon" aria-hidden="true">💡</span>
        <span class="balance-tip">{{ insight.tip }}</span>
      </div>

      <!-- Right: Text CTA -->
      <button
        class="balance-cta"
        tabindex="-1"
        aria-hidden="true"
        @click.stop="$emit('viewWeeklyDetail')"
      >
        Ver detalle semanal
        <span class="cta-arrow" aria-hidden="true">→</span>
      </button>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { BalanceInsight } from '@pakulab/shared'

const props = defineProps<{
  insight: BalanceInsight
  loading?: boolean
}>()

defineEmits<{
  viewWeeklyDetail: []
}>()

const severityIcon = computed(() => {
  switch (props.insight.severity) {
    case 'green': return '🌿'
    case 'yellow': return '🍊'
    case 'red': return '⚠️'
    default: return '📊'
  }
})
</script>

<style scoped>
/* ═══════════════════════════════════════════════════════════════════════
   BalanceInsightCard — Nurture & Growth redesign
   Severity-based color gradients (green/yellow/red), modern card layout,
   and improved visual hierarchy.
   ═══════════════════════════════════════════════════════════════════════ */

.balance-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--md3-space-4);
  padding: 12px var(--md3-space-5);
  cursor: pointer;
  transition: box-shadow var(--md3-transition-fast), transform var(--md3-transition-fast);
  text-align: left;
  border-radius: var(--md3-rounded-lg);
  border: 1px solid var(--md3-outline-variant);
  background: var(--md3-surface-container-lowest);
  width: 100%;
}

.balance-card:hover {
  box-shadow: var(--md3-shadow-card);
  transform: translateY(-1px);
}

.balance-card:active {
  transform: translateY(0);
}

.balance-card:focus-visible {
  outline: 2px solid var(--md3-primary);
  outline-offset: 2px;
}

/* ── Status dot and label ────────────────────────────────── */
.balance-status {
  display: flex;
  align-items: center;
  gap: var(--md3-space-2);
  flex-shrink: 0;
}

.status-dot {
  font-size: 14px;
  line-height: 1;
}

.status-dot--green {
  color: var(--md3-primary);
}

.status-dot--yellow {
  color: var(--md3-secondary);
}

.status-dot--red {
  color: var(--md3-error);
}

.balance-label {
  margin: 0;
  font-family: var(--md3-font-headline);
  font-size: var(--md3-body-md);
  font-weight: var(--md3-weight-bold);
  color: var(--md3-on-surface);
  line-height: 1.2;
}

/* ── Tip section ─────────────────────────────────────────── */
.balance-tip-wrapper {
  display: flex;
  align-items: center;
  gap: var(--md3-space-1);
  flex: 1;
  min-width: 0;
  justify-content: center;
}

.tip-icon {
  font-size: 14px;
}

.balance-tip {
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-md);
  color: var(--md3-on-surface-variant);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ── CTA Button ───────────────────────────────────────────── */
.balance-cta {
  display: inline-flex;
  align-items: center;
  gap: var(--md3-space-1);
  padding: 0;
  border: none;
  background: transparent;
  color: var(--md3-primary);
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-md);
  font-weight: var(--md3-weight-semibold);
  cursor: pointer;
  white-space: nowrap;
  transition: opacity var(--md3-transition-fast);
  flex-shrink: 0;
}

.balance-cta:hover {
  opacity: 0.8;
}

.cta-arrow {
  transition: transform var(--md3-transition-fast);
}

.balance-cta:hover .cta-arrow {
  transform: translateX(2px);
}

/* ── Loading skeleton ─────────────────────────────────────── */
.skeleton-line {
  height: 16px;
  border-radius: var(--md3-rounded-sm);
  background: linear-gradient(
    90deg,
    var(--md3-surface-container) 25%,
    var(--md3-surface-container-high) 50%,
    var(--md3-surface-container) 75%
  );
  background-size: 800px 100%;
  animation: shimmer 1.4s infinite linear;
}

.skeleton-line-short { width: 120px; }
.skeleton-line-medium { width: 200px; }
.skeleton-line-long { width: 280px; }

@keyframes shimmer {
  0% { background-position: -400px 0; }
  100% { background-position: 400px 0; }
}

/* ── Responsive ──────────────────────────────────────────── */
@media (max-width: 768px) {
  .balance-card {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--md3-space-3);
    padding: var(--md3-space-4);
  }

  .balance-tip-wrapper {
    justify-content: flex-start;
    width: 100%;
  }

  .balance-tip {
    white-space: normal;
    overflow: visible;
    text-overflow: clip;
  }

  .balance-cta {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>