<template>
  <div class="pricing-page">
    <h1>Planes y Precios</h1>
    <p class="subtitle">Elegí el plan que mejor se adapte a vos y a tu bebé</p>

    <!-- Past due warning banner -->
    <div v-if="isPastDue" class="alert-banner alert-warning" role="alert">
      <span class="material-symbols-outlined alert-icon" aria-hidden="true">warning</span>
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
        <span class="current-plan-badge">
          <span class="material-symbols-outlined" aria-hidden="true">check_circle</span>
          Plan activo
        </span>
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
          <span class="material-symbols-outlined" aria-hidden="true">card_giftcard</span>
          En período de prueba hasta {{ trialEndDate }}
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
      <!-- Gratis -->
      <div class="plan plan-free">
        <h2>Gratis</h2>
        <p class="price">$0 <span>MXN / mes</span></p>

        <ul class="features">
          <li v-for="feature in freeFeatures" :key="feature">
            <span class="material-symbols-outlined feature-icon" aria-hidden="true">check</span>
            {{ feature }}
          </li>
        </ul>

        <div class="btn-upgrade btn-upgrade-free btn-upgrade--disabled" aria-disabled="true">
          Plan actual
        </div>
      </div>

      <!-- Mensual -->
      <div class="plan plan-mensual">
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
          Prueba gratis 7 días
        </p>

        <button
          class="btn-upgrade btn-upgrade-pro"
          @click="handleCheckout(PRICE_MONTHLY)"
          :disabled="billingStore.loading"
        >
          {{ billingStore.loading ? 'Redirigiendo...' : 'Suscribirse mensual' }}
        </button>
      </div>

      <!-- Anual -->
      <div class="plan plan-anual">
        <h2>Pro Anual</h2>
        <p class="price">$799 <span>MXN / año</span></p>
        <p class="price-monthly-equiv">Equivale a $66 / mes</p>
        <div class="savings-pill">Ahorrás 33%</div>

        <ul class="features">
          <li v-for="feature in proFeatures" :key="feature">
            <span class="material-symbols-outlined feature-icon" aria-hidden="true">check</span>
            {{ feature }}
          </li>
        </ul>

        <p class="trial-note">
          <span class="material-symbols-outlined" aria-hidden="true">card_giftcard</span>
          Prueba gratis 7 días
        </p>

        <button
          class="btn-upgrade btn-upgrade-anual"
          @click="handleCheckout(PRICE_ANNUAL)"
          :disabled="billingStore.loading"
        >
          {{ billingStore.loading ? 'Redirigiendo...' : 'Suscribirse anual' }}
        </button>
      </div>
    </div>

    <!-- Trust signals -->
    <div class="trust-signals" aria-label="Señales de confianza">
      <span class="trust-item">
        <span class="material-symbols-outlined" aria-hidden="true">lock</span>
        Pago seguro con Stripe
      </span>
      <span class="trust-item">
        <span class="material-symbols-outlined" aria-hidden="true">payments</span>
        Precios en MXN
      </span>
      <span class="trust-item">
        <span class="material-symbols-outlined" aria-hidden="true">cancel</span>
        Cancelá cuando quieras
      </span>
    </div>

    <!-- Error -->
    <p v-if="billingStore.error" class="error-msg" role="alert">
      <span class="material-symbols-outlined" aria-hidden="true">error</span>
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
            <th class="pro-col">Pro
              <span class="material-symbols-outlined pro-star" aria-hidden="true">star</span>
            </th>
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

    <!-- FAQ -->
    <div class="faq">
      <h2>Preguntas frecuentes</h2>
      <div class="faq-item" v-for="item in faqItems" :key="item.q">
        <h3>{{ item.q }}</h3>
        <p>{{ item.a }}</p>
      </div>
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

