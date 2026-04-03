<template>
  <div class="app-layout">
    <!-- Skip to main content (T-030 a11y) -->
    <a href="#main-content" class="skip-to-content">Ir al contenido principal</a>

    <!-- Offline indicator — shows when offline or syncing (T-028) -->
    <OfflineIndicator :is-syncing="isSyncing" />

    <!-- Header -->
    <header class="app-header">
      <div class="header-content">
        <RouterLink to="/" class="logo">
          <span class="material-symbols-outlined logo-icon">eco</span>
          <span class="logo-text">Pakulab</span>
        </RouterLink>

        <nav class="header-nav">
          <RouterLink to="/foods">Alimentos</RouterLink>
          <RouterLink v-if="authStore.isAuthenticated" to="/plates">Mis platos</RouterLink>
          <RouterLink v-if="authStore.isAuthenticated" to="/diary">Bitácora</RouterLink>
          <RouterLink v-if="authStore.isPro" to="/menus">Menús</RouterLink>
        </nav>

        <div class="header-actions">
          <!-- Medical disclaimer icon — always visible (REQ-NFR-04) -->
          <button
            class="disclaimer-btn"
            @click="showDisclaimer = true"
            title="Aviso médico importante"
            aria-label="Ver aviso médico"
          >
            <span class="material-symbols-outlined">medical_services</span>
          </button>

          <!-- Auth actions -->
          <template v-if="!authStore.isAuthenticated">
            <RouterLink to="/auth/login" class="btn btn-ghost">Entrar</RouterLink>
            <RouterLink to="/auth/signup" class="btn btn-primary">Registrarse</RouterLink>
          </template>
          <template v-else>
            <!-- Tier badge — clickable -->
            <!-- FREE badge → link to /pricing -->
            <RouterLink
              v-if="!authStore.isPro && !authStore.isAnonymous"
              to="/pricing"
              class="tier-badge badge-free"
              title="Plan Gratuito — mejorá a Pro para más funciones"
              aria-label="Plan Gratuito. Tocá para ver planes"
            >Gratis</RouterLink>

            <!-- PRO badge — shows tooltip/info, no nav needed -->
            <span
              v-else-if="authStore.isPro"
              class="tier-badge badge-pro"
              :class="{ 'badge-past-due': billingStore.subscription?.status === 'PAST_DUE' }"
              :title="proTierTitle"
              aria-label="Plan Pro activo"
            >{{ proTierLabel }}</span>

            <!-- PAST_DUE warning dot on Pro badge -->
            <span
              v-if="billingStore.subscription?.status === 'PAST_DUE'"
              class="past-due-dot"
              title="Pago pendiente — actualizá tu método de pago"
              aria-hidden="true"
            >
              <span class="material-symbols-outlined">warning</span>
            </span>

            <!-- Anonymous badge — not clickable -->
            <span
              v-if="authStore.isAnonymous"
              class="tier-badge badge-anon"
              title="Sesión sin cuenta — creá una cuenta para guardar tu progreso"
            >Invitado</span>
            <RouterLink to="/profile" class="btn btn-ghost user-btn">
              <span class="user-avatar" aria-hidden="true">{{ userInitial }}</span>
              <span class="user-name">{{ authStore.displayName }}</span>
            </RouterLink>
            <button class="btn btn-ghost" @click="handleSignOut">Salir</button>
          </template>
        </div>
      </div>
    </header>

    <!-- Main content -->
    <main id="main-content" class="app-main">
      <slot />
    </main>

    <!-- Bottom navigation (mobile) -->
    <nav class="bottom-nav" aria-label="Navegación principal">
      <RouterLink to="/plate/new" class="bottom-nav-item" active-class="active">
        <span class="material-symbols-outlined bottom-nav-icon">restaurant</span>
        <span class="bottom-nav-label">Plato</span>
      </RouterLink>
      <RouterLink to="/foods" class="bottom-nav-item" active-class="active">
        <span class="material-symbols-outlined bottom-nav-icon">nutrition</span>
        <span class="bottom-nav-label">Alimentos</span>
      </RouterLink>
      <RouterLink to="/diary" class="bottom-nav-item" active-class="active" v-if="authStore.isAuthenticated">
        <span class="material-symbols-outlined bottom-nav-icon">auto_stories</span>
        <span class="bottom-nav-label">Bitácora</span>
      </RouterLink>
      <RouterLink to="/pricing" class="bottom-nav-item" active-class="active" v-if="!authStore.isPro">
        <span class="material-symbols-outlined bottom-nav-icon">star</span>
        <span class="bottom-nav-label">Pro</span>
      </RouterLink>
    </nav>

    <!-- Footer (legal links) -->
    <footer class="app-footer" aria-label="Pie de página">
      <div class="footer-content">
        <span class="footer-brand">
          <span class="material-symbols-outlined footer-brand-icon">eco</span>
          Pakulab — Alimentación Complementaria
        </span>
        <nav class="footer-links" aria-label="Links legales">
          <RouterLink to="/privacidad">Privacidad</RouterLink>
          <RouterLink to="/terminos">Términos</RouterLink>
          <RouterLink to="/pricing">Planes</RouterLink>
        </nav>
      </div>
    </footer>

    <!-- Medical Disclaimer Modal -->
    <div v-if="showDisclaimer" class="modal-overlay" @click="showDisclaimer = false">
      <div class="modal" @click.stop role="dialog" aria-modal="true" aria-label="Aviso médico">
        <div class="modal-header">
          <span class="material-symbols-outlined modal-header-icon">medical_services</span>
          <h2>Aviso Médico Importante</h2>
          <button class="modal-close-btn" @click="showDisclaimer = false" aria-label="Cerrar aviso médico">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
        <p>
          Esta aplicación es una <strong>herramienta informativa orientativa</strong>. 
          La información sobre alimentos astringentes y laxantes es de carácter general 
          y educativo.
        </p>
        <ul>
          <li>Esta app <strong>NO sustituye la consulta con tu pediatra</strong>.</li>
          <li>Las clasificaciones A/L son informativas, no diagnósticas.</li>
          <li>Consulta a tu profesional de salud ante cualquier duda.</li>
          <li>Cada bebé es único — lo que funciona para uno puede no funcionar para otro.</li>
        </ul>
        <button class="btn btn-primary" @click="showDisclaimer = false">Entendido</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/shared/stores/authStore.js'
