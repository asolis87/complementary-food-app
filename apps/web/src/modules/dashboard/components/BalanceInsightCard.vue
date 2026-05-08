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
      <!-- Main label -->
      <div class="balance-main">
        <span class="balance-icon" aria-hidden="true">{{ severityIcon }}</span>
        <h2 class="balance-label">{{ insight.labelEs }}</h2>
      </div>

      <!-- Tip -->
      <p class="balance-tip" aria-label="Consejo del día">
        <span class="tip-icon" aria-hidden="true">💡</span>
        {{ insight.tip }}
      </p>

      <span class="balance-click-hint" aria-hidden="true">Ver detalle semanal →</span>
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
    case 'green': return '🟢'
    case 'yellow': return '🟠'
    case 'red': return '🔴'
    default: return '⚪'
  }
})
</script>

<style scoped>
.balance-card {
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-2);
  padding: var(--md3-space-4) var(--md3-space-6);
  cursor: pointer;
  transition: box-shadow var(--md3-transition-fast), background var(--md3-transition-fast);
  text-align: left;
}

.balance-card:hover {
  box-shadow: var(--md3-shadow-card);
}

.balance-card:focus-visible {
  outline: 2px solid var(--md3-primary);
  outline-offset: 2px;
}

/* ── Severity themes ──────────────────────────────────────── */
.balance-card--green {
  background: linear-gradient(135deg, var(--md3-primary-container), var(--md3-surface-container-low));
  border: 1px solid var(--md3-outline-variant);
}

.balance-card--yellow {
  background: linear-gradient(135deg, var(--md3-tertiary-container), var(--md3-surface-container-low));
  border: 1px solid var(--md3-outline-variant);
}

.balance-card--red {
  background: linear-gradient(135deg, var(--md3-error-container), var(--md3-surface-container-low));
  border: 1px solid var(--md3-error);
}

/* ── Main label ───────────────────────────────────────────── */
.balance-main {
  display: flex;
  align-items: center;
  gap: var(--md3-space-2);
}

.balance-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.balance-label {
  margin: 0;
  font-family: var(--md3-font-headline);
  font-size: var(--md3-headline-sm);
  font-weight: var(--md3-weight-bold);
  color: var(--md3-on-surface);
  line-height: var(--md3-headline-line-height);
}

/* ── Tip ──────────────────────────────────────────────────── */
.balance-tip {
  margin: 0;
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-md);
  color: var(--md3-on-surface-variant);
  line-height: var(--md3-body-line-height);
}

.tip-icon {
  margin-right: 0.25rem;
}

/* ── Click hint ───────────────────────────────────────────── */
.balance-click-hint {
  font-size: var(--md3-label-sm);
  color: var(--md3-primary);
  font-weight: var(--md3-weight-medium);
  align-self: flex-end;
  opacity: 0.7;
  transition: opacity var(--md3-transition-fast);
}

.balance-card:hover .balance-click-hint {
  opacity: 1;
}

/* ── Loading skeleton ─────────────────────────────────────── */
.skeleton-line {
  height: 14px;
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

.skeleton-line-short { width: 40%; }
.skeleton-line-medium { width: 65%; }
.skeleton-line-long { width: 85%; }

@keyframes shimmer {
  0% { background-position: -400px 0; }
  100% { background-position: 400px 0; }
}

/* ── Responsive ──────────────────────────────────────────────── */
@media (min-width: 768px) {
  .balance-card {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }

  .balance-main {
    flex-shrink: 0;
  }

  .balance-tip {
    flex: 1;
    text-align: center;
  }

  .balance-click-hint {
    flex-shrink: 0;
  }
}
</style>
