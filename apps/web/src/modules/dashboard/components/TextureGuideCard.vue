<template>
  <section
    class="dashboard-card texture-card"
    role="region"
    aria-label="Guía de texturas sugeridas"
  >
    <!-- Card Header -->
    <div class="card-header">
      <div class="header-title-group">
        <span class="material-symbols-outlined header-icon" aria-hidden="true">soup_kitchen</span>
        <h2 class="card-title">Guía de texturas</h2>
      </div>
      <span v-if="!loading && currentStage" class="stage-badge">
        {{ currentStage.ageRange }}
      </span>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="loading-skeleton">
      <div class="skeleton-line skeleton-line-title" />
      <div class="skeleton-line skeleton-line-subtitle" />
      <div class="skeleton-list">
        <div v-for="n in 3" :key="n" class="skeleton-item">
          <div class="skeleton-bullet" />
          <div class="skeleton-line skeleton-line-text" />
        </div>
      </div>
    </div>

    <!-- Content state -->
    <div v-else class="texture-content">
      <!-- All 5 stages -->
      <div
        v-for="(stage, index) in ALL_STAGES"
        :key="stage.id"
        class="stage-item"
        :class="{
          'stage-current': isCurrentStage(index),
          'stage-future': isFutureStage(index)
        }"
      >
        <div class="stage-header">
          <span class="material-symbols-outlined stage-icon" aria-hidden="true">
            {{ stage.icon }}
          </span>
          <div class="stage-title-group">
            <h3 class="stage-title">{{ stage.ageRange }}</h3>
            <p class="stage-subtitle">{{ stage.title }}</p>
          </div>
          <span v-if="isFutureStage(index)" class="future-badge">Próximamente</span>
        </div>

        <!-- Show details only for current stage -->
        <ul v-if="isCurrentStage(index)" class="texture-details" role="list">
          <li
            v-for="(tip, idx) in stage.tips"
            :key="idx"
            class="detail-item"
            role="listitem"
          >
            <span class="material-symbols-outlined check-icon" aria-hidden="true">done</span>
            <span class="detail-text">{{ tip }}</span>
          </li>
        </ul>
      </div>

      <!-- Warning callout (shown only once at the end) -->
      <div v-if="currentStage" class="safety-callout">
        <span class="material-symbols-outlined safety-icon" aria-hidden="true">gavel</span>
        <p class="safety-text">
          Asegúrate de que los alimentos estén bien cocidos y sean blandos al tacto. ¡Acompaña siempre a tu bebé mientras come!
        </p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  babyAgeMonths: number
  loading?: boolean
}>()

interface TextureStage {
  id: string
  ageRange: string
  title: string
  icon: string
  tips: string[]
  minAge: number
  maxAge: number
}

// All 5 stages as constants
const ALL_STAGES: TextureStage[] = [
  {
    id: 'stage-6m',
    ageRange: '6m',
    title: 'Purés suaves y Bastones grandes',
    icon: 'restaurant',
    tips: [
      'Consistencia: Purés bien lisos y sin grumos, tirando a líquidos.',
      'BLW: Bastones del tamaño de un dedo de adulto (para que lo agarre con su mano).',
      'Textura blanda: Que puedas aplastarlo fácilmente con tus dedos índice y pulgar.'
    ],
    minAge: 6,
    maxAge: 6
  },
  {
    id: 'stage-7-9m',
    ageRange: '7-9m',
    title: 'Machacados y Grumos suaves',
    icon: 'flatware',
    tips: [
      'Consistencia: Alimentos pisados con tenedor, purés espesos con grumos blandos.',
      'BLW: Trozos más pequeños pero blandos para estimular el agarre palmar.',
      'Fomenta la masticación: El bebé empieza a mover la comida con su lengua.'
    ],
    minAge: 7,
    maxAge: 9
  },
  {
    id: 'stage-10-12m',
    ageRange: '10-12m',
    title: 'Trozos pequeños y sólidos blandos',
    icon: 'nutrition',
    tips: [
      'Consistencia: Alimentos picados o cortados en cubitos chiquitos (corte pinza).',
      'Motricidad: Practica agarrar trozos usando sus dedos pulgar e índice.',
      'Variedad: Ideal para fideos cortos muy cocidos, legumbres enteras tiernas y vegetales.'
    ],
    minAge: 10,
    maxAge: 12
  },
  {
    id: 'stage-13-17m',
    ageRange: '13-17m',
    title: 'Textura Familiar Adaptada',
    icon: 'family_history',
    tips: [
      'Consistencia: Comida familiar adaptada en tamaño y baja en sal/azúcares.',
      'Evitar riesgos: Nada de alimentos redondos enteros (uvas picadas al sesgo, tomates cherry cortados en 4).',
      'Masticación madura: Puede morder y triturar texturas más complejas.'
    ],
    minAge: 13,
    maxAge: 17
  },
  {
    id: 'stage-18-23m',
    ageRange: '18-23m',
    title: 'Texturas Complejas',
    icon: 'cake',
    tips: [
      'Consistencia: Comida regular de la familia con supervisión.',
      'Masticación avanzada: Mayor habilidad para morder, masticar y tragar.',
      'Incluir variedad: Introduce texturas más firmes y complejas gradualmente.'
    ],
    minAge: 18,
    maxAge: 23
  }
]

