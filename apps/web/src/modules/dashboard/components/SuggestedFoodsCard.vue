<template>
  <section
    class="dashboard-card suggested-card"
    role="region"
    aria-label="Alimentos sugeridos"
  >
    <!-- Card header -->
    <div class="card-header">
      <h2 class="card-title">Alimentos sugeridos</h2>
      <button
        class="card-link"
        @click="$emit('viewAll')"
        aria-label="Ver más opciones de alimentos"
      >
        Ver más opciones →
      </button>
    </div>

    <!-- Empty state -->
    <div v-if="!loading && suggestions.length === 0" class="empty-state">
      <span class="material-symbols-outlined empty-icon" aria-hidden="true">restaurant</span>
      <p class="empty-text">No hay sugerencias por ahora.</p>
    </div>

    <!-- Loading skeleton -->
    <div v-if="loading" class="loading-skeleton">
      <div v-for="n in 3" :key="n" class="skeleton-card">
        <div class="skeleton-icon" />
        <div class="skeleton-content">
          <div class="skeleton-line skeleton-line-short" />
          <div class="skeleton-line skeleton-line-medium" />
          <div class="skeleton-line skeleton-line-long" />
        </div>
      </div>
    </div>

    <!-- Suggestion cards -->
    <div v-if="!loading && suggestions.length > 0" class="suggestion-list">
      <button
        v-for="food in suggestions"
        :key="food.foodId"
        class="suggestion-item"
        :aria-label="`${food.name} — ${food.benefit}`"
        @click="$emit('viewFood', food.foodId)"
      >
        <!-- Food icon with status indicator -->
        <div class="suggestion-icon-wrapper">
          <FoodIcon
            :food="{ id: food.foodId, name: food.name, group: food.group, alClassification: 'NEUTRAL', alScore: 0, isAllergen: food.isAllergen, ageMonths: food.ageMonths, needsValidation: false, warningTags: [], createdAt: '', updatedAt: '' }"
            :size="28"
            weight="bold"
          />
        </div>

        <!-- Food content -->
        <div class="suggestion-content">
          <h3 class="suggestion-name">{{ food.name }}</h3>
          <p class="suggestion-benefit">{{ food.benefit }}</p>
          <div class="suggestion-footer">
            <span class="age-tag">{{ food.ageMonths }}+ meses</span>
            <span v-if="food.isAllergen" class="allergen-tag">
              ⚠️ Alérgeno
            </span>
          </div>
        </div>

        <!-- Top right status badge -->
        <span
          class="status-badge"
          :class="`status-badge--${food.status}`"
        >
          <span class="status-icon">{{ statusIcon(food.status) }}</span>
          {{ statusLabel(food.status) }}
        </span>
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { FoodGroup, SuggestedFood } from '@pakulab/shared'
import FoodIcon from '@/shared/components/FoodIcon.vue'

defineProps<{
  suggestions: SuggestedFood[]
  loading?: boolean
}>()

defineEmits<{
  viewFood: [foodId: string]
  viewAll: []
}>()

/** Human-readable status label */
function statusLabel(status: 'pending' | 'tried' | 'rejected'): string {
  switch (status) {
    case 'tried': return 'Probado'
    case 'rejected': return 'Rechazado'
    default: return 'Pendiente'
  }
}

/** Status icon */
function statusIcon(status: 'pending' | 'tried' | 'rejected'): string {
  switch (status) {
    case 'tried': return '✅'
    case 'rejected': return '❌'
    default: return '⏳'
  }
}
</script>

<style scoped>
/* ═══════════════════════════════════════════════════════════════════════
   SuggestedFoodsCard — Nurture & Growth redesign
   List-style cards with better hierarchy, status badges, and improved
   visual separation between items.
   ═══════════════════════════════════════════════════════════════════════ */

.suggested-card {
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

/* ── Suggestion list ─────────────────────────────────────── */
.suggestion-list {
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-3);
}