import { useBillingStore } from '@/shared/stores/billingStore.js'
import OfflineIndicator from '@/shared/components/OfflineIndicator.vue'
import { getPendingCount, getPendingPlates, removeFromQueue } from '@/shared/services/syncQueue.js'
import { apiClient } from '@/shared/api/client.js'
const authStore = useAuthStore()
const billingStore = useBillingStore()
const showDisclaimer = ref(false)
const isSyncing = ref(false)

// ─── Sync queue flush ────────────────────────────────────────────────────────

/**
 * When connectivity is restored, attempt to flush any plates that were
 * saved offline. Each plate is sent in sequence; failures are silently
 * skipped so one bad plate doesn't block the rest.
 */
async function flushSyncQueue() {
  const pending = await getPendingPlates()
  if (!pending.length) return

  isSyncing.value = true
  for (const plate of pending) {
    try {
      await apiClient.post('/plates', {
        name: plate.name,
        groupCount: plate.groupCount,
        items: plate.items,
      })
      await removeFromQueue(plate.localId)
    } catch {
      // Leave it in queue — will retry on next online event
    }
  }
  isSyncing.value = false
}

// Watch for connectivity changes — flush queue when online
let flushTimeout: ReturnType<typeof setTimeout> | null = null

function onOnline() {
  // Small debounce — wait 1s before flushing (avoids spurious events)
  if (flushTimeout) clearTimeout(flushTimeout)
  flushTimeout = setTimeout(async () => {
    await flushSyncQueue()
  }, 1000)
}