const freeFeatures = [
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

const comparisonRows = [
  { feature: 'Constructor de platos', free: '✓', pro: '✓' },
  { feature: 'Catálogo de alimentos', free: '✓', pro: '✓' },
  { feature: 'Balance A/L en tiempo real', free: '✓', pro: '✓' },
  { feature: 'Platos guardados', free: 'Hasta 5', pro: 'Ilimitados' },
  { feature: 'Perfiles de bebé', free: '1', pro: 'Hasta 3' },
  { feature: 'Bitácora', free: 'Últimos 7 días', pro: 'Sin límite' },
  { feature: 'Reacciones en bitácora', free: '—', pro: '✓' },
  { feature: 'Fotos en bitácora', free: '—', pro: '✓' },
  { feature: 'Menú semanal', free: '—', pro: '✓' },
  { feature: 'Rastreador de alérgenos', free: '—', pro: '✓' },
  { feature: 'Export sin marca de agua', free: '—', pro: '✓' },
]

const faqItems = [
  {
    q: '¿Puedo cancelar en cualquier momento?',
    a: 'Sí. Podés cancelar tu suscripción desde tu perfil en cualquier momento. Seguís teniendo acceso Pro hasta el final del período ya pagado.',
  },
  {
    q: '¿Qué pasa con mis datos si cancelo?',
    a: 'Tus platos y bitácora se conservan. Solo perdés acceso a las funciones Pro.',
  },
  {
    q: '¿Los precios son en pesos mexicanos?',
    a: 'Sí, todos los precios son en MXN e incluyen IVA.',
  },
  {
    q: '¿Cómo funciona la prueba gratis?',
    a: 'Tenés 7 días gratis al suscribirte. No se cobra nada hasta que termina el período de prueba. Podés cancelar antes sin costo.',
  },
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
  letter-spacing: var(--md3-headline-tracking);
}

.subtitle {
  color: var(--md3-on-surface-variant);
  font-size: var(--md3-body-lg);
  margin-bottom: var(--md3-space-6);
}

/* ─── Alert banner ─── */
.alert-banner {
  display: flex;
  align-items: flex-start;
  gap: var(--md3-space-3);
  padding: var(--md3-space-3) var(--md3-space-4);
  border-radius: var(--md3-rounded-md);
  margin-bottom: var(--md3-space-4);
}

.alert-warning {
  background: var(--md3-tertiary-container);
  border: 1px solid var(--md3-tertiary-dim, var(--md3-tertiary));
  color: var(--md3-on-tertiary-container);
}

.alert-icon {
  font-size: 1.25rem;
  flex-shrink: 0;
  line-height: 1.5;
}

.btn-link {
  background: none;
  border: none;
  color: var(--md3-primary);
  text-decoration: underline;
  cursor: pointer;
  font-size: inherit;
  padding: 0;
  margin-left: var(--md3-space-1);
  font-weight: var(--md3-weight-semibold);
}

.btn-link:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* ─── Current plan card ─── */
.current-plan-card {
  border: 2px solid var(--md3-primary);
  border-radius: var(--md3-rounded-md);
  padding: var(--md3-space-4);
  margin-bottom: var(--md3-space-6);
  background: var(--md3-primary-container);
}

.current-plan-header {
  display: flex;
  align-items: center;
  gap: var(--md3-space-3);
  margin-bottom: var(--md3-space-2);
}

.current-plan-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--md3-space-1);
  font-weight: var(--md3-weight-bold);
  color: var(--md3-on-primary-container);
  font-size: var(--md3-body-lg);
}

.current-plan-badge .material-symbols-outlined {
  font-size: 1.125rem;
  color: var(--md3-primary);
}

.current-plan-interval {
  color: var(--md3-on-surface-variant);
  font-size: var(--md3-body-md);
  background: var(--md3-surface-container-lowest);
  padding: 0.2rem var(--md3-space-2);
  border-radius: var(--md3-rounded-full);
  border: 1px solid var(--md3-outline-variant);
}

.current-plan-details {
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-1);
  margin-bottom: var(--md3-space-3);
  font-size: var(--md3-body-md);
  color: var(--md3-on-surface-variant);
}

.next-billing strong {
  color: var(--md3-on-surface);
}

.cancel-note {
  color: var(--md3-error);
}

.trial-note-active {
  display: inline-flex;
  align-items: center;
  gap: var(--md3-space-1);
  color: var(--md3-primary);
  font-weight: var(--md3-weight-medium);
}