.suggestion-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--md3-space-3);
  padding: var(--md3-space-4);
  background: var(--md3-surface-container-lowest);
  border: 1px solid var(--md3-outline-variant);
  border-radius: var(--md3-rounded-xl);
  cursor: pointer;
  text-align: left;
  transition: background var(--md3-transition-fast), box-shadow var(--md3-transition-fast), transform var(--md3-transition-fast);
  font-family: inherit;
  color: var(--md3-on-surface);
  width: 100%;
}

.suggestion-item:hover {
  background: var(--md3-surface-container-low);
  box-shadow: var(--md3-shadow-card);
  transform: translateY(-1px);
}

.suggestion-item:active {
  transform: translateY(0);
}

.suggestion-item:focus-visible {
  outline: 2px solid var(--md3-primary);
  outline-offset: 2px;
}

/* ── Food icon ───────────────────────────────────────────── */
.suggestion-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  border-radius: var(--md3-rounded-lg);
  background: var(--md3-surface-container-low);
  flex-shrink: 0;
}

/* ── Food content ────────────────────────────────────────── */
.suggestion-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-1);
  min-width: 0;
  padding-right: 70px; /* Space for the top-right status badge */
}

.suggestion-name {
  margin: 0;
  font-family: var(--md3-font-headline);
  font-size: var(--md3-title-md);
  font-weight: var(--md3-weight-semibold);
  color: var(--md3-on-surface);
}

.suggestion-benefit {
  margin: 0;
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-sm);
  color: var(--md3-on-surface-variant);
  line-height: var(--md3-body-line-height);
}

.suggestion-footer {
  display: flex;
  align-items: center;
  gap: var(--md3-space-2);
  margin-top: var(--md3-space-1);
  flex-wrap: wrap;
}

.age-tag {
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-sm);
  padding: var(--md3-space-1) var(--md3-space-2);
  border-radius: var(--md3-rounded-full);
  background: var(--md3-secondary-fixed);
  color: var(--md3-on-secondary-fixed-variant);
  font-weight: var(--md3-weight-bold);
  white-space: nowrap;
}

.allergen-tag {
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-sm);
  padding: var(--md3-space-1) var(--md3-space-2);
  border-radius: var(--md3-rounded-full);
  background: var(--md3-error-container);
  color: var(--md3-error);
  font-weight: var(--md3-weight-bold);
  white-space: nowrap;
}

/* ── Status badges ───────────────────────────────────────── */
.status-badge {
  position: absolute;
  top: var(--md3-space-3);
  right: var(--md3-space-3);
  display: inline-flex;
  align-items: center;
  gap: var(--md3-space-1);
  font-family: var(--md3-font-label);
  font-size: 11px;
  padding: 3px 10px;
  border-radius: var(--md3-rounded-full);
  font-weight: var(--md3-weight-semibold);
  flex-shrink: 0;
}

.status-icon {
  font-size: 10px;
}

.status-badge--pending {
  background: var(--md3-surface-container);
  color: var(--md3-on-surface-variant);
}

.status-badge--tried {
  background: var(--md3-primary-container);
  color: var(--md3-primary);
}

.status-badge--rejected {
  background: var(--md3-error-container);
  color: var(--md3-error);
}

/* ── Empty state ─────────────────────────────────────────── */
.empty-state {
  text-align: center;
  padding: var(--md3-space-8) 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--md3-space-2);
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

.skeleton-card {
  display: flex;
  align-items: center;
  gap: var(--md3-space-3);
  padding: var(--md3-space-3);
  background: var(--md3-surface-container-low);
  border-radius: var(--md3-rounded-lg);
}

.skeleton-icon {
  width: 52px;
  height: 52px;
  border-radius: var(--md3-rounded-lg);
  background: var(--md3-surface-container-high);
  flex-shrink: 0;
}

.skeleton-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-2);
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
.skeleton-line-medium { width: 70%; }
.skeleton-line-long { width: 85%; }

@keyframes shimmer {
  0% { background-position: -400px 0; }
  100% { background-position: 400px 0; }
}
</style>