onMounted(async () => {
  window.addEventListener('online', onOnline)
  // If already online and there are queued items (e.g. from a previous session),
  // flush them on startup.
  if (navigator.onLine) {
    const count = await getPendingCount()
    if (count > 0) await flushSyncQueue()
  }

  // Billing subscription check
  if (authStore.isPro && !billingStore.subscription) {
    await billingStore.fetchSubscription()
  }
})

// Pro tier badge label and tooltip
const proTierLabel = computed(() => {
  if (billingStore.subscription?.status === 'PAST_DUE') return 'Pro !'
  if (billingStore.subscription?.status === 'TRIALING') return 'Pro (prueba)'
  return 'Pro'
})

const proTierTitle = computed(() => {
  const sub = billingStore.subscription
  if (!sub) return 'Plan Pro activo'
  if (sub.status === 'PAST_DUE') return 'Pago fallido — actualizá tu método de pago'
  if (sub.status === 'TRIALING' && sub.trialEnd) {
    const date = new Date(sub.trialEnd).toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'long',
    })
    return `Período de prueba hasta el ${date}`
  }
  if (sub.currentPeriodEnd) {
    const date = new Date(sub.currentPeriodEnd).toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
    return `Próxima facturación: ${date}`
  }
  return 'Plan Pro activo'
})

// User avatar initial
const userInitial = computed(() => {
  const name = authStore.user?.name ?? authStore.user?.email ?? '?'
  return name.charAt(0).toUpperCase()
})

async function handleSignOut() {
  await authStore.signOut()
}
</script>

<style scoped>
/* ─── App Layout Shell ─── */
.app-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: var(--md3-surface);
}

/* ─── Skip to content (a11y — T-030) ─── */
.skip-to-content {
  position: absolute;
  top: -100%;
  left: 0;
  background: var(--md3-gradient-cta);
  color: var(--md3-on-primary);
  padding: var(--md3-space-2) var(--md3-space-3);
  font-size: var(--md3-label-lg);
  font-weight: var(--md3-weight-semibold);
  text-decoration: none;
  z-index: 9999;
  border-radius: 0 0 var(--md3-rounded-sm) 0;
  transition: top var(--md3-transition-fast);
}

.skip-to-content:focus {
  top: 0;
}

/* ─── Header — Glassmorphism ─── */
.app-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: var(--md3-glass-bg);
  backdrop-filter: var(--md3-glass-blur);
  -webkit-backdrop-filter: var(--md3-glass-blur);
  /* Ghost border fallback for non-supporting browsers — no-line rule compliant */
  border-bottom: 1px solid var(--md3-ghost-border);
  padding: 0 var(--md3-space-3);
}

.header-content {
  display: flex;
  align-items: center;
  gap: var(--md3-space-3);
  max-width: 1200px;
  margin: 0 auto;
  height: 60px;
}

/* ─── Logo ─── */
.logo {
  display: flex;
  align-items: center;
  gap: var(--md3-space-2);
  font-family: var(--md3-font-headline);
  font-weight: var(--md3-weight-bold);
  font-size: var(--md3-headline-sm);
  text-decoration: none;
  color: var(--md3-primary);
  flex-shrink: 0;
}

.logo-icon {
  font-size: 1.5rem;
  color: var(--md3-primary);
}

/* ─── Desktop Header Nav ─── */
.header-nav {
  display: none;
  gap: var(--md3-space-2);
}

.header-nav a {
  text-decoration: none;
  color: var(--md3-on-surface-variant);
  font-size: var(--md3-body-md);
  font-weight: var(--md3-weight-medium);
  padding: var(--md3-space-1) var(--md3-space-3);
  border-radius: var(--md3-rounded-full);
  transition: background var(--md3-transition-fast), color var(--md3-transition-fast);
}

