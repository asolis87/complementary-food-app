<template>
  <div class="food-detail-page">
    <!-- Loading -->
    <div v-if="loading" class="state-center" aria-live="polite">
      <div class="spinner" aria-hidden="true" />
      <p>Cargando alimento...</p>
    </div>

    <!-- Error / Not found -->
    <div v-else-if="!food" class="state-center error-state" role="alert">
      <span class="material-symbols-outlined" aria-hidden="true">warning</span>
      <p>Alimento no encontrado.</p>
      <RouterLink to="/foods" class="back-link">← Volver a la biblioteca</RouterLink>
    </div>

    <template v-else>
      <!-- Header -->
      <div class="detail-header">
        <RouterLink to="/foods" class="back-btn" aria-label="Volver a la biblioteca">
          ← Biblioteca
        </RouterLink>
      </div>

      <!-- Food identity -->
      <div class="identity-section">
        <div class="identity-header">
          <span
            class="al-badge"
            :class="alBadgeClass"
            :title="AL_CLASSIFICATION_LABELS[food.alClassification]"
          >
            <span class="material-symbols-outlined al-badge-icon">{{ alIcon }}</span>
          </span>
          <div class="identity-text">
            <h1 class="food-name">{{ food.name }}</h1>
            <div class="identity-meta">
              <span class="group-chip" :class="groupChipClass">
                {{ FOOD_GROUP_LABELS[food.group] }}
              </span>
              <span class="age-chip">
                <span class="material-symbols-outlined age-icon">child_care</span>
                ≥ {{ food.ageMonths }} meses
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Medical disclaimer -->
      <div class="disclaimer-banner" role="note">
        <span class="material-symbols-outlined disclaimer-icon" aria-hidden="true">health_and_safety</span>
        <span>Esta información es orientativa. Consulta siempre con tu pediatra.</span>
      </div>

      <!-- A/L Classification detail -->
      <section class="detail-card" aria-label="Clasificación Astringente / Laxante">
        <h2 class="card-title">
          <span class="material-symbols-outlined card-icon">balance</span>
          Efecto Digestivo
        </h2>
        <div class="al-detail">
          <div class="al-indicator" :class="alBarClass">
            <div class="al-bar-track">
              <div class="al-bar-fill" :style="{ width: alBarWidth }" />
            </div>
            <div class="al-bar-labels">
              <span>Astringente</span>
              <span>Neutro</span>
              <span>Laxante</span>
            </div>
          </div>
          <p class="al-description">{{ alDescription }}</p>
          <div class="al-score">
            <span class="al-score-label">Score A/L:</span>
            <span class="al-score-value" :class="alScoreClass">{{ formattedScore }}</span>
          </div>
        </div>
      </section>

      <!-- Description -->
      <section v-if="food.description" class="detail-card" aria-label="Descripción">
        <h2 class="card-title">
          <span class="material-symbols-outlined card-icon">description</span>
          Descripción
        </h2>
        <p class="description-text">{{ food.description }}</p>
      </section>

      <!-- Allergen info -->
      <section v-if="food.isAllergen" class="detail-card detail-card--allergen" aria-label="Información de alérgeno">
        <h2 class="card-title card-title--allergen">
          <span class="material-symbols-outlined card-icon">warning</span>
          Alérgeno Potencial
        </h2>
        <p class="allergen-text">
          Este alimento es un alérgeno conocido
          <template v-if="food.allergenType">— tipo: <strong>{{ food.allergenType }}</strong></template>.
          Introducelo con precaución, en pequeñas cantidades, y observa posibles reacciones durante 3-5 días
          antes de ofrecer otro alimento nuevo.
        </p>
      </section>

      <!-- Needs validation -->
      <section v-if="food.needsValidation" class="detail-card detail-card--validation" aria-label="Validación pendiente">
        <h2 class="card-title card-title--validation">
          <span class="material-symbols-outlined card-icon">science</span>
          Pendiente de Validación
        </h2>
        <p class="validation-text">
          Este alimento aún no ha sido validado nutricionalmente por el equipo de Pakulab.
          La información mostrada es preliminar y puede cambiar.
        </p>
      </section>

      <!-- Metadata -->
      <section class="detail-card detail-card--meta" aria-label="Metadatos">
        <h2 class="card-title">
          <span class="material-symbols-outlined card-icon">info</span>
          Información Técnica
        </h2>
        <dl class="meta-list">
          <div class="meta-row">
            <dt>ID</dt>
            <dd class="meta-mono">{{ food.id }}</dd>
          </div>
          <div class="meta-row">
            <dt>Agregado</dt>
            <dd>{{ formatDate(food.createdAt) }}</dd>
          </div>
          <div class="meta-row">
            <dt>Actualizado</dt>
            <dd>{{ formatDate(food.updatedAt) }}</dd>
          </div>
        </dl>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import type { Food, FoodGroup, ALClassification } from '@pakulab/shared'
