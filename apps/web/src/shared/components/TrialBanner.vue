<template>
  <div v-if="visible" class="trial-banner" role="status">
    <span class="material-symbols-outlined banner-icon" aria-hidden="true">card_giftcard</span>
    <p class="banner-message">
      {{ message }}
      <RouterLink to="/pricing" class="banner-link">Para actualizar tu suscripción, ingresa aquí.</RouterLink>
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useBillingStore } from '@/shared/stores/billingStore.js'

const billingStore = useBillingStore()

const visible = computed(() => {
  const sub = billingStore.subscription
  return sub?.status === 'TRIALING' && sub.trialEnd != null
})

const daysLeft = computed(() => {
  const sub = billingStore.subscription
  if (!sub?.trialEnd) return 0
  // Compare dates at day boundaries (ignore time)
  const trialEndDate = new Date(sub.trialEnd)
  trialEndDate.setHours(0, 0, 0, 0)
  const nowDate = new Date()
  nowDate.setHours(0, 0, 0, 0)
  const diffMs = trialEndDate.getTime() - nowDate.getTime()
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))
  return Math.max(0, diffDays)
})

const message = computed(() => {
  const days = daysLeft.value
  if (days === 0) {
    return 'Hoy es tu último día de prueba gratuita.'
  }
  if (days === 1) {
    return 'Te queda 1 día de tu prueba gratuita.'
  }
  return `Te quedan ${days} días de tu prueba gratuita.`
})
</script>

<style scoped>
.trial-banner {
  display: flex;
  align-items: center;
  gap: var(--md3-space-3);
  padding: var(--md3-space-2) var(--md3-space-3);
  background: var(--md3-tertiary-container);
  color: var(--md3-on-tertiary-container);
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-md);
  line-height: var(--md3-body-line-height);
}

.banner-icon {
  font-size: 1.25rem !important;
  flex-shrink: 0;
}

.banner-message {
  margin: 0;
  color: var(--md3-on-tertiary-container);
}

.banner-link {
  color: var(--md3-on-tertiary-container);
  font-weight: var(--md3-weight-semibold);
  text-decoration: underline;
  text-decoration-thickness: 1px;
  text-underline-offset: 2px;
  transition: opacity var(--md3-transition-fast);
}

.banner-link:hover {
  opacity: 0.85;
}

/* Mobile adjustments */
@media (max-width: 480px) {
  .trial-banner {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--md3-space-1);
  }
}

/* Desktop: center the banner */
@media (min-width: 768px) {
  .trial-banner {
    justify-content: center;
    padding: var(--md3-space-2) var(--md3-space-6);
  }
}
</style>