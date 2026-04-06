<template>
  <div class="plan-selection-page">
    <h1>Elegí tu plan</h1>
    <p class="subtitle">Probá gratis 21 días — sin tarjeta de crédito</p>

    <!-- Error banner -->
    <div v-if="billingStore.error" class="error-banner" role="alert">
      <span class="material-symbols-outlined error-banner__icon" aria-hidden="true">warning</span>
      {{ billingStore.error }}
    </div>

    <!-- Plan cards -->
    <div class="plans">
      <!-- Trial -->
      <div class="plan plan-trial">
        <h2>Prueba Gratuita</h2>
        <p class="price">Gratis <span>21 días</span></p>

        <ul class="features">
          <li v-for="feature in trialFeatures" :key="feature">
            <span class="material-symbols-outlined feature-icon" aria-hidden="true">check</span>
            {{ feature }}
          </li>
        </ul>

        <p class="trial-note">
          <span class="material-symbols-outlined" aria-hidden="true">card_giftcard</span>
          Sin tarjeta de crédito
        </p>

        <button
          class="btn-upgrade btn-upgrade-trial"
          @click="handleStartTrial('TRIAL')"
          :disabled="billingStore.loading"
        >
          {{ billingStore.loading && selectedPlan === 'TRIAL' ? 'Cargando...' : 'Comenzar prueba' }}
        </button>
      </div>

      <!-- Pro Mensual -->
      <div class="plan plan-monthly">
        <div class="badge">Recomendado</div>
        <h2>Pro Mensual</h2>
        <p class="price">$99 <span>MXN / mes</span></p>

        <ul class="features">
          <li v-for="feature in proFeatures" :key="feature">
            <span class="material-symbols-outlined feature-icon" aria-hidden="true">check</span>
            {{ feature }}
          </li>
        </ul>

        <p class="trial-note">
          <span class="material-symbols-outlined" aria-hidden="true">card_giftcard</span>
          Probá gratis 21 días
        </p>

        <button
          class="btn-upgrade btn-upgrade-pro"
          @click="handleStartTrial('PRO_MONTHLY')"
          :disabled="billingStore.loading"
        >
          {{ billingStore.loading && selectedPlan === 'PRO_MONTHLY' ? 'Cargando...' : 'Suscribirse mensual' }}
        </button>
      </div>

      <!-- Pro Anual -->
      <div class="plan plan-yearly">
        <h2>Pro Anual</h2>
        <p class="price">$999 <span>MXN / año</span></p>
        <p class="price-monthly-equiv">Equivale a $83 / mes</p>
        <div class="savings-pill">Ahorrá 17%</div>

        <ul class="features">
          <li v-for="feature in proFeatures" :key="feature">
            <span class="material-symbols-outlined feature-icon" aria-hidden="true">check</span>
            {{ feature }}
          </li>
        </ul>

        <p class="trial-note">
          <span class="material-symbols-outlined" aria-hidden="true">card_giftcard</span>
          Probá gratis 21 días
        </p>

        <button
          class="btn-upgrade btn-upgrade-yearly"
          @click="handleStartTrial('PRO_YEARLY')"
          :disabled="billingStore.loading"
        >
          {{ billingStore.loading && selectedPlan === 'PRO_YEARLY' ? 'Cargando...' : 'Suscribirse anual' }}
        </button>
      </div>
    </div>

    <!-- Trust signals -->
    <div class="trust-signals" aria-label="Señales de confianza">
      <span class="trust-item">
        <span class="material-symbols-outlined" aria-hidden="true">lock</span>
        Sin compromiso
      </span>
      <span class="trust-item">
        <span class="material-symbols-outlined" aria-hidden="true">cancel</span>
        Cancelá cuando quieras
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useBillingStore } from '@/shared/stores/billingStore.js'
import { useAuthStore } from '@/shared/stores/authStore.js'

const billingStore = useBillingStore()
const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