.header-nav a:hover {
  background: var(--md3-surface-container-low);
  color: var(--md3-on-surface);
}

.header-nav a.router-link-active {
  background: var(--md3-primary-container);
  color: var(--md3-on-primary-container);
  font-weight: var(--md3-weight-semibold);
}

@media (min-width: 768px) {
  .header-nav { display: flex; }
}

/* ─── Header Actions ─── */
.header-actions {
  margin-left: auto;
  display: flex;
  gap: var(--md3-space-2);
  align-items: center;
}

/* ─── Medical disclaimer button ─── */
.disclaimer-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--md3-on-surface-variant);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--md3-space-1);
  border-radius: var(--md3-rounded-full);
  transition: background var(--md3-transition-fast), color var(--md3-transition-fast);
}

.disclaimer-btn:hover {
  background: var(--md3-surface-container);
  color: var(--md3-primary);
}

/* ─── Buttons ─── */
.btn {
  padding: var(--md3-space-2) var(--md3-space-3);
  border-radius: var(--md3-rounded-full);
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-lg);
  font-weight: var(--md3-weight-semibold);
  cursor: pointer;
  text-decoration: none;
  border: none;
  display: inline-flex;
  align-items: center;
  gap: var(--md3-space-1);
  transition: background var(--md3-transition-fast), opacity var(--md3-transition-fast);
  white-space: nowrap;
}

.btn-primary {
  background: var(--md3-gradient-cta);
  color: var(--md3-on-primary);
  box-shadow: var(--md3-shadow-card);
}

.btn-primary:hover {
  background: var(--md3-gradient-cta-hover);
  opacity: 0.92;
}

.btn-ghost {
  background: transparent;
  color: var(--md3-on-surface-variant);
}

.btn-ghost:hover {
  background: var(--md3-surface-container-low);
  color: var(--md3-on-surface);
}

/* ─── Main content ─── */
.app-main {
  flex: 1;
  padding: var(--md3-space-3);
  padding-bottom: 5rem; /* Room for fixed bottom nav */
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

@media (min-width: 768px) {
  .app-main {
    padding: var(--md3-space-4) var(--md3-space-6);
    padding-bottom: var(--md3-space-4);
  }
}

/* ─── Bottom Navigation — mobile only, Glassmorphism ─── */
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  background: var(--md3-glass-bg);
  backdrop-filter: var(--md3-glass-blur);
  -webkit-backdrop-filter: var(--md3-glass-blur);
  /* No top border — surface color shift provides visual separation */
  padding: var(--md3-space-2) var(--md3-space-2) calc(var(--md3-space-2) + env(safe-area-inset-bottom, 0px));
  z-index: 100;
  box-shadow: var(--md3-shadow-ambient);
}

@media (min-width: 768px) {
  .bottom-nav { display: none; }
}

.bottom-nav-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.15rem;
  text-decoration: none;
  color: var(--md3-on-surface-variant);
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-sm);
  font-weight: var(--md3-weight-medium);
  padding: var(--md3-space-1) var(--md3-space-2);
  border-radius: var(--md3-rounded-lg);
  transition: color var(--md3-transition-fast), background var(--md3-transition-fast);
}

.bottom-nav-item.active {
  color: var(--md3-on-primary-container);
  background: var(--md3-primary-container);
}

.bottom-nav-icon {
  font-size: 1.5rem !important;
  line-height: 1;
}

/* ─── Modal ─── */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(44, 47, 48, 0.4);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  padding: var(--md3-space-3);
}

.modal {
  background: var(--md3-surface-container-lowest);
  border-radius: var(--md3-rounded-lg);
  padding: var(--md3-space-6);
  max-width: 480px;
  width: 100%;
  box-shadow: var(--md3-shadow-elevated);
}

.modal-header {
  display: flex;
  align-items: center;
  gap: var(--md3-space-2);
  margin-bottom: var(--md3-space-3);
}

