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
          <span class="logo-icon">🥦</span>
          <span class="logo-text">CFA</span>
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
            ⚕️
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
            >⚠️</span>

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
        <span class="bottom-nav-icon">🍽️</span>
        <span class="bottom-nav-label">Plato</span>
      </RouterLink>
      <RouterLink to="/foods" class="bottom-nav-item" active-class="active">
        <span class="bottom-nav-icon">🥕</span>
        <span class="bottom-nav-label">Alimentos</span>
      </RouterLink>
      <RouterLink to="/diary" class="bottom-nav-item" active-class="active" v-if="authStore.isAuthenticated">
        <span class="bottom-nav-icon">📔</span>
        <span class="bottom-nav-label">Bitácora</span>
      </RouterLink>
      <RouterLink to="/pricing" class="bottom-nav-item" active-class="active" v-if="!authStore.isPro">
        <span class="bottom-nav-icon">⭐</span>
        <span class="bottom-nav-label">Pro</span>
      </RouterLink>
    </nav>

    <!-- Footer (legal links) -->
    <footer class="app-footer" aria-label="Pie de página">
      <div class="footer-content">
        <span class="footer-brand">🥦 CFA — Alimentación Complementaria</span>
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
        <h2>⚕️ Aviso Médico Importante</h2>
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
  if (billingStore.subscription?.status === 'PAST_DUE') return 'Pro ⚠️'
  if (billingStore.subscription?.status === 'TRIALING') return 'Pro (prueba)'
  return 'Pro ⭐'
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
.app-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.app-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: white;
  border-bottom: 1px solid #e5e7eb;
  padding: 0 1rem;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 1rem;
  max-width: 1200px;
  margin: 0 auto;
  height: 60px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: bold;
  font-size: 1.25rem;
  text-decoration: none;
  color: #16a34a;
}

.header-nav {
  display: none;
  gap: 1.5rem;
}

.header-nav a {
  text-decoration: none;
  color: #374151;
  font-size: 0.9rem;
}

@media (min-width: 768px) {
  .header-nav { display: flex; }
}

.header-actions {
  margin-left: auto;
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.disclaimer-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.2rem;
  padding: 0.25rem;
}

.btn {
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  cursor: pointer;
  text-decoration: none;
  border: none;
}

.btn-primary {
  background: #16a34a;
  color: white;
}

.btn-ghost {
  background: transparent;
  color: #374151;
}

.app-main {
  flex: 1;
  padding: 1rem;
  padding-bottom: 5rem; /* Room for bottom nav */
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

/* Bottom navigation — mobile only */
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  background: white;
  border-top: 1px solid #e5e7eb;
  padding: 0.5rem 0;
  z-index: 100;
}

@media (min-width: 768px) {
  .bottom-nav { display: none; }
}

.bottom-nav-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
  text-decoration: none;
  color: #6b7280;
  font-size: 0.7rem;
}

.bottom-nav-item.active {
  color: #16a34a;
}

.bottom-nav-icon { font-size: 1.3rem; }

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  padding: 1rem;
}

.modal {
  background: white;
  border-radius: 1rem;
  padding: 2rem;
  max-width: 480px;
  width: 100%;
}

.modal h2 { margin-top: 0; }
.modal ul { padding-left: 1.5rem; line-height: 1.8; }

/* Tier badge */
.tier-badge {
  font-size: 0.7rem;
  font-weight: 700;
  padding: 0.2rem 0.55rem;
  border-radius: 9999px;
  white-space: nowrap;
  flex-shrink: 0;
}

.badge-pro {
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  color: #78350f;
}

.badge-free {
  background: #ecfdf5;
  color: #059669;
  border: 1px solid #6ee7b7;
}

.badge-anon {
  background: #f3f4f6;
  color: #6b7280;
}

.badge-past-due {
  background: linear-gradient(135deg, #fca5a5, #f87171);
  color: #7f1d1d;
}

.past-due-dot {
  font-size: 0.85rem;
  flex-shrink: 0;
  cursor: default;
}

/* Skip to content (T-030) */
.skip-to-content {
  position: absolute;
  top: -100%;
  left: 0;
  background: #16a34a;
  color: white;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  text-decoration: none;
  z-index: 9999;
  border-radius: 0 0 0.5rem 0;
}

.skip-to-content:focus {
  top: 0;
}

/* Footer */
.app-footer {
  background: #f9fafb;
  border-top: 1px solid #e5e7eb;
  padding: 1rem;
  padding-bottom: 5.5rem; /* room for bottom nav on mobile */
}

@media (min-width: 768px) {
  .app-footer {
    padding-bottom: 1rem;
  }
}

.footer-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.5rem;
  max-width: 1200px;
  margin: 0 auto;
  font-size: 0.75rem;
  color: #9ca3af;
}

.footer-brand {
  font-weight: 600;
  color: #6b7280;
}

.footer-links {
  display: flex;
  gap: 1rem;
}

.footer-links a {
  color: #6b7280;
  text-decoration: none;
  transition: color 0.15s;
}

.footer-links a:hover {
  color: #16a34a;
}

/* Make the FREE badge look like a link (it IS a RouterLink) */
a.tier-badge {
  text-decoration: none;
  cursor: pointer;
}

a.tier-badge:hover {
  opacity: 0.85;
}

/* User button */
.user-btn {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  max-width: 140px;
}

.user-avatar {
  width: 26px;
  height: 26px;
  background: #10b981;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
  flex-shrink: 0;
}

.user-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.8rem;
}
</style>
