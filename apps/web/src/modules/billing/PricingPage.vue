<template>
  <div class="pricing-page">
    <h1>Planes y Precios</h1>
    <p class="subtitle">Elegí el plan que mejor se adapte a vos y a tu bebé</p>

    <!-- Past due warning banner -->
    <div v-if="isPastDue" class="alert-banner alert-warning" role="alert">
      <span class="alert-icon">⚠️</span>
      <div>
        <strong>Tu pago falló.</strong>
        Actualizá tu método de pago para no perder acceso Pro.
        <button class="btn-link" @click="handleOpenPortal" :disabled="billingStore.loading">
          Administrar suscripción →
        </button>
      </div>
    </div>

    <!-- Currently subscribed — show status -->
    <div v-if="isSubscribed && !isPastDue" class="current-plan-card">
      <div class="current-plan-header">
        <span class="current-plan-badge">✅ Plan activo</span>
        <span class="current-plan-interval">{{ intervalLabel }}</span>
      </div>
      <div class="current-plan-details">
        <span v-if="nextBillingDate" class="next-billing">
          Próxima facturación: <strong>{{ nextBillingDate }}</strong>
        </span>
        <span v-if="subscription?.cancelAtPeriodEnd" class="cancel-note">
          Tu suscripción se cancelará al final del período actual.
        </span>
        <span v-if="isTrialing && trialEndDate" class="trial-note-active">
          🎁 En período de prueba hasta {{ trialEndDate }}
        </span>
      </div>
      <button
        class="btn-manage"
        @click="handleOpenPortal"
        :disabled="billingStore.loading"
      >
        {{ billingStore.loading ? 'Cargando...' : 'Administrar suscripción' }}
      </button>
    </div>

    <!-- Pricing cards -->
    <div v-if="!isSubscribed || isPastDue" class="plans">
      <!-- Mensual -->
      <div class="plan">
        <h2>Mensual</h2>
        <p class="price">$99 <span>MXN / mes</span></p>

        <ul class="features">
          <li v-for="feature in proFeatures" :key="feature">✅ {{ feature }}</li>
        </ul>

        <p class="trial-note">🎁 Prueba gratis 7 días</p>

        <button
          class="btn-upgrade"
          @click="handleCheckout(PRICE_MONTHLY)"
          :disabled="billingStore.loading"
        >
          {{ billingStore.loading ? 'Redirigiendo...' : 'Suscribirse mensual' }}
        </button>
      </div>

      <!-- Anual -->
      <div class="plan plan-pro">
        <div class="badge">Más popular</div>
        <h2>Anual</h2>
        <p class="price">$799 <span>MXN / año</span></p>
        <p class="price-monthly-equiv">Equivale a $66 / mes</p>
        <div class="savings-pill">Ahorrás 33%</div>

        <ul class="features">
          <li v-for="feature in proFeatures" :key="feature">✅ {{ feature }}</li>
        </ul>

        <p class="trial-note">🎁 Prueba gratis 7 días</p>

        <button
          class="btn-upgrade btn-upgrade-pro"
          @click="handleCheckout(PRICE_ANNUAL)"
          :disabled="billingStore.loading"
        >
          {{ billingStore.loading ? 'Redirigiendo...' : 'Suscribirse anual' }}
        </button>
      </div>
    </div>

    <!-- Error -->
    <p v-if="billingStore.error" class="error-msg" role="alert">
      {{ billingStore.error }}
    </p>

    <!-- Free vs Pro comparison -->
    <div class="comparison">
      <h2>¿Qué incluye cada plan?</h2>
      <table class="comparison-table" role="table">
        <thead>
          <tr>
            <th>Función</th>
            <th>Gratis</th>
            <th>Pro ⭐</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in comparisonRows" :key="row.feature">
            <td>{{ row.feature }}</td>
            <td>{{ row.free }}</td>
            <td>{{ row.pro }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useBillingStore } from '@/shared/stores/billingStore.js'
import { useAuthStore } from '@/shared/stores/authStore.js'

