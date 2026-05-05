<template>
  <section
    v-if="hasContent"
    class="allergen-card"
    role="region"
    aria-label="Alérgenos pendientes"
  >
    <!-- Tier gate — PRO only -->
    <TierGate required-tier="PRO" feature-name="Alertas de alérgenos">
      <!-- Loading -->
      <div v-if="loading" class="loading-skeleton">
        <div v-for="n in 2" :key="n" class="skeleton-line skeleton-line-long" />
      </div>

      <!-- Allergen content -->
      <div v-if="!loading && allergens.length > 0" class="allergen-content">
        <div class="allergen-header">
          <span class="material-symbols-outlined allergen-warning" aria-hidden="true">warning</span>
          <div class="allergen-text">
            <h3 class="allergen-title">Alérgenos Pendientes</h3>
            <p class="allergen-description">
              Por edad (<span class="font-bold">{{ babyAgeMonths }}+ meses</span>):
              <span class="allergen-list-inline">
                {{ allergenSummary }}
              </span>
            </p>
          </div>
        </div>
        
        <button
          class="btn-intro"
          @click="$emit('viewGuide', topAllergens[0]?.allergenKey ?? '')"
        >
          Ver cómo introducir →
        </button>
      </div>

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
  babyAgeMonths?: number
}>()

defineEmits<{
  viewGuide: [allergenKey: string]
}>()

const hasContent = computed(() => props.loading || props.allergens.length > 0)

// Show top 3 allergens in the summary
const topAllergens = computed(() => props.allergens.slice(0, 3))

// Create summary text: "🥜 Maní, 🐟 Pescado, 🥛 Lácteos"
const allergenSummary = computed(() => {
  return topAllergens.value.map(a => `${a.icon} ${a.nameEs}`).join(', ')
})
</script>

<style scoped>
/* ═══════════════════════════════════════════════════════════════════════
   AllergenAlertsCard — Compact card matching Stitch design.
   Single card with inline allergen list + one CTA button.
   ═══════════════════════════════════════════════════════════════════════ */

.allergen-card {
  background: var(--md3-error-container);
  background: color-mix(in srgb, var(--md3-error-container) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--md3-error-container) 30%, transparent);
  border-radius: 16px;
  padding: 3rem 2rem; /* 48px vertical, 32px horizontal - MUCH more breathing room */
}

.allergen-content {
  display: flex;
  flex-direction: column;
  gap: 2rem; /* 32px - Significant space between sections */
}

.allergen-header {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
}

.allergen-warning {
  font-size: 1.5rem;
  color: var(--md3-error);
  flex-shrink: 0;
  margin-top: 2px;
}

.allergen-text {
  flex: 1;
}

.allergen-title {
  margin: 0 0 1rem 0; /* 16px below title - more space */
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-lg);
  font-weight: var(--md3-weight-bold);
  color: var(--md3-error);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  line-height: 1.4;
}

.allergen-description {
  margin: 0 0 1.5rem 0; /* 24px below description - significant space */
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-md);
  color: var(--md3-on-surface-variant);
  line-height: 1.7; /* More line height for readability */
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.allergen-list-inline {
  font-weight: var(--md3-weight-semibold);
  color: var(--md3-on-surface);
  display: inline; /* Keep inline but allow wrapping */
}

.font-bold {
  font-weight: var(--md3-weight-semibold);
}

/* ── Intro button ───────────────────────────────────────── */
.btn-intro {
  width: 100%;
  padding: 1.25rem 2rem; /* 20px vertical, 32px horizontal - Much more breathing room */
  border: 1px solid color-mix(in srgb, var(--md3-primary) 20%, transparent);
  border-radius: 12px;
  background: white;
  color: var(--md3-primary);
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-lg);
  font-weight: var(--md3-weight-bold);
  cursor: pointer;
  transition: background var(--md3-transition-fast);
  margin-top: 1rem; /* 16px extra space above button */
}

.btn-intro:hover {
  background: color-mix(in srgb, var(--md3-primary-container) 5%, transparent);
}

.btn-intro:focus-visible {
  outline: 2px solid var(--md3-primary);
  outline-offset: 2px;
}

/* ── Caught-up state ──────────────────────────────────────── */
.caught-up {
  text-align: center;
  padding: var(--md3-space-2) 0;
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
