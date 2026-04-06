<template>
  <div class="paywall-page">
    <!-- Header -->
    <div class="paywall-header">
      <span class="material-symbols-outlined header-icon" aria-hidden="true">lock</span>
      <h1>Tu prueba gratuita ha terminado</h1>
    </div>

    <!-- Explanation -->
    <p class="paywall-explanation">
      Tu período de 21 días de prueba finalizó. Para seguir usando Pakulab y acceder a tus datos,
      elegí uno de los planes disponibles. Si no querés continuar, podés eliminar tu cuenta y todos tus datos.
    </p>

    <!-- Error banner -->
    <div v-if="billingStore.error" class="error-banner" role="alert">
      <span class="material-symbols-outlined error-banner__icon" aria-hidden="true">warning</span>
      {{ billingStore.error }}
    </div>

    <!-- Plan cards -->
    <div class="plans">
      <!-- Mensual -->
      <div class="plan plan-monthly">
        <h2>Pro Mensual</h2>
        <p class="price">${{ monthlyPrice }} <span>MXN / mes</span></p>

        <ul class="features">
          <li v-for="feature in proFeatures" :key="feature">
            <span class="material-symbols-outlined feature-icon" aria-hidden="true">check</span>
            {{ feature }}
          </li>
        </ul>

        <button
          class="btn-upgrade btn-upgrade-monthly"
          @click="handleSubscribe('PRO_MONTHLY')"
          :disabled="billingStore.loading"
        >
          {{ billingStore.loading && selectedPlan === 'PRO_MONTHLY' ? 'Procesando...' : 'Suscribirme' }}
        </button>
      </div>

      <!-- Anual -->
      <div class="plan plan-yearly">
        <div class="badge">Recomendado</div>
        <h2>Pro Anual</h2>
        <p class="price">${{ yearlyPrice }} <span>MXN / año</span></p>
        <p class="price-monthly-equiv">Equivale a ${{ yearlyMonthlyEquiv }} / mes</p>
        <div class="savings-pill">Ahorrá {{ savingsPercent }}%</div>

        <ul class="features">
          <li v-for="feature in proFeatures" :key="feature">
            <span class="material-symbols-outlined feature-icon" aria-hidden="true">check</span>
            {{ feature }}
          </li>
        </ul>

        <button
          class="btn-upgrade btn-upgrade-yearly"
          @click="handleSubscribe('PRO_YEARLY')"
          :disabled="billingStore.loading"
        >
          {{ billingStore.loading && selectedPlan === 'PRO_YEARLY' ? 'Procesando...' : 'Suscribirme' }}
        </button>
      </div>
    </div>

    <!-- Delete account section -->
    <div class="delete-section">
      <p class="delete-explanation">
        Si no querés continuar, podés eliminar tu cuenta y todos tus datos.
      </p>
      <button class="btn-delete" @click="showDeleteConfirmation = true">
        Eliminar mi cuenta
      </button>
    </div>

    <!-- Delete confirmation dialog -->
    <Teleport to="body">
      <div v-if="showDeleteConfirmation" class="dialog-overlay" @click="cancelDelete">
        <div class="dialog" @click.stop role="dialog" aria-modal="true" aria-labelledby="dialog-title">
          <h2 id="dialog-title">¿Eliminar tu cuenta?</h2>
          <p class="dialog-message">
            Esta acción es irreversible y se borrarán todos tus datos (perfiles de bebé, platos, bitácora, etc.).
          </p>
          <div class="dialog-actions">
            <button class="btn-cancel" @click="cancelDelete" :disabled="billingStore.loading">
              Cancelar
            </button>
            <button class="btn-confirm-delete" @click="handleDeleteAccount" :disabled="billingStore.loading">
              {{ billingStore.loading ? 'Eliminando...' : 'Sí, eliminar todo' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useBillingStore } from '@/shared/stores/billingStore.js'
import { useAuthStore } from '@/shared/stores/authStore.js'
import { PRICING } from '@pakulab/shared'

// ─── Stores ───────────────────────────────────────────────────────────────────

const billingStore = useBillingStore()
const authStore = useAuthStore()
const router = useRouter()

// ─── State ────────────────────────────────────────────────────────────────────

const selectedPlan = ref<'PRO_MONTHLY' | 'PRO_YEARLY' | null>(null)
const showDeleteConfirmation = ref(false)

// ─── Pricing from shared constants ─────────────────────────────────────────────

const monthlyPrice = PRICING.monthly.amountMxn / 100 // 99
const yearlyPrice = PRICING.yearly.amountMxn / 100 // 999
const yearlyMonthlyEquiv = Math.round(yearlyPrice / 12) // 83
const savingsPercent = PRICING.yearly.savingsPercent // 17

// ─── Features ──────────────────────────────────────────────────────────────────

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

// ─── Actions ──────────────────────────────────────────────────────────────────

async function handleSubscribe(plan: 'PRO_MONTHLY' | 'PRO_YEARLY'): Promise<void> {
  selectedPlan.value = plan
  billingStore.clearError()
  
  try {
    // Use Stripe Checkout for paid plans
    const priceId = plan === 'PRO_MONTHLY'
      ? import.meta.env['VITE_STRIPE_PRICE_MONTHLY'] as string
      : import.meta.env['VITE_STRIPE_PRICE_ANNUAL'] as string
    
    await billingStore.createCheckout(priceId)
    // createCheckout redirects to Stripe, so we don't need to navigate here
  } catch {
    // Error is displayed via billingStore.error
    selectedPlan.value = null
  }
}

function cancelDelete(): void {
  showDeleteConfirmation.value = false
}

async function handleDeleteAccount(): Promise<void> {
  billingStore.clearError()
  
  try {
    await billingStore.deleteAccount()
    await authStore.signOut()
    await router.push('/')
  } catch {
    // Error is displayed via billingStore.error
    showDeleteConfirmation.value = false
  }
}
</script>

<style scoped>
.paywall-page {
  min-height: 100vh;
  max-width: 960px;
  margin: 0 auto;
  padding: var(--md3-space-8) var(--md3-space-3) var(--md3-space-12);
  background: var(--md3-surface);
}

/* ─── Header ─── */

.paywall-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--md3-space-3);
  margin-bottom: var(--md3-space-4);
  text-align: center;
}