import { FOOD_GROUP_LABELS, AL_CLASSIFICATION_LABELS } from '@pakulab/shared'
import { useFoodStore } from '@/shared/stores/foodStore.js'

const route = useRoute()
const store = useFoodStore()

const food = ref<Food | null>(null)
const loading = ref(true)

onMounted(async () => {
  const id = route.params.id as string
  food.value = await store.getFoodById(id)
  loading.value = false
})

// ── Computed helpers ──────────────────────────────────────────────────────

const alBadgeClass = computed(() => {
  if (!food.value) return ''
  switch (food.value.alClassification) {
    case 'ASTRINGENT': return 'badge-astringent'
    case 'LAXATIVE': return 'badge-laxative'
    default: return 'badge-neutral'
  }
})

const alIcon = computed(() => {
  if (!food.value) return 'balance'
  switch (food.value.alClassification) {
    case 'ASTRINGENT': return 'energy_savings_leaf'
    case 'LAXATIVE': return 'water_drop'
    default: return 'balance'
  }
})

const groupChipClass = computed(() => {
  if (!food.value) return ''
  const map: Record<FoodGroup, string> = {
    FRUIT: 'group-chip--fruit',
    VEGETABLE: 'group-chip--vegetable',
    PROTEIN: 'group-chip--protein',
    CEREAL_TUBER: 'group-chip--cereal',
    HEALTHY_FAT: 'group-chip--fat',
  }
  return map[food.value.group] ?? ''
})

const alBarClass = computed(() => {
  if (!food.value) return ''
  const score = food.value.alScore
  if (score < -0.3) return 'al-bar--astringent'
  if (score > 0.3) return 'al-bar--laxative'
  return 'al-bar--neutral'
})

const alBarWidth = computed(() => {
  if (!food.value) return '50%'
  // Map alScore [-1, 1] to [0%, 100%]
  const pct = ((food.value.alScore + 1) / 2) * 100
  return `${pct}%`
})

const alScoreClass = computed(() => {
  if (!food.value) return ''
  const score = food.value.alScore
  if (score < -0.3) return 'score-astringent'
  if (score > 0.3) return 'score-laxative'
  return 'score-neutral'
})

const formattedScore = computed(() => {
  if (!food.value) return '0.0'
  const score = food.value.alScore
  const prefix = score > 0 ? '+' : ''
  return `${prefix}${score.toFixed(1)}`
})

const alDescription = computed(() => {
  if (!food.value) return ''
  const score = food.value.alScore
  const al = food.value.alClassification
  if (al === 'ASTRINGENT') {
    if (score <= -0.7) return 'Altamente astringente. Tiende a endurecer las heces. Útil en episodios de diarrea, pero debe combinarse con alimentos laxantes para mantener el equilibrio.'
    return 'Astringente moderado. Puede ayudar a regular el tránsito intestinal cuando hay deposiciones sueltas.'
  }
  if (al === 'LAXATIVE') {
    if (score >= 0.7) return 'Altamente laxante. Favorece el tránsito intestinal. Ideal para prevenir o tratar el estreñimiento, pero en exceso puede causar deposiciones muy blandas.'
    return 'Laxante moderado. Ayuda a mantener un tránsito intestinal regular y prevenir el estreñimiento.'
  }
  return 'Neutro. No tiene un efecto significativo sobre el tránsito intestinal. Puede combinarse libremente con otros alimentos.'
})

