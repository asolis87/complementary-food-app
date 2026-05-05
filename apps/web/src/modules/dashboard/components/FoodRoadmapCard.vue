<template>
  <section
    class="dashboard-card roadmap-card"
    role="region"
    aria-label="Progreso de alimentos"
  >
    <div class="card-header">
      <h2 class="card-title">Roadmap de alimentos</h2>
      <button
        class="card-link"
        aria-label="Ver roadmap completo"
        @click="$emit('viewFullRoadmap')"
      >
        Ver completo →
      </button>
    </div>

    <!-- Loading skeleton -->
    <div v-if="loading" class="loading-skeleton">
      <div v-for="n in 5" :key="n" class="skeleton-group">
        <div class="skeleton-line skeleton-line-short" />
        <div class="skeleton-line skeleton-line-long" />
      </div>
    </div>

    <!-- Empty state -->
    <div v-if="!loading && progress.length === 0" class="empty-state">
      <p class="empty-text">Sin datos de progreso aún.</p>
    </div>

    <!-- Progress groups -->
    <div v-if="!loading && progress.length > 0" class="progress-groups">
      <div
        v-for="group in progress"
        :key="group.group"
        class="progress-group"
      >
        <!-- Group header (clickable to expand/collapse) -->
        <button
          class="group-header"
          :aria-expanded="isGroupExpanded(group.group)"
          :aria-controls="`foods-${group.group}`"
          @click="toggleGroup(group.group)"
        >
          <span class="group-label">
            <span class="group-emoji" aria-hidden="true">{{ groupEmoji(group.group) }}</span>
            {{ group.labelEs }}
          </span>
          <span class="group-fraction">
            <strong>{{ group.triedCount }}</strong>/{{ group.totalCount }}
          </span>
          <span class="expand-icon" aria-hidden="true">
            {{ isGroupExpanded(group.group) ? 'expand_less' : 'expand_more' }}
          </span>
        </button>

        <!-- Progress bar -->
        <div
          class="progress-bar"
          role="progressbar"
          :aria-valuenow="group.percentage"
          aria-valuemin="0"
          aria-valuemax="100"
          :aria-label="`${group.labelEs}: ${group.percentage}% completado`"
        >
          <div
            class="progress-fill"
            :style="{ width: group.percentage + '%' }"
          />
        </div>

        <!-- Food chips (collapsible) -->
        <div
          v-show="isGroupExpanded(group.group)"
          :id="`foods-${group.group}`"
          class="food-chips"
          role="list"
          :aria-label="`Alimentos de ${group.labelEs}`"
        >
          <span
            v-for="food in group.foods"
            :key="food.foodId"
            class="food-chip"
            :class="`food-chip--${food.status}`"
            role="listitem"
          >
            <span class="food-chip-name">{{ food.name }}</span>
            <span
              class="food-chip-status"
              :aria-label="chipStatusLabel(food.status)"
            >
              {{ chipStatusIcon(food.status) }}
            </span>
          </span>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { FoodGroup, RoadmapProgress, RoadmapFood } from '@pakulab/shared'

const props = defineProps<{
  progress: RoadmapProgress[]
  loading?: boolean
}>()

defineEmits<{
  viewFullRoadmap: []
}>()

// Track expanded groups (by group key)
const expandedGroups = ref<Set<string>>(new Set())

/** Check if a group is expanded */
function isGroupExpanded(group: FoodGroup): boolean {
  return expandedGroups.value.has(group)
}

/** Toggle group expand/collapse */
function toggleGroup(group: FoodGroup): void {
  if (expandedGroups.value.has(group)) {
    expandedGroups.value.delete(group)
  } else {
    expandedGroups.value.add(group)
  }
}

/** Emoji per food group for display */
function groupEmoji(group: FoodGroup): string {
  switch (group) {
    case 'VEGETABLE': return '🥦'
    case 'FRUIT': return '🍎'
    case 'PROTEIN': return '🍗'
    case 'CEREAL_TUBER': return '🌾'
    case 'HEALTHY_FAT': return '🥑'
    default: return '🍽️'
  }
}

/** Status icon for each food chip */
function chipStatusIcon(status: RoadmapFood['status']): string {
  switch (status) {
    case 'tried': return '✅'
    case 'rejected': return '❌'
    default: return '⏳'
  }
}

