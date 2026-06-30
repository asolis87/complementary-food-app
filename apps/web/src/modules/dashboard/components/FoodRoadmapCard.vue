<template>
  <section
    class="dashboard-card roadmap-card"
    role="region"
    aria-label="Progreso de alimentos"
  >
    <!-- Card header -->
    <div class="card-header">
      <h2 class="card-title">Roadmap de alimentos</h2>
    </div>

    <!-- Loading skeleton -->
    <div v-if="loading" class="loading-skeleton">
      <div v-for="n in 5" :key="n" class="skeleton-group">
        <div class="skeleton-header">
          <div class="skeleton-icon" />
          <div class="skeleton-line skeleton-line-medium" />
        </div>
        <div class="skeleton-bar" />
      </div>
    </div>

    <!-- Empty state -->
    <div v-if="!loading && progress.length === 0" class="empty-state">
      <span class="material-symbols-outlined empty-icon" aria-hidden="true">track_changes</span>
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
          <!-- Row 1: Header details -->
          <div class="group-header-row">
            <div class="group-header-left">
              <div class="group-icon-wrapper">
                <FoodIcon
                  :food="{ id: group.group, name: group.labelEs, group: group.group as FoodGroup, alClassification: 'NEUTRAL', alScore: 0, isAllergen: false, ageMonths: 0, needsValidation: false, warningTags: [], createdAt: '', updatedAt: '' }"
                  :size="22"
                  weight="bold"
                />
              </div>
              <span class="group-label">{{ group.labelEs }}</span>
            </div>

            <div class="group-header-right">
              <span class="group-fraction">
                <strong>{{ group.triedCount }}</strong>/{{ group.totalCount }}
              </span>
              <!-- Expand icon -->
              <span class="expand-icon" aria-hidden="true">
                {{ isGroupExpanded(group.group) ? 'expand_less' : 'expand_more' }}
              </span>
            </div>
          </div>

          <!-- Row 2: Full width progress bar -->
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
        </button>

        <!-- Food chips (collapsible) -->
        <Transition name="expand">
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
              <FoodIcon
                :food="{ id: food.foodId, name: food.name, group: group.group as FoodGroup, alClassification: 'NEUTRAL', alScore: 0, isAllergen: false, ageMonths: 0, needsValidation: false, warningTags: [], createdAt: '', updatedAt: '' }"
                :size="14"
                weight="bold"
              />
              <span class="food-chip-name">{{ food.name }}</span>
              <span
                class="food-chip-status"
                :aria-label="chipStatusLabel(food.status)"
              >
                {{ chipStatusIcon(food.status) }}
              </span>
            </span>
          </div>
        </Transition>
      </div>

      <!-- View Detail button -->
      <div class="view-detail-container">
        <button
          class="btn-view-detail"
          @click="$emit('viewFullRoadmap')"
          aria-label="Ver detalle del roadmap de alimentos"
        >
          Ver Detalle
          <span class="material-symbols-outlined" aria-hidden="true">arrow_forward</span>
        </button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { FoodGroup, RoadmapProgress, RoadmapFood } from '@pakulab/shared'
import FoodIcon from '@/shared/components/FoodIcon.vue'

const props = defineProps<{
  progress: RoadmapProgress[]
  loading?: boolean
}>()

defineEmits<{
  viewFullRoadmap: []
}>()

// Track expanded groups (by group key) — starts EMPTY (collapsed by default)
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
/* ═══════════════════════════════════════════════════════════════════════
   FoodRoadmapCard — Nurture & Growth redesign
   Collapsed by default, improved progress bars with percentage,
   and modern food chip styling.
   ═══════════════════════════════════════════════════════════════════════ */

.roadmap-card {
  /* Card styling inherited */
}

.card-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: var(--md3-space-4);
}

.card-title {
  margin: 0;
  font-family: var(--md3-font-headline);
  font-size: var(--md3-title-lg);
  font-weight: var(--md3-weight-semibold);
  color: var(--md3-on-surface);
  line-height: var(--md3-title-line-height);
}

.card-link {
  background: none;
  border: none;
  color: var(--md3-primary);
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-md);
  font-weight: var(--md3-weight-semibold);
  cursor: pointer;
  padding: 0;
  transition: opacity var(--md3-transition-fast);
}

.card-link:hover {
  opacity: 0.7;
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
  gap: var(--md3-space-2);
}