const selectedPlan = ref<'TRIAL' | 'PRO_MONTHLY' | 'PRO_YEARLY' | null>(null)

const trialFeatures = [
  'Constructor de platos',
  'Catálogo de alimentos',
  'Balance A/L en tiempo real',
  'Hasta 5 platos guardados',
  '1 perfil de bebé',
]

const proFeatures = [
  'Platos ilimitados',
  'Hasta 3 perfiles de bebé',
  'Bitácora completa (sin límite)',
  'Reacciones y fotos en bitácora',
  'Menú semanal',
  'Rastreador de alérgenos',
  'Export PNG/PDF sin marca de agua',
  'Soporte prioritario',
]

async function handleStartTrial(plan: 'TRIAL' | 'PRO_MONTHLY' | 'PRO_YEARLY'): Promise<void> {
  selectedPlan.value = plan
  billingStore.clearError()
  try {
    await billingStore.startTrial(plan)
    // Refresh session so tier resolves to PRO (TRIALING → PRO on the server)
    await authStore.checkSession()
    // Redirect to the original destination or home
    const redirect = route.query.redirect as string | undefined
    await router.push(redirect ?? '/')
  } catch {
    // Error is displayed via billingStore.error
    selectedPlan.value = null
  }
}
</script>

<style scoped>
.plan-selection-page {
  max-width: 960px;
  margin: 0 auto;
  padding: var(--md3-space-3) var(--md3-space-3) var(--md3-space-12);
}

h1 {
  font-family: var(--md3-font-headline);
  font-size: var(--md3-headline-md);
  font-weight: var(--md3-weight-bold);
  color: var(--md3-on-surface);
  margin-bottom: var(--md3-space-2);
  text-align: center;
  letter-spacing: var(--md3-headline-tracking);
}

.subtitle {
  color: var(--md3-on-surface-variant);
  font-size: var(--md3-body-lg);
  text-align: center;
  margin-bottom: var(--md3-space-6);
}

/* ─── Error banner ─── */
.error-banner {
  display: flex;
  align-items: center;
  gap: var(--md3-space-2);
  padding: var(--md3-space-3) var(--md3-space-4);
  background: var(--md3-error-container);
  border-radius: var(--md3-rounded-md);
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-md);
  color: var(--md3-on-error-container);
  margin-bottom: var(--md3-space-4);
}

.error-banner__icon {
  font-size: 1.125rem !important;
  flex-shrink: 0;
}

/* ─── Pricing cards ─── */
.plans {
  display: grid;
  gap: var(--md3-space-4);
  margin-bottom: var(--md3-space-8);
}

@media (min-width: 640px) {
  .plans {
    grid-template-columns: 1fr 1fr 1fr;
    align-items: start;
  }
}

.plan {
  background: var(--md3-surface-container-low);
  border: 1.5px solid var(--md3-outline-variant);
  border-radius: var(--md3-rounded-lg);
  padding: var(--md3-space-6);
  position: relative;
  transition: box-shadow var(--md3-transition-normal);
}

.plan-monthly {
  background: var(--md3-surface-container-lowest);
  border-color: var(--md3-primary);
  box-shadow: var(--md3-shadow-elevated);
}

.plan-yearly {
  background: var(--md3-surface-container-low);
  border-color: var(--md3-outline-variant);
}

.badge {
  position: absolute;
  top: -13px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--md3-gradient-cta);
  color: var(--md3-on-primary);
  padding: 0.25rem var(--md3-space-3);
  border-radius: var(--md3-rounded-full);
  font-size: var(--md3-label-md);
  white-space: nowrap;
  font-weight: var(--md3-weight-semibold);
  letter-spacing: var(--md3-label-tracking);
}

h2 {
  font-family: var(--md3-font-headline);
  font-size: var(--md3-headline-sm);
  font-weight: var(--md3-weight-bold);
  margin-bottom: var(--md3-space-2);
  color: var(--md3-on-surface);
}