// ── Helpers ───────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}
</script>

<style scoped>
/* ─── Page layout ──────────────────────────────────────────────────────── */
.food-detail-page {
  max-width: 720px;
  margin: 0 auto;
  padding: 1.5rem 1rem 4rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* ─── Loading / Error states ───────────────────────────────────────────── */
.state-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 4rem 1rem;
  text-align: center;
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-md);
  color: var(--md3-on-surface-variant);
}

.error-state {
  color: var(--md3-error);
}

.error-state p {
  margin: 0;
}

.back-link {
  color: var(--md3-primary);
  text-decoration: none;
  font-weight: var(--md3-weight-semibold);
}

.back-link:hover {
  text-decoration: underline;
}

.spinner {
  width: 2rem;
  height: 2rem;
  border: 3px solid var(--md3-surface-container-high);
  border-top-color: var(--md3-primary);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ─── Header ───────────────────────────────────────────────────────────── */
.detail-header {
  display: flex;
  align-items: center;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-md);
  font-weight: var(--md3-weight-semibold);
  color: var(--md3-primary);
  text-decoration: none;
  padding: 0.5rem 0;
}

.back-btn:hover {
  text-decoration: underline;
}

/* ─── Identity section ─────────────────────────────────────────────────── */
.identity-section {
  background: var(--md3-surface-container-lowest);
  border-radius: var(--md3-rounded-lg);
  padding: var(--md3-space-5);
  box-shadow: var(--md3-shadow-ambient);
}

.identity-header {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
}

.al-badge {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: var(--md3-rounded-full);
}

.al-badge-icon {
  font-size: 1.5rem;
  line-height: 1;
}

.badge-astringent {
  background: var(--md3-secondary-container);
  color: var(--md3-on-secondary-container);
}

.badge-laxative {
  background: var(--md3-primary-container);
  color: var(--md3-on-primary-container);
}

.badge-neutral {
  background: var(--md3-surface-container-high);
  color: var(--md3-on-surface-variant);
}

.identity-text {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-width: 0;
}

.food-name {
  font-family: var(--md3-font-headline);
  font-size: var(--md3-headline-md);
  font-weight: var(--md3-weight-bold);
  color: var(--md3-on-surface);
  margin: 0;
  line-height: var(--md3-headline-line-height);
  word-break: break-word;
}

.identity-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}

/* ─── Group chip ───────────────────────────────────────────────────────── */
.group-chip {
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-sm);
  font-weight: var(--md3-weight-semibold);
  padding: 0.25rem 0.75rem;
  border-radius: var(--md3-rounded-full);
  white-space: nowrap;
  text-transform: uppercase;
  letter-spacing: var(--md3-label-tracking);
}

.group-chip--fruit {
  background: var(--md3-group-fruit);
  color: var(--md3-group-fruit-on);
}

.group-chip--vegetable {
  background: var(--md3-group-vegetable);
  color: var(--md3-group-vegetable-on);
}

.group-chip--protein {
  background: var(--md3-group-protein);
  color: var(--md3-group-protein-on);
}

.group-chip--cereal {
  background: var(--md3-group-cereal);
  color: var(--md3-group-cereal-on);
}

.group-chip--fat {
  background: var(--md3-group-fat);
  color: var(--md3-group-fat-on);
}

/* ─── Age chip ─────────────────────────────────────────────────────────── */
.age-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-sm);
  font-weight: var(--md3-weight-semibold);
  padding: 0.25rem 0.75rem;
  border-radius: var(--md3-rounded-full);
  background: var(--md3-surface-container-low);
  color: var(--md3-primary);
  white-space: nowrap;
}

.age-icon {
  font-size: 0.875rem;
  line-height: 1;
}

/* ─── Disclaimer ───────────────────────────────────────────────────────── */
.disclaimer-banner {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: var(--md3-tertiary-container);
  border-radius: var(--md3-rounded-md);
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-sm);
  color: var(--md3-on-tertiary-container);
}