/* ── Group header ─────────────────────────────────────────── */
.group-header {
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-3);
  padding: 0;
  background: transparent;
  border: none;
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
}

.group-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  gap: var(--md3-space-2);
}

.group-header-left {
  display: flex;
  align-items: center;
  gap: var(--md3-space-2);
}

.group-header-right {
  display: flex;
  align-items: center;
  gap: var(--md3-space-2);
}

/* ── Group icon ───────────────────────────────────────────── */
.group-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: auto;
  height: auto;
  background: transparent;
  flex-shrink: 0;
}

.group-label {
  font-family: var(--md3-font-headline);
  font-size: var(--md3-title-md);
  font-weight: var(--md3-weight-bold);
  color: var(--md3-on-surface);
}

.group-fraction {
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-md);
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

/* ── Expand icon ─────────────────────────────────────────── */
.expand-icon {
  font-family: 'Material Symbols Outlined';
  font-size: 1.25rem;
  color: var(--md3-on-surface-variant);
  flex-shrink: 0;
  transition: transform var(--md3-transition-fast);
}

/* ── Food chips ───────────────────────────────────────────── */
.food-chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--md3-space-2);
  padding: var(--md3-space-2) 0 var(--md3-space-3) 0;
  background: transparent;
  border: none;
  margin-top: 0;
}

.food-chip {
  display: inline-flex;
  align-items: center;
  gap: var(--md3-space-1);
  padding: var(--md3-space-1) var(--md3-space-2);
  border-radius: var(--md3-rounded-full);
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-sm);
  font-weight: var(--md3-weight-medium);
  transition: background var(--md3-transition-fast);
}

.food-chip--tried {
  background: var(--md3-primary-container);
  color: var(--md3-on-primary-container);
}

.food-chip--pending {
  background: var(--md3-surface-container-high);
  color: var(--md3-on-surface-variant);
  opacity: 0.7;
}

.food-chip--rejected {
  background: var(--md3-error-container);
  color: var(--md3-on-error-container);
}

.food-chip-name {
  font-weight: var(--md3-weight-medium);
}

.food-chip-status {
  font-size: 0.875rem;
  font-weight: var(--md3-weight-bold);
}

/* ── Transition animation ────────────────────────────────── */
.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* ── Empty state ─────────────────────────────────────────── */
.empty-state {
  text-align: center;
  padding: var(--md3-space-8) 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--md3-space-3);
}

.empty-icon {
  font-size: 2.5rem;
  color: var(--md3-outline-variant);
}

.empty-text {
  margin: 0;
  font-family: var(--md3-font-body);
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
  gap: var(--md3-space-2);
}

.skeleton-header {
  display: flex;
  align-items: center;
  gap: var(--md3-space-3);
  padding: var(--md3-space-3);
  background: var(--md3-surface-container-low);
  border-radius: var(--md3-rounded-lg);
}

.skeleton-icon {
  width: 40px;
  height: 40px;
  border-radius: var(--md3-rounded-md);
  background: var(--md3-surface-container-high);
  flex-shrink: 0;
}

.skeleton-bar {
  height: 8px;
  background: var(--md3-surface-container-high);
  border-radius: var(--md3-rounded-full);
}

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

.skeleton-line-medium { width: 50%; }

@keyframes shimmer {
  0% { background-position: -400px 0; }
  100% { background-position: 400px 0; }
}

/* ── Responsive ──────────────────────────────────────────── */
@media (max-width: 480px) {
  .group-info {
    width: 60px;
  }
  
  .group-label {
    font-size: var(--md3-body-md);
  }
  
  .progress-bar {
    min-width: 40px;
  }
}
/* ── View Detail Button ─────────────────────────────────── */
.view-detail-container {
  display: flex;
  justify-content: center;
  margin-top: var(--md3-space-5);
  width: 100%;
}

.btn-view-detail {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--md3-space-2);
  width: 100%;
  padding: 12px var(--md3-space-4);
  background-color: var(--md3-surface-container-high);
  color: var(--md3-on-surface-variant);
  border: 1px solid var(--md3-outline-variant);
  border-radius: var(--md3-rounded-lg);
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-lg);
  font-weight: var(--md3-weight-semibold);
  cursor: pointer;
  transition: all var(--md3-transition-fast);
}

.btn-view-detail:hover {
  background-color: var(--md3-primary-container);
  color: var(--md3-on-primary-container);
  border-color: var(--md3-primary-container);
}

.btn-view-detail:active {
  transform: scale(0.98);
}
</style>