.price {
  font-family: var(--md3-font-headline);
  font-size: var(--md3-display-md);
  font-weight: var(--md3-weight-bold);
  color: var(--md3-on-surface);
  margin: 0 0 var(--md3-space-1);
  line-height: 1.1;
  letter-spacing: var(--md3-display-tracking);
}

.price span {
  font-size: var(--md3-body-md);
  color: var(--md3-on-surface-variant);
  font-weight: var(--md3-weight-regular);
}

.price-monthly-equiv {
  color: var(--md3-on-surface-variant);
  font-size: var(--md3-body-md);
  margin-bottom: var(--md3-space-2);
}

.savings-pill {
  display: inline-block;
  background: var(--md3-tertiary-container);
  color: var(--md3-on-tertiary-container);
  padding: 0.2rem var(--md3-space-3);
  border-radius: var(--md3-rounded-full);
  font-size: var(--md3-label-md);
  font-weight: var(--md3-weight-bold);
  margin-bottom: var(--md3-space-3);
}

.features {
  list-style: none;
  padding: 0;
  margin: var(--md3-space-3) 0;
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-2);
  color: var(--md3-on-surface);
  font-size: var(--md3-body-md);
}

.features li {
  display: flex;
  align-items: center;
  gap: var(--md3-space-2);
}

.feature-icon {
  font-size: 1rem !important;
  color: var(--md3-primary);
  flex-shrink: 0;
}

.trial-note {
  display: inline-flex;
  align-items: center;
  gap: var(--md3-space-1);
  font-size: var(--md3-body-md);
  color: var(--md3-primary);
  font-weight: var(--md3-weight-medium);
  margin-bottom: var(--md3-space-3);
}

.trial-note .material-symbols-outlined {
  font-size: 1rem;
}

.btn-upgrade {
  display: block;
  width: 100%;
  padding: 0.875rem var(--md3-space-3);
  border: none;
  border-radius: var(--md3-rounded-full);
  font-family: var(--md3-font-label);
  font-size: var(--md3-body-md);
  font-weight: var(--md3-weight-semibold);
  cursor: pointer;
  text-align: center;
  transition:
    background var(--md3-transition-fast),
    box-shadow var(--md3-transition-fast);
}

.btn-upgrade-trial {
  background: var(--md3-surface-container);
  color: var(--md3-on-surface);
  border: 1.5px solid var(--md3-outline-variant);
}

.btn-upgrade-trial:hover:not(:disabled) {
  background: var(--md3-surface-container-high);
  border-color: var(--md3-primary);
  color: var(--md3-primary);
}

.btn-upgrade-pro {
  background: var(--md3-gradient-cta);
  color: var(--md3-on-primary);
  box-shadow: var(--md3-shadow-card);
}

.btn-upgrade-pro:hover:not(:disabled) {
  background: var(--md3-gradient-cta-hover);
  box-shadow: var(--md3-shadow-elevated);
}

.btn-upgrade-yearly {
  background: var(--md3-surface-container-highest);
  color: var(--md3-on-surface);
  border: 1.5px solid var(--md3-outline-variant);
}

.btn-upgrade-yearly:hover:not(:disabled) {
  background: var(--md3-surface-container-high);
  color: var(--md3-primary);
  border-color: var(--md3-primary);
}

.btn-upgrade:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* ─── Trust signals ─── */
.trust-signals {
  display: flex;
  flex-wrap: wrap;
  gap: var(--md3-space-4);
  justify-content: center;
}

.trust-item {
  display: inline-flex;
  align-items: center;
  gap: var(--md3-space-1);
  font-size: var(--md3-label-lg);
  color: var(--md3-on-surface-variant);
}

.trust-item .material-symbols-outlined {
  font-size: 1.125rem;
  color: var(--md3-primary);
}
</style>