.disclaimer-icon {
  font-size: 1.25rem;
  flex-shrink: 0;
}

/* ─── Detail cards ─────────────────────────────────────────────────────── */
.detail-card {
  background: var(--md3-surface-container-lowest);
  border-radius: var(--md3-rounded-lg);
  padding: var(--md3-space-5);
  box-shadow: var(--md3-shadow-ambient);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.detail-card--allergen {
  border-left: 4px solid var(--md3-error);
}

.detail-card--validation {
  border-left: 4px solid var(--md3-tertiary);
}

.detail-card--meta {
  background: var(--md3-surface-container-low);
}

.card-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: var(--md3-font-headline);
  font-size: var(--md3-title-md);
  font-weight: var(--md3-weight-semibold);
  color: var(--md3-on-surface);
  margin: 0;
}

.card-title--allergen {
  color: var(--md3-error);
}

.card-title--validation {
  color: var(--md3-on-tertiary-container);
}

.card-icon {
  font-size: 1.25rem;
  flex-shrink: 0;
}

/* ─── A/L detail ───────────────────────────────────────────────────────── */
.al-detail {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.al-indicator {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.al-bar-track {
  height: 8px;
  background: var(--md3-surface-container-high);
  border-radius: 4px;
  overflow: hidden;
  position: relative;
}

.al-bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.4s ease;
}

.al-bar--astringent .al-bar-fill {
  background: var(--md3-secondary);
}

.al-bar--laxative .al-bar-fill {
  background: var(--md3-primary);
}

.al-bar--neutral .al-bar-fill {
  background: var(--md3-outline-variant);
}

.al-bar-labels {
  display: flex;
  justify-content: space-between;
  font-family: var(--md3-font-label);
  font-size: 0.625rem;
  color: var(--md3-outline);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.al-description {
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-md);
  color: var(--md3-on-surface-variant);
  line-height: var(--md3-body-line-height);
  margin: 0;
}

.al-score {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.al-score-label {
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-sm);
  color: var(--md3-outline);
}

.al-score-value {
  font-family: var(--md3-font-headline);
  font-size: var(--md3-title-md);
  font-weight: var(--md3-weight-bold);
}

.score-astringent {
  color: var(--md3-secondary);
}

.score-laxative {
  color: var(--md3-primary);
}

.score-neutral {
  color: var(--md3-on-surface-variant);
}

/* ─── Description ──────────────────────────────────────────────────────── */
.description-text {
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-md);
  color: var(--md3-on-surface-variant);
  line-height: var(--md3-body-line-height);
  margin: 0;
}

/* ─── Allergen section ─────────────────────────────────────────────────── */
.allergen-text {
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-md);
  color: var(--md3-on-surface-variant);
  line-height: var(--md3-body-line-height);
  margin: 0;
}

.allergen-text strong {
  color: var(--md3-on-surface);
}

/* ─── Validation section ───────────────────────────────────────────────── */
.validation-text {
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-md);
  color: var(--md3-on-surface-variant);
  line-height: var(--md3-body-line-height);
  margin: 0;
}

/* ─── Metadata ─────────────────────────────────────────────────────────── */
.meta-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin: 0;
}

.meta-row {
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-sm);
}

.meta-row dt {
  color: var(--md3-outline);
  font-weight: var(--md3-weight-medium);
  min-width: 100px;
  flex-shrink: 0;
}

.meta-row dd {
  color: var(--md3-on-surface-variant);
  margin: 0;
}

.meta-mono {
  font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', monospace;
  font-size: 0.75rem;
  word-break: break-all;
}

/* ─── Responsive ───────────────────────────────────────────────────────── */
@media (max-width: 640px) {
  .food-detail-page {
    padding: 1rem 0.75rem 3rem;
    gap: 1rem;
  }

  .identity-section,
  .detail-card {
    padding: 1rem;
  }

  .food-name {
    font-size: var(--md3-headline-sm);
  }

  .al-badge {
    width: 40px;
    height: 40px;
  }

  .al-badge-icon {
    font-size: 1.25rem;
  }
}
</style>
