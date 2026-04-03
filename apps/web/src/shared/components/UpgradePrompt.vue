<template>
  <div class="upgrade-prompt" role="complementary" :aria-label="`Acceso restringido: ${featureName}`">
    <div class="prompt-icon-wrap" aria-hidden="true">
      <span class="material-symbols-outlined prompt-icon">{{ icon }}</span>
    </div>

    <div class="prompt-body">
      <h3 class="prompt-title">{{ title }}</h3>
      <p class="prompt-description">{{ description }}</p>
    </div>

    <RouterLink :to="ctaRoute" class="prompt-cta">
      <span class="material-symbols-outlined cta-icon" aria-hidden="true">{{ ctaIcon }}</span>
      {{ ctaLabel }}
    </RouterLink>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { UserTier } from '@pakulab/shared'
import { useAuthStore } from '@/shared/stores/authStore.js'

const props = defineProps<{
  /** Minimum tier required for the feature */
  requiredTier: UserTier
  /** Human-readable feature name */
  featureName: string
}>()

const authStore = useAuthStore()

const isAnonymous = computed(() => authStore.isAnonymous)
const isRequiringPro = computed(() => props.requiredTier === 'PRO')

const icon = computed(() => {
  if (isAnonymous.value) return 'lock_open'
  if (isRequiringPro.value) return 'star'
  return 'lock'
})

const title = computed(() => {
  if (isAnonymous.value) {
    return `Creá una cuenta para ${props.featureName}`
  }
  if (isRequiringPro.value) {
    return `${props.featureName} es una función Pro`
  }
  return `Necesitás una cuenta para ${props.featureName}`
})

const description = computed(() => {
  if (isAnonymous.value) {
    return 'Registrate gratis en segundos y guardá todo tu progreso. Sin tarjeta de crédito.'
  }
  if (isRequiringPro.value) {
    return 'Mejorá a Pro para desbloquear esta función y muchas más. Desde $99 MXN/mes.'
  }
  return 'Creá una cuenta gratuita para acceder a esta función.'
})

const ctaLabel = computed(() => {
  if (isAnonymous.value) return 'Registrate gratis'
  if (isRequiringPro.value) return 'Actualizar a Pro'
  return 'Crear cuenta'
})

const ctaIcon = computed(() => {
  if (isRequiringPro.value) return 'rocket_launch'
  return 'person_add'
})

const ctaRoute = computed(() => {
  if (isAnonymous.value) return '/auth/signup'
  if (isRequiringPro.value) return '/pricing'
  return '/auth/signup'
})
</script>

<style scoped>
.upgrade-prompt {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--md3-space-3);
  padding: var(--md3-space-6) var(--md3-space-4);
  background: var(--md3-surface-container-lowest);
  border-radius: var(--md3-rounded-lg);
  text-align: center;
  box-shadow: var(--md3-shadow-ambient);
}

.prompt-icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3.5rem;
  height: 3.5rem;
  border-radius: var(--md3-rounded-full);
  background: var(--md3-surface-container-low);
}

.prompt-icon {
  font-size: 1.75rem;
  color: var(--md3-primary);
}

.prompt-body {
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-1);
}

.prompt-title {
  margin: 0;
  font-family: var(--md3-font-headline);
  font-size: var(--md3-title-md);
  font-weight: var(--md3-weight-bold);
  color: var(--md3-on-surface);
  letter-spacing: var(--md3-headline-tracking);
}

.prompt-description {
  margin: 0;
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-md);
  color: var(--md3-on-surface-variant);
  max-width: 300px;
  line-height: var(--md3-body-line-height);
}

.prompt-cta {
  display: inline-flex;
  align-items: center;
  gap: var(--md3-space-2);
  padding: 0.75rem 1.75rem;
  background: var(--md3-gradient-cta);
  color: var(--md3-on-primary);
  border-radius: var(--md3-rounded-full);
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-md);
  font-weight: var(--md3-weight-bold);
  text-decoration: none;
  box-shadow: var(--md3-shadow-card);
  transition: background var(--md3-transition-fast), box-shadow var(--md3-transition-fast);
}

.prompt-cta:hover {
  background: var(--md3-gradient-cta-hover);
  box-shadow: var(--md3-shadow-elevated);
}

.cta-icon {
  font-size: 1.125rem;
}
</style>
