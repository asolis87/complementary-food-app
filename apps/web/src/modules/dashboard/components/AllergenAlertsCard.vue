<template>
  <section
    v-if="hasContent"
    class="dashboard-card allergen-card"
    role="region"
    aria-label="Alérgenos pendientes"
  >
    <h2 class="card-title">Alérgenos pendientes</h2>

    <!-- Tier gate — PRO only -->
    <TierGate required-tier="PRO" feature-name="Alertas de alérgenos">
      <!-- Loading -->
      <div v-if="loading" class="loading-skeleton">
        <div v-for="n in 3" :key="n" class="skeleton-line skeleton-line-long" />
      </div>

      <!-- Allergen list -->
      <ul v-if="!loading && allergens.length > 0" class="allergen-list" role="list">
        <li
          v-for="allergen in allergens"
          :key="allergen.allergenKey"
          class="allergen-item"
          :class="{ 'allergen-item--urgent': allergen.urgency === 'closing_window' }"
        >
          <div class="allergen-info">
            <span class="allergen-icon" aria-hidden="true">{{ allergen.icon }}</span>
            <div class="allergen-details">
              <span class="allergen-name">{{ allergen.nameEs }}</span>
              <span class="allergen-age">Desde {{ allergen.minAgeMonths }} meses</span>
            </div>
            <span
              v-if="allergen.urgency === 'closing_window'"
              class="urgency-badge"
              aria-label="Ventana cerrándose — prioridad alta"
            >
              ⚠️
            </span>
          </div>

          <button
            class="btn-guide"
            :aria-label="`Ver cómo introducir ${allergen.nameEs}`"
            @click="$emit('viewGuide', allergen.allergenKey)"
          >
            Ver cómo introducir →
          </button>
        </li>
      </ul>

      <!-- All caught up -->
      <div v-if="!loading && allergens.length === 0" class="caught-up">
        <p class="caught-up-text">
          ¡Sin alérgenos pendientes! Todos los alérgenos para esta edad ya fueron introducidos.
        </p>
      </div>
    </TierGate>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { AllergenAlert } from '@pakulab/shared'
import TierGate from '@/shared/components/TierGate.vue'

const props = defineProps<{
  allergens: AllergenAlert[]
  loading?: boolean
}>()

defineEmits<{
  viewGuide: [allergenKey: string]
}>()

/**
 * Show the card when there are allergens or when loading.
 * Hide completely when allergens array is confirmed empty and not loading.
 */
const hasContent = computed(() => props.loading || props.allergens.length > 0)
</script>

<style scoped>
.allergen-card {
  /* Card styling inherited */
}

.card-title {
  margin: 0 0 var(--md3-space-3);
  font-family: var(--md3-font-headline);
  font-size: var(--md3-title-sm);
  font-weight: var(--md3-weight-semibold);
  color: var(--md3-on-surface);
  line-height: var(--md3-title-line-height);
}

/* ── Allergen list ────────────────────────────────────────── */
.allergen-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-2);
}

.allergen-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--md3-space-2) var(--md3-space-3);
  background: var(--md3-surface-container-low);
  border-radius: var(--md3-rounded-md);
  border: 1px solid var(--md3-outline-variant);
}

.allergen-item--urgent {
  border-color: var(--md3-error);
  background: var(--md3-error-container);
}

.allergen-info {
  display: flex;
  align-items: center;
  gap: var(--md3-space-2);
}

.allergen-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.allergen-details {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.allergen-name {
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-md);
  font-weight: var(--md3-weight-medium);
  color: var(--md3-on-surface);
}

.allergen-age {
  font-size: var(--md3-body-sm);
  color: var(--md3-on-surface-variant);
}

.urgency-badge {
  font-size: 1.1rem;
  flex-shrink: 0;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* ── Guide button ─────────────────────────────────────────── */
.btn-guide {
  display: inline-flex;
  align-items: center;
  padding: 0.4rem 0.75rem;
  border: none;
  border-radius: var(--md3-rounded-full);
  background: var(--md3-primary);
  color: var(--md3-on-primary);
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-sm);
  font-weight: var(--md3-weight-semibold);
  cursor: pointer;
  transition: background var(--md3-transition-fast), opacity var(--md3-transition-fast);
  white-space: nowrap;
  flex-shrink: 0;
}

.btn-guide:hover {
  opacity: 0.9;
}

.btn-guide:focus-visible {
  outline: 2px solid var(--md3-primary);
  outline-offset: 2px;
}

/* ── Caught-up state ──────────────────────────────────────── */
.caught-up {
  text-align: center;
  padding: var(--md3-space-3) 0;
}

.caught-up-text {
  margin: 0;
  font-size: var(--md3-body-md);
  color: var(--md3-on-surface-variant);
}

/* ── Loading skeleton ─────────────────────────────────────── */
.loading-skeleton {
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

.skeleton-line-long { width: 100%; }

@keyframes shimmer {
  0% { background-position: -400px 0; }
  100% { background-position: 400px 0; }
}
</style>