.trial-note-active .material-symbols-outlined {
  font-size: 1rem;
}

.btn-manage {
  padding: 0.625rem var(--md3-space-4);
  background: var(--md3-surface-container-lowest);
  color: var(--md3-primary);
  border: 2px solid var(--md3-primary);
  border-radius: var(--md3-rounded-full);
  font-weight: var(--md3-weight-semibold);
  cursor: pointer;
  font-size: var(--md3-body-md);
  transition: background var(--md3-transition-fast);
}

.btn-manage:hover {
  background: var(--md3-surface-container-low);
}

.btn-manage:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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

.plan-mensual {
  background: var(--md3-surface-container-lowest);
  border-color: var(--md3-primary);
  box-shadow: var(--md3-shadow-elevated);
}

.plan-anual {
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

.btn-upgrade-free {
  background: var(--md3-surface-container);
  color: var(--md3-on-surface-variant);
  border: 1.5px solid var(--md3-outline-variant);
}

.btn-upgrade--disabled {
  cursor: default;
  pointer-events: none;
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

.btn-upgrade-anual {
  background: var(--md3-surface-container-highest);
  color: var(--md3-on-surface);
  border: 1.5px solid var(--md3-outline-variant);
}

.btn-upgrade-anual:hover:not(:disabled) {
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
  margin-bottom: var(--md3-space-8);
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

/* ─── Error ─── */
.error-msg {
  display: flex;
  align-items: center;
  gap: var(--md3-space-2);
  color: var(--md3-on-error-container);
  background: var(--md3-error-container);
  border-radius: var(--md3-rounded-sm);
  padding: var(--md3-space-3) var(--md3-space-4);
  margin-bottom: var(--md3-space-3);
  font-size: var(--md3-body-md);
}

.error-msg .material-symbols-outlined {
  font-size: 1.125rem;
  flex-shrink: 0;
}

/* ─── Comparison table ─── */
.comparison {
  margin-top: var(--md3-space-8);
}

.comparison h2 {
  font-family: var(--md3-font-headline);
  font-size: var(--md3-headline-sm);
  font-weight: var(--md3-weight-bold);
  color: var(--md3-on-surface);
  margin-bottom: var(--md3-space-3);
}

.comparison-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--md3-body-md);
  border-radius: var(--md3-rounded-md);
  overflow: hidden;
}

.comparison-table th,
.comparison-table td {
  text-align: left;
  padding: var(--md3-space-2) var(--md3-space-3);
  border-bottom: 1px solid var(--md3-outline-variant);
}

.comparison-table th {
  font-weight: var(--md3-weight-semibold);
  color: var(--md3-on-surface);
  background: var(--md3-surface-container);
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-lg);
  letter-spacing: var(--md3-label-tracking);
}

.comparison-table td:nth-child(2),
.comparison-table td:nth-child(3) {
  text-align: center;
  color: var(--md3-on-surface-variant);
}

.pro-col {
  color: var(--md3-primary) !important;
  text-align: center !important;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--md3-space-1);
}

.pro-star {
  font-size: 1rem !important;
  color: var(--md3-primary);
}

.comparison-table tr:hover td {
  background: var(--md3-surface-container-low);
}

/* ─── FAQ ─── */
.faq {
  margin-top: var(--md3-space-8);
}

.faq h2 {
  font-family: var(--md3-font-headline);
  font-size: var(--md3-headline-sm);
  font-weight: var(--md3-weight-bold);
  color: var(--md3-on-surface);
  margin-bottom: var(--md3-space-4);
}

.faq-item {
  border-bottom: 1px solid var(--md3-outline-variant);
  padding: var(--md3-space-3) 0;
}

.faq-item:last-child {
  border-bottom: none;
}

.faq-item h3 {
  font-size: var(--md3-body-lg);
  font-weight: var(--md3-weight-semibold);
  color: var(--md3-on-surface);
  margin: 0 0 var(--md3-space-2);
}

.faq-item p {
  font-size: var(--md3-body-md);
  color: var(--md3-on-surface-variant);
  line-height: var(--md3-body-line-height);
  margin: 0;
}
</style>
