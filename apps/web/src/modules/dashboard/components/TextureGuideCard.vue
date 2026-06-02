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
        {{ currentStage.stage }}
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
    <div v-else-if="currentStage" class="texture-content">
      <div class="texture-highlight">
        <span class="material-symbols-outlined texture-icon" aria-hidden="true">
          {{ currentStage.icon }}
        </span>
        <div class="texture-title-group">
          <h3 class="texture-title">{{ currentStage.title }}</h3>
          <p class="texture-subtitle">Ideal para los {{ babyAgeMonths }} meses</p>
        </div>
      </div>

      <ul class="texture-details" role="list">
        <li
          v-for="(tip, idx) in currentStage.tips"
          :key="idx"
          class="detail-item"
          role="listitem"
        >
          <span class="material-symbols-outlined check-icon" aria-hidden="true">done</span>
          <span class="detail-text">{{ tip }}</span>
        </li>
      </ul>

      <!-- Warning callout -->
      <div class="safety-callout">
        <span class="material-symbols-outlined safety-icon" aria-hidden="true">gavel</span>
        <p class="safety-text">
          Asegurate de que los alimentos estén bien cocidos y sean blandos al tacto. ¡Acompañá siempre a tu bebé mientras come!
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
  stage: string
  title: string
  icon: string
  tips: string[]
}

const currentStage = computed<TextureStage | null>(() => {
  const age = props.babyAgeMonths

  if (age < 6) {
    return {
      stage: 'Lactancia',
      title: 'Lactancia Exclusiva',
      icon: 'water_drop',
      tips: [
        'Solo leche materna o de fórmula.',
        'El estómago y reflejos de tu bebé aún se están preparando.',
        'No introduzcas sólidos antes de los 6 meses sin indicación médica.'
      ]
    }
  } else if (age === 6) {
    return {
      stage: 'Fase 1: Inicio',
      title: 'Purés suaves y Bastones grandes',
      icon: 'restaurant',
      tips: [
        'Consistencia: Purés bien lisos y sin grumos, tirando a líquidos.',
        'BLW: Bastones del tamaño de un dedo de adulto (para que lo agarre con su mano).',
        'Textura blanda: Que puedas aplastarlo fácilmente con tus dedos índice y pulgar.'
      ]
    }
  } else if (age >= 7 && age <= 8) {
    return {
      stage: 'Fase 2: Transición',
      title: 'Machacados y Grumos suaves',
      icon: 'flatware',
      tips: [
        'Consistencia: Alimentos pisados con tenedor, purés espesos con grumos blandos.',
        'BLW: Trozos más pequeños pero blandos para estimular el agarre palmar.',
        'Fomentá la masticación: El bebé empieza a mover la comida con su lengua.'
      ]
    }
  } else if (age >= 9 && age <= 11) {
    return {
      stage: 'Fase 3: Pinza digital',
      title: 'Trozos pequeños y sólidos blandos',
      icon: 'nutrition',
      tips: [
        'Consistencia: Alimentos picados o cortados en cubitos chiquitos (corte pinza).',
        'Motricidad: Practica agarrar trozos usando sus dedos pulgar e índice.',
        'Variedad: Ideal para fideos cortos muy cocidos, legumbres enteras tiernas y vegetales.'
      ]
    }
  } else {
    // 12+ months
    return {
      stage: 'Fase 4: Mesa familiar',
      title: 'Textura Familiar Adaptada',
      icon: 'family_history',
      tips: [
        'Consistencia: Comida familiar adaptada en tamaño y baja en sal/azúcares.',
        'Evitar riesgos: Nada de alimentos redondos enteros (uvas picadas al sesgo, tomates cherry cortados en 4).',
        'Masticación madura: Puede morder y triturar texturas más complejas.'
      ]
    }
  }
})
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

.texture-highlight {
  display: flex;
  align-items: center;
  gap: var(--md3-space-3);
  background: var(--md3-surface-container-low);
  padding: var(--md3-space-3);
  border-radius: var(--md3-rounded-lg);
  border: 1px solid var(--md3-outline-variant);
}

.texture-icon {
  font-size: 2.25rem !important;
  color: var(--md3-primary);
  background: var(--md3-primary-container);
  padding: var(--md3-space-2);
  border-radius: var(--md3-rounded-md);
}

.texture-title-group {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.texture-title {
  margin: 0;
  font-family: var(--md3-font-headline);
  font-size: var(--md3-title-md);
  font-weight: var(--md3-weight-bold);
  color: var(--md3-on-surface);
}

.texture-subtitle {
  margin: 0;
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-sm);
  color: var(--md3-on-surface-variant);
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
