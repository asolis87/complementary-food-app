<template>
  <section
    v-if="hasContent"
    class="dashboard-card allergen-card"
    role="region"
    aria-label="Alérgenos pendientes"
  >
    <!-- Tier gate — PRO only -->
    <TierGate required-tier="PRO" feature-name="Alertas de alérgenos">
      <!-- Loading -->
      <div v-if="loading" class="loading-skeleton">
        <div v-for="n in 2" :key="n" class="skeleton-line" />
      </div>

      <!-- Allergen content -->
      <div v-if="!loading && allergens.length > 0" class="allergen-content">
        <div class="allergen-header">
          <span class="material-symbols-outlined allergen-icon" aria-hidden="true">health_and_safety</span>
          <div class="allergen-text">
            <h3 class="allergen-title">Próximos alérgenos</h3>
            <p class="allergen-description">Recomendados por edad:</p>
          </div>
        </div>

        <ul class="allergen-list" role="list">
          <li
            v-for="allergen in topAllergens"
            :key="allergen.allergenKey"
            class="allergen-item"
            role="listitem"
          >
            <span class="allergen-item-icon" aria-hidden="true">{{ allergen.icon }}</span>
            <span class="allergen-item-name">{{ allergen.nameEs }}</span>
            <span v-if="allergen.urgency === 'closing_window'" class="urgency-badge">
              Pronto
            </span>
          </li>
        </ul>
        
        <button
          class="btn-intro"
          @click="$emit('viewGuide', topAllergens[0]?.allergenKey ?? '')"
        >
          Ver cómo introducir →
        </button>
      </div>

      <!-- All caught up -->
      <div v-if="!loading && allergens.length === 0" class="caught-up">
        <span class="material-symbols-outlined caught-up-icon" aria-hidden="true">check_circle</span>
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
  babyAgeMonths?: number
}>()

defineEmits<{
  viewGuide: [allergenKey: string]
}>()

const hasContent = computed(() => props.loading || props.allergens.length > 0)

// Show top 3 allergens in the summary
const topAllergens = computed(() => props.allergens.slice(0, 3))

</script>

<style scoped>
/* ═══════════════════════════════════════════════════════════════════════
   AllergenAlertsCard — Nurture & Growth redesign
   Soft warning tint background with improved visual hierarchy and
   modern button styling.
   ═══════════════════════════════════════════════════════════════════════ */

.allergen-card {
  /* Inherit default styles from dashboard-card */
}

.allergen-content {
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-4);
}

.allergen-header {
  display: flex;
  gap: var(--md3-space-3);
  align-items: flex-start;
}

.allergen-icon {
  font-size: 1.75rem !important;
  color: var(--md3-primary);
  flex-shrink: 0;
  margin-top: -2px;
}

.allergen-text {
  flex: 1;
  min-width: 0;
}

.allergen-title {
  margin: 0 0 var(--md3-space-1) 0;
  font-family: var(--md3-font-headline);
  font-size: var(--md3-title-md);
  font-weight: var(--md3-weight-bold);
  color: var(--md3-on-surface);
  line-height: var(--md3-title-line-height);
}

.allergen-description {
  margin: 0;
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-md);
  color: var(--md3-on-surface-variant);
  line-height: var(--md3-body-line-height);
}

/* ── Allergen List ──────────────────────────────────────── */
.allergen-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-2);
}

.allergen-item {
  display: flex;
  align-items: center;
  gap: var(--md3-space-3);
  padding: 8px 12px;
  background: var(--md3-surface-container-low);
  border-radius: var(--md3-rounded-md);
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-md);
  color: var(--md3-on-surface);
}

.allergen-item-icon {
  font-size: 1.2rem;
  flex-shrink: 0;
}

.allergen-item-name {
  font-weight: var(--md3-weight-semibold);
  flex: 1;
}

.urgency-badge {
  font-family: var(--md3-font-label);
  font-size: 9px;
  font-weight: var(--md3-weight-bold);
  padding: 2px 8px;
  border-radius: 9999px;
  background: #fef3c7; /* Soft amber */
  color: #b45309; /* Warm brown/amber */
  text-transform: uppercase;
}

/* ── Intro button ───────────────────────────────────────── */
.btn-intro {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--md3-space-2);
  width: 100%;
  padding: var(--md3-space-3) var(--md3-space-4);
  border: 1px solid var(--md3-outline-variant);
  border-radius: var(--md3-rounded-lg);
  background: var(--md3-surface-container-lowest);
  color: var(--md3-primary);
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-md);
  font-weight: var(--md3-weight-bold);
  cursor: pointer;
  transition: background var(--md3-transition-fast), box-shadow var(--md3-transition-fast), transform var(--md3-transition-fast);
}

.btn-intro:hover {
  background: var(--md3-surface-container-low);
  box-shadow: var(--md3-shadow-card);
  transform: translateY(-1px);
}

.btn-intro:active {
  transform: translateY(0);
}

.btn-intro:focus-visible {
  outline: 2px solid var(--md3-primary);
  outline-offset: 2px;
}

/* ── Caught-up state ──────────────────────────────────────── */
.caught-up {
  text-align: center;
  padding: var(--md3-space-4) 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--md3-space-3);
}

.caught-up-icon {
  font-size: 2.5rem;
  color: var(--md3-primary);
}

.caught-up-text {
  margin: 0;
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-md);
  color: var(--md3-on-surface-variant);
  line-height: var(--md3-body-line-height);
}

/* ── Loading skeleton ─────────────────────────────────────── */
.loading-skeleton {
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-2);
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

@keyframes shimmer {
  0% { background-position: -400px 0; }
  100% { background-position: 400px 0; }
}
</style>