const currentStageIndex = computed(() => {
  const age = props.babyAgeMonths
  return ALL_STAGES.findIndex(stage => age >= stage.minAge && age <= stage.maxAge)
})

const currentStage = computed(() => {
  const idx = currentStageIndex.value
  return idx >= 0 ? ALL_STAGES[idx] : null
})

function isCurrentStage(stageIndex: number): boolean {
  return stageIndex === currentStageIndex.value
}

function isFutureStage(stageIndex: number): boolean {
  return stageIndex > currentStageIndex.value
}
</script>

<style scoped>
.texture-card {
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-4);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--md3-surface-container-high);
  padding-bottom: var(--md3-space-3);
  margin-bottom: var(--md3-space-2);
}

.header-title-group {
  display: flex;
  align-items: center;
  gap: var(--md3-space-2);
}

.header-icon {
  color: var(--md3-primary);
  font-size: 1.5rem !important;
}

.card-title {
  margin: 0;
  font-family: var(--md3-font-headline);
  font-size: var(--md3-title-lg);
  font-weight: var(--md3-weight-semibold);
  color: var(--md3-on-surface);
}

.stage-badge {
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-sm);
  font-weight: var(--md3-weight-bold);
  background-color: var(--md3-secondary-container);
  color: var(--md3-on-secondary-container);
  padding: 4px 10px;
  border-radius: var(--md3-rounded-full);
}

.texture-content {
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-4);
}

.stage-item {
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-3);
  padding: var(--md3-space-3);
  border-radius: var(--md3-rounded-lg);
  border: 1px solid var(--md3-outline-variant);
  background: var(--md3-surface-container-low);
  transition: opacity 0.2s, background 0.2s;
}

.stage-item.stage-current {
  border-color: var(--md3-primary);
  background: var(--md3-primary-container);
}

.stage-item.stage-future {
  opacity: 0.5;
  background: var(--md3-surface-container-lowest);
}

.stage-header {
  display: flex;
  align-items: center;
  gap: var(--md3-space-3);
}

.stage-icon {
  font-size: 2rem !important;
  color: var(--md3-primary);
  flex-shrink: 0;
}

.stage-item.stage-future .stage-icon {
  color: var(--md3-on-surface-variant);
}

.stage-title-group {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stage-title {
  margin: 0;
  font-family: var(--md3-font-headline);
  font-size: var(--md3-title-sm);
  font-weight: var(--md3-weight-bold);
  color: var(--md3-on-surface);
}

.stage-subtitle {
  margin: 0;
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-sm);
  color: var(--md3-on-surface-variant);
}

.future-badge {
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-xs);
  font-weight: var(--md3-weight-bold);
  background-color: var(--md3-surface-container-high);
  color: var(--md3-on-surface-variant);
  padding: 2px 8px;
  border-radius: var(--md3-rounded-full);
  flex-shrink: 0;
}

.texture-details {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-3);
}

.detail-item {
  display: flex;
  align-items: flex-start;
  gap: var(--md3-space-2);
}

.check-icon {
  color: var(--md3-primary);
  font-size: 1.15rem !important;
  margin-top: 2px;
  flex-shrink: 0;
}

.detail-text {
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-md);
  color: var(--md3-on-surface-variant);
  line-height: 1.4;
}

.safety-callout {
  display: flex;
  gap: var(--md3-space-2);
  background: var(--md3-error-container);
  color: var(--md3-on-error-container);
  padding: var(--md3-space-3);
  border-radius: var(--md3-rounded-lg);
  align-items: flex-start;
}

.safety-icon {
  font-size: 1.25rem !important;
  flex-shrink: 0;
  margin-top: 1px;
}

.safety-text {
  margin: 0;
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-sm);
  line-height: 1.4;
}

/* Loading skeleton styles */
.loading-skeleton {
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-3);
}

.skeleton-line {
  height: 16px;
  background: var(--md3-surface-container-high);
  border-radius: var(--md3-rounded-sm);
}

.skeleton-line-title {
  width: 60%;
  height: 20px;
}

.skeleton-line-subtitle {
  width: 40%;
}

.skeleton-list {
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-3);
  margin-top: var(--md3-space-2);
}

.skeleton-item {
  display: flex;
  align-items: center;
  gap: var(--md3-space-2);
}

.skeleton-bullet {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--md3-surface-container-high);
  flex-shrink: 0;
}

.skeleton-line-text {
  flex: 1;
}
</style>