// ─── Constants ──────────────────────────────────────────────────────────────

const PRICE_MONTHLY = import.meta.env['VITE_STRIPE_PRICE_MONTHLY'] as string | undefined ?? ''
const PRICE_ANNUAL = import.meta.env['VITE_STRIPE_PRICE_ANNUAL'] as string | undefined ?? ''

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

const comparisonRows = [
  { feature: 'Constructor de platos', free: '✅', pro: '✅' },
  { feature: 'Catálogo de alimentos', free: '✅', pro: '✅' },
  { feature: 'Balance A/L en tiempo real', free: '✅', pro: '✅' },
  { feature: 'Platos guardados', free: 'Hasta 5', pro: 'Ilimitados' },
  { feature: 'Perfiles de bebé', free: '1', pro: 'Hasta 3' },
  { feature: 'Bitácora', free: 'Últimos 7 días', pro: 'Sin límite' },
  { feature: 'Reacciones en bitácora', free: '❌', pro: '✅' },
  { feature: 'Fotos en bitácora', free: '❌', pro: '✅' },
  { feature: 'Menú semanal', free: '❌', pro: '✅' },
  { feature: 'Rastreador de alérgenos', free: '❌', pro: '✅' },
  { feature: 'Export sin marca de agua', free: '❌', pro: '✅' },
]

// ─── Stores ─────────────────────────────────────────────────────────────────

const billingStore = useBillingStore()
const authStore = useAuthStore()

// ─── Computed ────────────────────────────────────────────────────────────────

const subscription = computed(() => billingStore.subscription)

const isSubscribed = computed(() =>
  authStore.isPro ||
  (subscription.value !== null &&
    (subscription.value.status === 'ACTIVE' || subscription.value.status === 'TRIALING')),
)

const isTrialing = computed(() => subscription.value?.status === 'TRIALING')

const isPastDue = computed(() => subscription.value?.status === 'PAST_DUE')

const intervalLabel = computed(() =>
  subscription.value?.interval === 'YEARLY' ? 'Anual' : 'Mensual',
)

const nextBillingDate = computed(() => {
  const date = subscription.value?.currentPeriodEnd
  if (!date) return null
  return new Date(date).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
})

const trialEndDate = computed(() => {
  const date = subscription.value?.trialEnd
  if (!date) return null
  return new Date(date).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
})

// ─── Actions ─────────────────────────────────────────────────────────────────

async function handleCheckout(priceId: string): Promise<void> {
  if (!authStore.isAuthenticated) {
    // If not logged in, redirect to signup first
    window.location.href = '/auth/signup?redirect=/pricing'
    return
  }
  billingStore.clearError()
  await billingStore.createCheckout(priceId)
}

async function handleOpenPortal(): Promise<void> {
  billingStore.clearError()
  await billingStore.openPortal()
}

// ─── Lifecycle ────────────────────────────────────────────────────────────────

onMounted(async () => {
  if (authStore.isAuthenticated) {
    await billingStore.fetchSubscription()
  }
})
</script>

<style scoped>
.pricing-page {
  max-width: 900px;
  margin: 0 auto;
  padding: 1rem;
}

h1 {
  font-size: 1.75rem;
  font-weight: 800;
  color: #111827;
  margin-bottom: 0.5rem;
}

.subtitle {
  color: #6b7280;
  margin-bottom: 2rem;
}

/* Alert banner */
.alert-banner {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  border-radius: 0.75rem;
  margin-bottom: 1.5rem;
}

.alert-warning {
  background: #fef3c7;
  border: 1px solid #fbbf24;
  color: #78350f;
}

.alert-icon { font-size: 1.25rem; flex-shrink: 0; }

.btn-link {
  background: none;
  border: none;
  color: #16a34a;
  text-decoration: underline;
  cursor: pointer;
  font-size: inherit;
  padding: 0;
  margin-left: 0.25rem;
}

.btn-link:disabled { opacity: 0.6; cursor: not-allowed; }