function chipStatusLabel(status: RoadmapFood['status']): string {
  switch (status) {
    case 'tried': return 'Probado'
    case 'rejected': return 'Rechazado'
    default: return 'Pendiente'
  }
}
</script>

<style scoped>
.roadmap-card {
  /* Card styling inherited */
}

.card-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: var(--md3-space-3);
}

.card-title {
  margin: 0;
  font-family: var(--md3-font-headline);
  font-size: var(--md3-title-sm);
  font-weight: var(--md3-weight-semibold);
  color: var(--md3-on-surface);
  line-height: var(--md3-title-line-height);
}

.card-link {
  background: none;
  border: none;
  color: var(--md3-primary);
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-sm);
  font-weight: var(--md3-weight-semibold);
  cursor: pointer;
  padding: 0;
  transition: opacity var(--md3-transition-fast);
}

.card-link:hover {
  opacity: 0.8;
}

.card-link:focus-visible {
  outline: 2px solid var(--md3-primary);
  outline-offset: 2px;
  border-radius: var(--md3-rounded-sm);
}

/* ── Progress groups ──────────────────────────────────────── */
.progress-groups {
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-4);
}

.progress-group {
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-1);
}

/* ── Group header ─────────────────────────────────────────── */
.group-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: var(--md3-space-2);
  min-width: 0;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  width: 100%;
  text-align: left;
  font: inherit;
  color: inherit;
  transition: opacity var(--md3-transition-fast);
}

.group-header:hover {
  opacity: 0.8;
}

.group-header:focus-visible {
  outline: 2px solid var(--md3-primary);
  outline-offset: 2px;
  border-radius: var(--md3-rounded-sm);
}

.expand-icon {
  font-family: 'Material Symbols Outlined';
  font-size: 1.2rem;
  color: var(--md3-on-surface-variant);
  flex-shrink: 0;
  transition: transform var(--md3-transition-fast);
}

.group-label {
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-md);
  font-weight: var(--md3-weight-medium);
  color: var(--md3-on-surface);
  display: flex;
  align-items: center;
  gap: var(--md3-space-1);
  flex-shrink: 1; /* Allow label to shrink if needed */
  min-width: 0;
}

.group-emoji {
  font-size: 1.1rem;
}

.group-fraction {
  font-size: var(--md3-body-sm);
  color: var(--md3-on-surface-variant);
}

.group-fraction strong {
  color: var(--md3-primary);
  font-weight: var(--md3-weight-bold);
}

/* ── Progress bar ─────────────────────────────────────────── */
.progress-bar {
  width: 100%;
  height: 8px;
  background: var(--md3-surface-container-highest);
  border-radius: var(--md3-rounded-full);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--md3-primary);
  border-radius: var(--md3-rounded-full);
  transition: width 0.4s ease;
}

/* ── Food chips ───────────────────────────────────────────── */
.food-chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--md3-space-1);
  margin-top: var(--md3-space-2);
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.food-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.15rem 0.5rem;
  border-radius: var(--md3-rounded-full);
  font-size: var(--md3-label-sm);
  font-weight: var(--md3-weight-medium);
  transition: background var(--md3-transition-fast);
}

.food-chip--tried {
  background: var(--md3-primary-container);
  color: var(--md3-on-primary-container);
  font-weight: var(--md3-weight-semibold);
}

.food-chip--pending {
  background: var(--md3-surface-container-high);
  color: var(--md3-on-surface-variant);
  opacity: 0.6; /* Grayed out / muted appearance */
}

.food-chip--rejected {
  background: var(--md3-error-container);
  color: var(--md3-on-error-container);
}

.food-chip-name {
  font-family: var(--md3-font-label);
}

.food-chip-status {
  font-size: 0.75rem;
}

/* ── Empty state ─────────────────────────────────────────── */
.empty-state {
  text-align: center;
  padding: var(--md3-space-4) 0;
}

.empty-text {
  margin: 0;
  font-size: var(--md3-body-md);
  color: var(--md3-on-surface-variant);
}

/* ── Loading skeleton ─────────────────────────────────────── */
.loading-skeleton {
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-3);
}

.skeleton-group {
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-1);
}

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
.skeleton-line-long { width: 100%; }

@keyframes shimmer {
  0% { background-position: -400px 0; }
  100% { background-position: 400px 0; }
}
</style>