.header-icon {
  font-size: 3.5rem !important;
  color: var(--md3-error);
}

h1 {
  font-family: var(--md3-font-headline);
  font-size: var(--md3-headline-md);
  font-weight: var(--md3-weight-bold);
  color: var(--md3-on-surface);
  margin: 0;
  letter-spacing: var(--md3-headline-tracking);
}

.paywall-explanation {
  color: var(--md3-on-surface-variant);
  font-size: var(--md3-body-lg);
  text-align: center;
  margin-bottom: var(--md3-space-6);
  line-height: var(--md3-body-line-height);
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
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

/* ─── Plan cards ─── */

.plans {
  display: grid;
  gap: var(--md3-space-4);
  margin-bottom: var(--md3-space-8);
}

@media (min-width: 640px) {
  .plans {
    grid-template-columns: 1fr 1fr;
    align-items: start;
  }
}

.plan {
  background: var(--md3-surface-container-lowest);
  border: 1.5px solid var(--md3-outline-variant);
  border-radius: var(--md3-rounded-lg);
  padding: var(--md3-space-6);
  position: relative;
  transition: box-shadow var(--md3-transition-normal);
}

.plan-yearly {
  border-color: var(--md3-primary);
  box-shadow: var(--md3-shadow-elevated);
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

.btn-upgrade-monthly {
  background: var(--md3-surface-container-highest);
  color: var(--md3-on-surface);
  border: 1.5px solid var(--md3-outline-variant);
}

.btn-upgrade-monthly:hover:not(:disabled) {
  background: var(--md3-surface-container-high);
  color: var(--md3-primary);
  border-color: var(--md3-primary);
}

.btn-upgrade-yearly {
  background: var(--md3-gradient-cta);
  color: var(--md3-on-primary);
  box-shadow: var(--md3-shadow-card);
}

.btn-upgrade-yearly:hover:not(:disabled) {
  background: var(--md3-gradient-cta-hover);
  box-shadow: var(--md3-shadow-elevated);
}

.btn-upgrade:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* ─── Delete section ─── */

.delete-section {
  text-align: center;
  padding-top: var(--md3-space-8);
  border-top: 1px solid var(--md3-outline-variant);
}

.delete-explanation {
  color: var(--md3-on-surface-variant);
  font-size: var(--md3-body-md);
  margin-bottom: var(--md3-space-3);
}

.btn-delete {
  padding: 0.625rem var(--md3-space-4);
  background: transparent;
  color: var(--md3-error);
  border: 1px solid var(--md3-error);
  border-radius: var(--md3-rounded-full);
  font-family: var(--md3-font-label);
  font-size: var(--md3-body-md);
  font-weight: var(--md3-weight-medium);
  cursor: pointer;
  transition: background var(--md3-transition-fast);
}

.btn-delete:hover:not(:disabled) {
  background: var(--md3-error-container);
}

.btn-delete:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* ─── Dialog ─── */

.dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: var(--md3-space-3);
}

.dialog {
  background: var(--md3-surface-container-lowest);
  border-radius: var(--md3-rounded-lg);
  padding: var(--md3-space-6);
  max-width: 400px;
  width: 100%;
  box-shadow: var(--md3-shadow-elevated);
}

.dialog h2 {
  font-family: var(--md3-font-headline);
  font-size: var(--md3-headline-sm);
  font-weight: var(--md3-weight-bold);
  color: var(--md3-on-surface);
  margin: 0 0 var(--md3-space-3);
}

.dialog-message {
  color: var(--md3-on-surface-variant);
  font-size: var(--md3-body-md);
  line-height: var(--md3-body-line-height);
  margin-bottom: var(--md3-space-4);
}

.dialog-actions {
  display: flex;
  gap: var(--md3-space-3);
  justify-content: flex-end;
}

.btn-cancel {
  padding: 0.625rem var(--md3-space-4);
  background: var(--md3-surface-container);
  color: var(--md3-on-surface);
  border: 1px solid var(--md3-outline-variant);
  border-radius: var(--md3-rounded-full);
  font-family: var(--md3-font-label);
  font-size: var(--md3-body-md);
  font-weight: var(--md3-weight-medium);
  cursor: pointer;
  transition: background var(--md3-transition-fast);
}

.btn-cancel:hover:not(:disabled) {
  background: var(--md3-surface-container-high);
}

.btn-confirm-delete {
  padding: 0.625rem var(--md3-space-4);
  background: var(--md3-error);
  color: var(--md3-on-error);
  border: none;
  border-radius: var(--md3-rounded-full);
  font-family: var(--md3-font-label);
  font-size: var(--md3-body-md);
  font-weight: var(--md3-weight-semibold);
  cursor: pointer;
  transition: background var(--md3-transition-fast);
}

.btn-confirm-delete:hover:not(:disabled) {
  background: #9a1820;
}

.btn-cancel:disabled,
.btn-confirm-delete:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* ─── Responsive (430px mobile) ─── */

@media (max-width: 430px) {
  .paywall-page {
    padding: var(--md3-space-6) var(--md3-space-3) var(--md3-space-8);
  }

  .plans {
    gap: var(--md3-space-3);
  }

  .plan {
    padding: var(--md3-space-4);
  }

  .features {
    font-size: var(--md3-body-sm);
  }
}
</style>