.modal-header-icon {
  font-size: 1.5rem !important;
  color: var(--md3-primary);
  flex-shrink: 0;
}

.modal-header h2 {
  margin: 0;
  flex: 1;
  font-family: var(--md3-font-headline);
  font-size: var(--md3-headline-sm);
  font-weight: var(--md3-weight-bold);
  color: var(--md3-on-surface);
  line-height: var(--md3-headline-line-height);
}

.modal-close-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--md3-on-surface-variant);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--md3-space-1);
  border-radius: var(--md3-rounded-full);
  flex-shrink: 0;
  transition: background var(--md3-transition-fast);
}

.modal-close-btn:hover {
  background: var(--md3-surface-container);
}

.modal p {
  color: var(--md3-on-surface-variant);
  font-size: var(--md3-body-md);
  line-height: var(--md3-body-line-height);
  margin-top: 0;
}

.modal ul {
  padding-left: 1.5rem;
  line-height: 1.8;
  color: var(--md3-on-surface-variant);
  font-size: var(--md3-body-md);
  margin-bottom: var(--md3-space-4);
}

/* ─── Tier badges ─── */
.tier-badge {
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-md);
  font-weight: var(--md3-weight-bold);
  padding: 0.2rem 0.6rem;
  border-radius: var(--md3-rounded-full);
  white-space: nowrap;
  flex-shrink: 0;
  letter-spacing: var(--md3-label-tracking);
}

.badge-pro {
  background: var(--md3-tertiary-container);
  color: var(--md3-on-tertiary-container);
}

.badge-free {
  background: var(--md3-primary-container);
  color: var(--md3-on-primary-container);
}

.badge-anon {
  background: var(--md3-surface-container-high);
  color: var(--md3-on-surface-variant);
}

.badge-past-due {
  background: var(--md3-error-container);
  color: var(--md3-on-error-container);
}

.past-due-dot {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  cursor: default;
  color: var(--md3-error);
}

/* Make the FREE badge look like a link (it IS a RouterLink) */
a.tier-badge {
  text-decoration: none;
  cursor: pointer;
  transition: opacity var(--md3-transition-fast);
}

a.tier-badge:hover {
  opacity: 0.85;
}

/* ─── User button ─── */
.user-btn {
  display: flex;
  align-items: center;
  gap: var(--md3-space-2);
  max-width: 140px;
}

.user-avatar {
  width: 28px;
  height: 28px;
  background: var(--md3-primary-container);
  color: var(--md3-on-primary-container);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--md3-label-md);
  font-weight: var(--md3-weight-bold);
  flex-shrink: 0;
}

.user-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: var(--md3-body-md);
  color: var(--md3-on-surface);
}

/* ─── Footer ─── */
.app-footer {
  background: var(--md3-surface-container-low);
  /* No top border — surface shift provides separation */
  padding: var(--md3-space-3);
  padding-bottom: 5.5rem; /* room for bottom nav on mobile */
}

@media (min-width: 768px) {
  .app-footer {
    padding-bottom: var(--md3-space-3);
  }
}

.footer-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--md3-space-2);
  max-width: 1200px;
  margin: 0 auto;
  font-size: var(--md3-label-md);
  color: var(--md3-on-surface-variant);
}

.footer-brand {
  font-family: var(--md3-font-label);
  font-weight: var(--md3-weight-semibold);
  color: var(--md3-on-surface-variant);
  display: flex;
  align-items: center;
  gap: var(--md3-space-1);
}

.footer-brand-icon {
  font-size: 1rem !important;
  color: var(--md3-primary);
}

.footer-links {
  display: flex;
  gap: var(--md3-space-3);
}

.footer-links a {
  color: var(--md3-on-surface-variant);
  text-decoration: none;
  font-size: var(--md3-label-md);
  transition: color var(--md3-transition-fast);
}

.footer-links a:hover {
  color: var(--md3-primary);
}
</style>
