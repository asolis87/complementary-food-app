<template>
  <div class="plan-selection-page">
    <div class="welcome-header">
      <span class="material-symbols-outlined welcome-icon" aria-hidden="true">celebration</span>
      <h1>¡Bienvenido a Pakulab!</h1>
    </div>

    <p class="welcome-message">
      Tu <strong>prueba gratuita de 21 días</strong> ya está activa.
      Accede a todas las funciones Pro sin límites.
    </p>

    <!-- Error banner (only shown if trial creation failed during signup) -->
    <div v-if="billingStore.error" class="error-banner" role="alert">
      <span class="material-symbols-outlined error-banner__icon" aria-hidden="true">warning</span>
      No se pudo activar tu prueba automáticamente. 
      <router-link to="/pricing">Inicia tu prueba manualmente</router-link>
    </div>

    <!-- Features list -->
    <div class="features-section">
      <h2>¿Qué incluye tu prueba?</h2>
      <ul class="features">
        <li v-for="feature in trialFeatures" :key="feature">
          <span class="material-symbols-outlined feature-icon" aria-hidden="true">check_circle</span>
          <span>{{ feature }}</span>
        </li>
      </ul>
    </div>

    <!-- Single CTA -->
    <button
      class="btn-start-trial"
      @click="handleExplore"
    >
      <span class="material-symbols-outlined" aria-hidden="true">arrow_forward</span>
      Explorar Pakulab
    </button>

    <!-- Info text -->
    <p class="info-text">
      Después de los 21 días, puedes elegir un plan para seguir usando Pakulab.
    </p>
  </div>
</template>

<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'
import { useBillingStore } from '@/shared/stores/billingStore.js'

const billingStore = useBillingStore()
const router = useRouter()
const route = useRoute()

const trialFeatures = [
  'Constructor de platos ilimitados con indicador de balance A/L',
  'Hasta 3 perfiles de bebé',
  'Bitácora completa de alimentación',
  'Planificación de menús semanales',
  'Sin límites, sin marca de agua',
]

/**
 * Navigate to the app home (plates list).
 * User already has the trial from signup.
 */
function handleExplore(): void {
  const redirect = route.query.redirect as string | undefined
  void router.push(redirect ?? '/profile')
}
</script>

<style scoped>
.plan-selection-page {
  max-width: 640px;
  margin: 0 auto;
  padding: var(--md3-space-8) var(--md3-space-3) var(--md3-space-12);
}

/* ─── Welcome header ─── */

.welcome-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--md3-space-3);
  margin-bottom: var(--md3-space-4);
  text-align: center;
}

.welcome-icon {
  font-size: 4rem !important;
  color: var(--md3-primary);
}

h1 {
  font-family: var(--md3-font-headline);
  font-size: var(--md3-headline-md);
  font-weight: var(--md3-weight-bold);
  color: var(--md3-on-surface);
  margin: 0;
  letter-spacing: var(--md3-headline-tracking);
  text-align: center;
}

.welcome-message {
  color: var(--md3-on-surface-variant);
  font-size: var(--md3-body-lg);
  text-align: center;
  margin-bottom: var(--md3-space-6);
  line-height: var(--md3-body-line-height);
}

.welcome-message strong {
  color: var(--md3-primary);
  font-weight: var(--md3-weight-semibold);
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

.error-banner a {
  color: var(--md3-on-error-container);
  font-weight: var(--md3-weight-semibold);
  text-decoration: underline;
}

/* ─── Features section ─── */

.features-section {
  margin-bottom: var(--md3-space-6);
}

.features-section h2 {
  font-family: var(--md3-font-headline);
  font-size: var(--md3-headline-sm);
  font-weight: var(--md3-weight-semibold);
  color: var(--md3-on-surface);
  margin-bottom: var(--md3-space-4);
  text-align: center;
}

.features {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-3);
}

.features li {
  display: flex;
  align-items: flex-start;
  gap: var(--md3-space-2);
  color: var(--md3-on-surface);
  font-size: var(--md3-body-md);
  line-height: var(--md3-body-line-height);
}

.feature-icon {
  font-size: 1.25rem !important;
  color: var(--md3-primary);
  flex-shrink: 0;
  margin-top: 0.1rem;
}

/* ─── CTA button ─── */

.btn-start-trial {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--md3-space-2);
  width: 100%;
  padding: 1rem var(--md3-space-4);
  background: var(--md3-gradient-cta);
  color: var(--md3-on-primary);
  border: none;
  border-radius: var(--md3-rounded-full);
  font-family: var(--md3-font-label);
  font-size: var(--md3-body-lg);
  font-weight: var(--md3-weight-semibold);
  cursor: pointer;
  text-align: center;
  box-shadow: var(--md3-shadow-card);
  transition:
    background var(--md3-transition-fast),
    box-shadow var(--md3-transition-fast);
  margin-bottom: var(--md3-space-6);
}

.btn-start-trial:hover {
  background: var(--md3-gradient-cta-hover);
  box-shadow: var(--md3-shadow-elevated);
}

.btn-start-trial .material-symbols-outlined {
  font-size: 1.25rem;
}

/* ─── Info text ─── */

.info-text {
  color: var(--md3-on-surface-variant);
  font-size: var(--md3-body-sm);
  text-align: center;
  margin: 0;
  line-height: var(--md3-body-line-height);
}

/* ─── Responsive ─── */

@media (max-width: 430px) {
  .plan-selection-page {
    padding: var(--md3-space-6) var(--md3-space-3) var(--md3-space-8);
  }

  h1 {
    font-size: var(--md3-headline-sm);
  }

  .welcome-icon {
    font-size: 3.5rem !important;
  }

  .features {
    font-size: var(--md3-body-md);
  }
}
</style>