/* Current plan card */
.current-plan-card {
  border: 2px solid #16a34a;
  border-radius: 1rem;
  padding: 1.5rem;
  margin-bottom: 2rem;
  background: #f0fdf4;
}

.current-plan-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.current-plan-badge {
  font-weight: 700;
  color: #15803d;
  font-size: 1rem;
}

.current-plan-interval {
  color: #6b7280;
  font-size: 0.875rem;
  background: white;
  padding: 0.2rem 0.6rem;
  border-radius: 9999px;
  border: 1px solid #d1fae5;
}

.current-plan-details {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-bottom: 1rem;
  font-size: 0.875rem;
  color: #374151;
}

.next-billing strong { color: #111827; }

.cancel-note { color: #dc2626; }

.trial-note-active { color: #16a34a; font-weight: 500; }

.btn-manage {
  padding: 0.625rem 1.25rem;
  background: white;
  color: #16a34a;
  border: 2px solid #16a34a;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  font-size: 0.875rem;
}

.btn-manage:hover { background: #f0fdf4; }
.btn-manage:disabled { opacity: 0.6; cursor: not-allowed; }

/* Pricing cards */
.plans {
  display: grid;
  gap: 1.5rem;
  margin-bottom: 2.5rem;
}

@media (min-width: 640px) {
  .plans { grid-template-columns: 1fr 1fr; }
}

.plan {
  border: 2px solid #e5e7eb;
  border-radius: 1rem;
  padding: 2rem;
  position: relative;
}

.plan-pro {
  border-color: #16a34a;
  box-shadow: 0 4px 24px rgba(22, 163, 74, 0.12);
}

.badge {
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  background: #16a34a;
  color: white;
  padding: 0.25rem 1rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  white-space: nowrap;
  font-weight: 600;
}

h2 {
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  color: #111827;
}

.price {
  font-size: 2.25rem;
  font-weight: 800;
  color: #111827;
  margin: 0 0 0.25rem;
}

.price span {
  font-size: 1rem;
  color: #6b7280;
  font-weight: 400;
}

.price-monthly-equiv {
  color: #6b7280;
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
}

.savings-pill {
  display: inline-block;
  background: #fef3c7;
  color: #92400e;
  padding: 0.2rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 700;
  margin-bottom: 1rem;
}

.features {
  list-style: none;
  padding: 0;
  margin: 1rem 0;
  line-height: 2;
  color: #374151;
  font-size: 0.9rem;
}

.trial-note {
  font-size: 0.875rem;
  color: #16a34a;
  font-weight: 500;
  margin-bottom: 1rem;
}

.btn-upgrade {
  width: 100%;
  padding: 0.875rem;
  background: #374151;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-size: 1rem;
  cursor: pointer;
  font-weight: 600;
  transition: background 0.15s;
}

.btn-upgrade:hover { background: #1f2937; }
.btn-upgrade:disabled { opacity: 0.6; cursor: not-allowed; }

.btn-upgrade-pro {
  background: #16a34a;
}

.btn-upgrade-pro:hover { background: #15803d; }

/* Error */
.error-msg {
  color: #dc2626;
  background: #fef2f2;
  border: 1px solid #fca5a5;
  border-radius: 0.5rem;
  padding: 0.75rem 1rem;
  margin-bottom: 1rem;
  font-size: 0.875rem;
}

/* Comparison table */
.comparison {
  margin-top: 3rem;
}

.comparison h2 {
  font-size: 1.25rem;
  margin-bottom: 1rem;
}

.comparison-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.comparison-table th,
.comparison-table td {
  text-align: left;
  padding: 0.625rem 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.comparison-table th {
  font-weight: 700;
  color: #374151;
  background: #f9fafb;
}

.comparison-table td:nth-child(2),
.comparison-table td:nth-child(3) {
  text-align: center;
}

.comparison-table th:nth-child(3) {
  color: #16a34a;
  text-align: center;
}

.comparison-table tr:hover td {
  background: #f9fafb;
}
</style>
