<template>
  <div class="success-page">
    <div class="success-card">
      <div class="success-icon-wrap" aria-hidden="true">
        <span class="material-symbols-outlined success-icon">check_circle</span>
      </div>

      <h1>¡Bienvenido a Pakulab Pro!</h1>
      <p class="success-msg">
        Tu suscripción está activa. Ya podés disfrutar de todas las funciones Pro.
      </p>

      <ul class="features-unlocked">
        <li>
          <span class="material-symbols-outlined feature-icon" aria-hidden="true">check</span>
          Platos ilimitados
        </li>
        <li>
          <span class="material-symbols-outlined feature-icon" aria-hidden="true">check</span>
          Hasta 3 perfiles de bebé
        </li>
        <li>
          <span class="material-symbols-outlined feature-icon" aria-hidden="true">check</span>
          Bitácora completa
        </li>
        <li>
          <span class="material-symbols-outlined feature-icon" aria-hidden="true">check</span>
          Menú semanal
        </li>
        <li>
          <span class="material-symbols-outlined feature-icon" aria-hidden="true">check</span>
          Sin marca de agua
        </li>
      </ul>

      <div class="actions">
        <RouterLink to="/" class="btn btn-primary">
          <span class="material-symbols-outlined btn-icon" aria-hidden="true">home</span>
          Ir al inicio
        </RouterLink>
        <RouterLink to="/plates" class="btn btn-ghost">
          <span class="material-symbols-outlined btn-icon" aria-hidden="true">restaurant</span>
          Mis platos
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useBillingStore } from '@/shared/stores/billingStore.js'
import { useAuthStore } from '@/shared/stores/authStore.js'

const billingStore = useBillingStore()
const authStore = useAuthStore()

onMounted(async () => {
  // Refresh subscription status and auth session after successful checkout
  if (authStore.isAuthenticated) {
    await Promise.all([
      billingStore.fetchSubscription(),
      authStore.checkSession(),
    ])
  }
})
</script>

<style scoped>
.success-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: var(--md3-space-3);
}

.success-card {
  background: var(--md3-surface-container-lowest);
  border: 2px solid var(--md3-primary);
  border-radius: var(--md3-rounded-lg);
  padding: var(--md3-space-8) var(--md3-space-6);
  max-width: 480px;
  width: 100%;
  text-align: center;
  box-shadow: var(--md3-shadow-elevated);
}

.success-icon-wrap {
  width: 72px;
  height: 72px;
  border-radius: var(--md3-rounded-full);
  background: var(--md3-primary-container);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--md3-space-4);
}

.success-icon {
  font-size: 2.5rem !important;
  color: var(--md3-primary);
}

h1 {
  font-family: var(--md3-font-headline);
  font-size: var(--md3-headline-md);
  font-weight: var(--md3-weight-bold);
  color: var(--md3-on-surface);
  margin-bottom: var(--md3-space-2);
  letter-spacing: var(--md3-headline-tracking);
  line-height: var(--md3-headline-line-height);
}

.success-msg {
  color: var(--md3-on-surface-variant);
  margin-bottom: var(--md3-space-4);
  line-height: var(--md3-body-line-height);
  font-size: var(--md3-body-lg);
}

.features-unlocked {
  list-style: none;
  padding: 0;
  margin: 0 auto var(--md3-space-6);
  text-align: left;
  display: inline-flex;
  flex-direction: column;
  gap: var(--md3-space-2);
  color: var(--md3-on-surface);
  font-size: var(--md3-body-md);
}

.features-unlocked li {
  display: flex;
  align-items: center;
  gap: var(--md3-space-2);
}

.feature-icon {
  font-size: 1.125rem !important;
  color: var(--md3-primary);
  flex-shrink: 0;
}

.actions {
  display: flex;
  gap: var(--md3-space-2);
  justify-content: center;
  flex-wrap: wrap;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: var(--md3-space-1);
  padding: 0.625rem var(--md3-space-4);
  border-radius: var(--md3-rounded-full);
  font-family: var(--md3-font-label);
  font-weight: var(--md3-weight-semibold);
  font-size: var(--md3-label-lg);
  text-decoration: none;
  cursor: pointer;
  border: none;
  transition:
    background var(--md3-transition-fast),
    box-shadow var(--md3-transition-fast);
  letter-spacing: var(--md3-label-tracking);
}

.btn-icon {
  font-size: 1rem !important;
}

.btn-primary {
  background: var(--md3-gradient-cta);
  color: var(--md3-on-primary);
  box-shadow: var(--md3-shadow-card);
}

.btn-primary:hover {
  background: var(--md3-gradient-cta-hover);
  box-shadow: var(--md3-shadow-elevated);
}

.btn-ghost {
  background: transparent;
  color: var(--md3-on-surface);
  border: 1.5px solid var(--md3-outline-variant);
}

.btn-ghost:hover {
  background: var(--md3-surface-container-low);
}
</style>
