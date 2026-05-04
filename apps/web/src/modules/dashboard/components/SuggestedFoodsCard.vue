<template>
  <section
    class="dashboard-card suggested-card"
    role="region"
    aria-label="Alimentos sugeridos"
  >
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
      <p class="empty-text">No hay sugerencias por ahora.</p>
    </div>

    <!-- Loading skeleton -->
    <div v-if="loading" class="loading-skeleton">
      <div v-for="n in 3" :key="n" class="skeleton-card">
        <div class="skeleton-line skeleton-line-short" />
        <div class="skeleton-line skeleton-line-medium" />
        <div class="skeleton-line skeleton-line-long" />
      </div>
    </div>

    <!-- Suggestion cards -->
    <div v-if="!loading && suggestions.length > 0" class="suggestion-grid">
      <button
        v-for="food in suggestions"
        :key="food.foodId"
        class="suggestion-item"
        :aria-label="`${food.name} — ${food.benefit}. Click para ver más.`"
        @click="$emit('viewFood', food.foodId)"
      >
        <div class="suggestion-top">
          <span class="suggestion-emoji" aria-hidden="true">
            {{ allergenEmoji(food.isAllergen) }}
          </span>
          <span
            class="status-badge"
            :class="`status-badge--${food.status}`"
          >
            {{ statusLabel(food.status) }}
          </span>
        </div>

        <h3 class="suggestion-name">{{ food.name }}</h3>
        <p class="suggestion-benefit">{{ food.benefit }}</p>

        <div class="suggestion-footer">
          <span class="age-tag">{{ food.ageMonths }}+ meses</span>
          <span
            v-if="food.isAllergen"
            class="allergen-tag"
            aria-label="Este alimento es un alérgeno"
          >⚠️ Alérgeno</span>
        </div>
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { SuggestedFood } from '@pakulab/shared'

defineProps<{
  suggestions: SuggestedFood[]
  loading?: boolean
}>()

defineEmits<{
  viewFood: [foodId: string]
  viewAll: []
}>()

/** Get a representative emoji for allergen vs regular food */
function allergenEmoji(isAllergen: boolean): string {
  if (isAllergen) return '🥜'
  return '🥗'
}

/** Human-readable status label */
function statusLabel(status: 'pending' | 'tried' | 'rejected'): string {
  switch (status) {
    case 'tried': return '✅ Probado'
    case 'rejected': return '❌ Rechazado'
    default: return '⏳ Pendiente'
  }
}
</script>

<style scoped>
.suggested-card {
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

/* ── Suggestion grid ─────────────────────────────────────── */
.suggestion-grid {
  display: flex;
  gap: var(--md3-space-3);
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
  padding-bottom: var(--md3-space-1);
  scrollbar-width: thin;
  scrollbar-color: var(--md3-outline-variant) transparent;
}

@media (min-width: 1024px) {
  .suggestion-grid {
    flex-direction: column;
    overflow-x: visible;
    scroll-snap-type: none;
  }
}

.suggestion-item {
  flex: 0 0 240px;
  scroll-snap-align: start;
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-2);
  padding: var(--md3-space-3);
  background: var(--md3-surface-container-low);
  border: 1px solid var(--md3-outline-variant);
  border-radius: var(--md3-rounded-md);
  cursor: pointer;
  text-align: left;
  transition: background var(--md3-transition-fast), box-shadow var(--md3-transition-fast);
  font-family: inherit;
  color: var(--md3-on-surface);
}

.suggestion-item:hover {
  background: var(--md3-surface-container);
  box-shadow: var(--md3-shadow-card);
}

.suggestion-item:focus-visible {
  outline: 2px solid var(--md3-primary);
  outline-offset: 2px;
}

@media (min-width: 1024px) {
  .suggestion-item {
    flex: none;
  }
}

.suggestion-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.suggestion-emoji {
  font-size: 1.5rem;
}

.suggestion-name {
  margin: 0;
  font-family: var(--md3-font-headline);
  font-size: var(--md3-title-sm);
  font-weight: var(--md3-weight-semibold);
}

.suggestion-benefit {
  margin: 0;
  font-size: var(--md3-body-sm);
  color: var(--md3-on-surface-variant);
  line-height: var(--md3-body-line-height);
}

.suggestion-footer {
  display: flex;
  gap: var(--md3-space-1);
  flex-wrap: wrap;
}

.age-tag {
  font-size: var(--md3-label-sm);
  padding: 0.1rem 0.5rem;
  border-radius: var(--md3-rounded-full);
  background: var(--md3-secondary-container);
  color: var(--md3-on-secondary-container);
  font-weight: var(--md3-weight-medium);
}

.allergen-tag {
  font-size: var(--md3-label-sm);
  padding: 0.1rem 0.5rem;
  border-radius: var(--md3-rounded-full);
  background: var(--md3-error-container);
  color: var(--md3-on-error-container);
  font-weight: var(--md3-weight-medium);
}

/* ── Status badges ───────────────────────────────────────── */
.status-badge {
  font-size: var(--md3-label-sm);
  padding: 0.1rem 0.5rem;
  border-radius: var(--md3-rounded-full);
  font-weight: var(--md3-weight-medium);
}

.status-badge--pending {
  background: var(--md3-surface-container-high);
  color: var(--md3-on-surface-variant);
}

.status-badge--tried {
  background: var(--md3-primary-container);
  color: var(--md3-on-primary-container);
}

.status-badge--rejected {
  background: var(--md3-error-container);
  color: var(--md3-on-error-container);
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
  gap: var(--md3-space-3);
}

.skeleton-card {
  flex: 1;
  background: var(--md3-surface-container-low);
  border-radius: var(--md3-rounded-md);
  padding: var(--md3-space-3);
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
.skeleton-line-medium { width: 65%; }
.skeleton-line-long { width: 90%; }

@keyframes shimmer {
  0% { background-position: -400px 0; }
  100% { background-position: 400px 0; }
}
</style>
