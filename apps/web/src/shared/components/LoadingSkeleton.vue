<template>
  <div class="skeleton-wrapper" :aria-label="ariaLabel" aria-busy="true">
    <template v-if="shape === 'card'">
      <div v-for="n in rows" :key="n" class="skeleton-card">
        <div class="skeleton-line skeleton-line-short" />
        <div class="skeleton-line skeleton-line-long" />
        <div class="skeleton-line skeleton-line-medium" />
      </div>
    </template>

    <template v-else-if="shape === 'list'">
      <div v-for="n in rows" :key="n" class="skeleton-list-item">
        <div class="skeleton-circle" />
        <div class="skeleton-lines">
          <div class="skeleton-line skeleton-line-long" />
          <div class="skeleton-line skeleton-line-short" />
        </div>
      </div>
    </template>

    <template v-else>
      <!-- text shape: stacked lines -->
      <div v-for="n in rows" :key="n" class="skeleton-line" :class="lineClass(n)" />
    </template>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  rows?: number
  shape?: 'text' | 'card' | 'list'
  ariaLabel?: string
}>(), {
  rows: 3,
  shape: 'text',
  ariaLabel: 'Cargando...',
})

function lineClass(n: number): string {
  // Alternating widths for a more natural look
  const classes = ['skeleton-line-long', 'skeleton-line-medium', 'skeleton-line-short']
  return classes[(n - 1) % classes.length]
}
</script>

<style scoped>
@keyframes shimmer {
  0% { background-position: -400px 0; }
  100% { background-position: 400px 0; }
}

.skeleton-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

/* Base shimmer — uses MD3 surface tokens */
.skeleton-line,
.skeleton-circle,
.skeleton-card {
  background: linear-gradient(
    90deg,
    var(--md3-surface-container) 25%,
    var(--md3-surface-container-high) 50%,
    var(--md3-surface-container) 75%
  );
  background-size: 800px 100%;
  animation: shimmer 1.4s infinite linear;
  border-radius: var(--md3-rounded-sm);
}

/* Lines */
.skeleton-line {
  height: 14px;
}

.skeleton-line-long { width: 100%; }
.skeleton-line-medium { width: 75%; }
.skeleton-line-short { width: 50%; }

/* Card shape */
.skeleton-card {
  background: var(--md3-surface-container-low);
  border-radius: var(--md3-rounded-md);
  padding: var(--md3-space-3);
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-2);
  /* No border — surface hierarchy handles separation */
  animation: none;
}

.skeleton-card .skeleton-line {
  background: linear-gradient(
    90deg,
    var(--md3-surface-container) 25%,
    var(--md3-surface-container-high) 50%,
    var(--md3-surface-container) 75%
  );
  background-size: 800px 100%;
  animation: shimmer 1.4s infinite linear;
}

/* List shape */
.skeleton-list-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.skeleton-circle {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: 50%;
}

.skeleton-lines {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
</style>
