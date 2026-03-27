<template>
  <div class="upgrade-prompt" role="complementary" :aria-label="`Acceso restringido: ${featureName}`">
    <div class="prompt-icon" aria-hidden="true">{{ icon }}</div>

    <div class="prompt-body">
      <h3 class="prompt-title">{{ title }}</h3>
      <p class="prompt-description">{{ description }}</p>
    </div>

    <RouterLink :to="ctaRoute" class="prompt-cta">
      {{ ctaLabel }}
    </RouterLink>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { UserTier } from '@cfa/shared'
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
  if (isAnonymous.value) return '🔓'
  if (isRequiringPro.value) return '⭐'
  return '🔒'
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
  if (isRequiringPro.value) return 'Mejorá a Pro'
  return 'Crear cuenta'
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
  gap: 0.75rem;
  padding: 1.5rem 1.25rem;
  background: linear-gradient(135deg, #f0fdf4, #ecfdf5);
  border: 1.5px dashed #6ee7b7;
  border-radius: 1.25rem;
  text-align: center;
}

.prompt-icon {
  font-size: 2.5rem;
  line-height: 1;
}

.prompt-body {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.prompt-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: #111827;
}

.prompt-description {
  margin: 0;
  font-size: 0.875rem;
  color: #6b7280;
  max-width: 300px;
}

.prompt-cta {
  display: inline-flex;
  align-items: center;
  padding: 0.65rem 1.5rem;
  background: #10b981;
  color: white;
  border-radius: 9999px;
  font-size: 0.9rem;
  font-weight: 700;
  text-decoration: none;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
  transition: background 0.15s;
}

.prompt-cta:hover {
  background: #059669;
}
</style>
