<template>
  <div class="profile-page">
    <!-- Section 1: Baby Profile -->
    <section class="baby-profile-section">
      <!-- Page header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Perfil de bebé</h1>
          <p class="page-subtitle">
            {{ profileStore.profiles.length > 0 ? profileStore.profiles[0].name : 'Sin perfil' }}
          </p>
        </div>

        <!-- Add button — only when no profile exists (MVP: single profile) -->
        <button
          v-if="profileStore.profiles.length === 0"
          class="fab-btn"
          :disabled="profileStore.loading"
          @click="showForm = true"
        >
          <span class="material-symbols-outlined fab-btn__icon" aria-hidden="true">add</span>
          Agregar bebé
        </button>
      </div>

    <!-- Loading -->
    <div v-if="profileStore.loading && profileStore.profiles.length === 0" class="state-center">
      <div class="spinner" aria-hidden="true" />
      <p>Cargando perfiles...</p>
    </div>

    <!-- Tier gate: require FREE -->
    <TierGate required-tier="FREE" feature-name="crear perfiles de bebé">
      <!-- Add form (inline, shown when adding) -->
      <transition name="slide-down">
        <BabyProfileForm
          v-if="showForm && !editingProfile"
          ref="createFormRef"
          class="form-wrapper"
          @save="handleCreate"
          @cancel="showForm = false"
        />
      </transition>

      <!-- Edit form -->
      <transition name="slide-down">
        <BabyProfileForm
          v-if="editingProfile"
          ref="editFormRef"
          :profile="editingProfile"
          class="form-wrapper"
          @save="handleUpdate"
          @cancel="editingProfile = null"
        />
      </transition>

      <!-- Profile cards -->
      <ul
        v-if="profileStore.profiles.length > 0"
        class="profile-list"
        role="list"
        aria-label="Perfiles de bebé"
      >
        <li
          v-for="profile in profileStore.profiles"
          :key="profile.id"
          role="listitem"
        >
          <BabyProfileCard
            :profile="profile"
            @edit="startEdit"
            @delete="handleDelete"
          />
        </li>
      </ul>

      <!-- Empty state -->
      <div
        v-else-if="!profileStore.loading && !showForm"
        class="empty-state"
        role="status"
      >
        <span class="material-symbols-outlined empty-icon" aria-hidden="true">child_care</span>
        <h2 class="empty-title">No hay perfiles de bebé</h2>
        <p class="empty-subtitle">Creá el perfil de tu bebé para personalizar sus platos y hacer seguimiento de su alimentación.</p>
        <button class="create-btn" @click="showForm = true">
          Crear primer perfil
        </button>
      </div>

      <!-- Multi-profile coming soon (MVP: single profile only) -->
      <div v-if="profileStore.profiles.length > 0" class="coming-soon-banner" role="status">
        <span class="material-symbols-outlined coming-soon-icon" aria-hidden="true">construction</span>
        <div>
          <strong>Multi-perfiles en construcción</strong>
          <p>Pronto vas a poder agregar más de un bebé. Por ahora, el plato y la bitácora funcionan con un solo perfil.</p>
        </div>
      </div>
    </TierGate>
    </section>

    <!-- Section 2: Mi Cuenta (Account Management) -->
    <section v-if="authStore.isAuthenticated" class="account-section" aria-labelledby="account-title">
      <div class="section-header">
        <span class="material-symbols-outlined section-icon" aria-hidden="true">person</span>
        <h2 id="account-title" class="section-title">Mi Cuenta</h2>
      </div>

      <!-- Account info card -->
      <div class="account-card">
        <div class="account-info">
          <div class="info-row">
            <span class="info-label">Email</span>
            <span class="info-value">{{ authStore.user?.email ?? '—' }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Nombre</span>
            <span class="info-value">{{ authStore.displayName }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Plan</span>
            <span class="tier-badge" :class="tierBadgeClass">
              {{ tierBadgeLabel }}
            </span>
          </div>
        </div>
      </div>

      <!-- Subscription management -->
      <div class="subscription-row">
        <div class="subscription-info">
          <span class="subscription-label">Tu plan actual</span>
          <span class="subscription-plan">{{ subscriptionLabel }}</span>
        </div>
        <RouterLink v-if="authStore.isTrialing" to="/pricing" class="btn btn-outline">
          Ver planes
        </RouterLink>
        <RouterLink v-else-if="authStore.isTrialExpired" to="/paywall" class="btn btn-primary">
          Suscribirme
        </RouterLink>
        <RouterLink v-else to="/pricing" class="btn btn-outline">
          Gestionar suscripción
        </RouterLink>
      </div>

      <!-- Sign out button -->
      <button class="signout-btn" @click="handleSignOut" :disabled="signingOut">
        <span class="material-symbols-outlined" aria-hidden="true">logout</span>
        {{ signingOut ? 'Cerrando sesión...' : 'Cerrar sesión' }}
      </button>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import type { BabyProfile } from '@pakulab/shared'
import { useAuthStore } from '@/shared/stores/authStore.js'
import { useProfileStore } from '@/shared/stores/profileStore.js'
import TierGate from '@/shared/components/TierGate.vue'
import BabyProfileForm from './components/BabyProfileForm.vue'
import BabyProfileCard from './components/BabyProfileCard.vue'

const router = useRouter()
const authStore = useAuthStore()
const profileStore = useProfileStore()

// ─── State ────────────────────────────────────────────────────────────────
const showForm = ref(false)
const editingProfile = ref<BabyProfile | null>(null)
const createFormRef = ref<InstanceType<typeof BabyProfileForm> | null>(null)
const editFormRef = ref<InstanceType<typeof BabyProfileForm> | null>(null)
const signingOut = ref(false)

// ─── Computed: Trial-first model UI ───────────────────────────────────────
const tierBadgeClass = computed(() => {
  if (authStore.isTrialing) return 'badge-trial'
  if (authStore.isPro) return 'badge-pro'
  if (authStore.isTrialExpired) return 'badge-expired'
  return 'badge-free'
})

const tierBadgeLabel = computed(() => {
  if (authStore.isTrialing) {
    const days = authStore.trialDaysLeft
    return days > 0 ? `Prueba · ${days}d` : 'Prueba'
  }
  if (authStore.isPro) return 'Pro'
  if (authStore.isTrialExpired) return 'Expirado'
  return 'Sin plan'
})

const subscriptionLabel = computed(() => {
  if (authStore.isTrialing) {
    const days = authStore.trialDaysLeft
    if (days > 0) {
      return `Prueba gratuita (${days} ${days === 1 ? 'día' : 'días'} restante${days === 1 ? '' : 's'})`
    }
    return 'Prueba gratuita'
  }
  if (authStore.isPro) return 'Pro (suscripción activa)'
  if (authStore.isTrialExpired) return 'Período de prueba finalizado'
  return 'Sin plan activo'
})

// ─── Lifecycle ────────────────────────────────────────────────────────────
onMounted(async () => {
  await profileStore.fetchProfiles()
})

// ─── Handlers ─────────────────────────────────────────────────────────────
async function handleCreate(data: {
  name: string
  birthDate: string
  acStartDate?: string
  notes?: string
}) {
  try {
    await profileStore.createProfile(data)
    showForm.value = false
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error al crear el perfil'
    createFormRef.value?.setError(msg)
  }
}

function startEdit(profile: BabyProfile) {
  showForm.value = false
  editingProfile.value = profile
}

async function handleUpdate(data: {
  name: string
  birthDate: string
  acStartDate?: string
  notes?: string
}) {
  if (!editingProfile.value) return
  try {
    await profileStore.updateProfile(editingProfile.value.id, data)
    editingProfile.value = null
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error al actualizar el perfil'
    editFormRef.value?.setError(msg)
  }
}

async function handleDelete(id: string) {
  try {
    await profileStore.deleteProfile(id)
  } catch {
    // silent — profile not found, already deleted
  }
}

// ─── Account Handlers ─────────────────────────────────────────────────────
async function handleSignOut() {
  signingOut.value = true
  try {
    await authStore.signOut()
    await router.push({ name: 'login' })
  } finally {
    signingOut.value = false
  }
}
</script>

<style scoped>
.profile-page {
  max-width: 600px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-3);
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--md3-space-3);
}

.page-title {
  margin: 0;
  font-family: var(--md3-font-headline);
  font-size: var(--md3-headline-sm);
  font-weight: var(--md3-weight-bold);
  color: var(--md3-on-surface);
}

.page-subtitle {
  margin: var(--md3-space-1) 0 0;
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-sm);
  color: var(--md3-on-surface-variant);
}

.limit-reached {
  color: var(--md3-tertiary);
  font-weight: var(--md3-weight-semibold);
}

.fab-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--md3-space-2);
  padding: 0.65rem 1.1rem;
  background: var(--md3-primary);
  color: var(--md3-on-primary);
  border-radius: var(--md3-rounded-full);
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-lg);
  font-weight: var(--md3-weight-semibold);
  border: none;
  cursor: pointer;
  box-shadow: var(--md3-shadow-card);
  transition: background var(--md3-transition-fast), box-shadow var(--md3-transition-fast);
  white-space: nowrap;
  flex-shrink: 0;
}

.fab-btn__icon {
  font-size: 1.125rem;
  line-height: 1;
}

.fab-btn:hover:not(:disabled) {
  background: var(--md3-primary-dim);
  box-shadow: var(--md3-shadow-elevated);
}

.fab-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* State */
.state-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--md3-space-3);
  padding: var(--md3-space-12) 0;
  color: var(--md3-on-surface-variant);
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--md3-surface-container-high);
  border-top-color: var(--md3-primary);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Form wrapper */
.form-wrapper {
  margin-bottom: var(--md3-space-2);
}

/* Profiles list */
.profile-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-3);
}

/* Empty state */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--md3-space-3);
  padding: var(--md3-space-12) var(--md3-space-3);
  text-align: center;
  background: var(--md3-surface-container-lowest);
  border-radius: var(--md3-rounded-lg);
  border: 2px dashed var(--md3-outline-variant);
}

.empty-icon {
  font-size: 3.5rem;
  color: var(--md3-primary);
}

.empty-title {
  margin: 0;
  font-family: var(--md3-font-headline);
  font-size: var(--md3-headline-sm);
  font-weight: var(--md3-weight-bold);
  color: var(--md3-on-surface);
}

.empty-subtitle {
  margin: 0;
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-md);
  color: var(--md3-on-surface-variant);
  max-width: 300px;
}

.create-btn {
  display: inline-flex;
  padding: 0.7rem 1.5rem;
  background: var(--md3-primary);
  color: var(--md3-on-primary);
  border: none;
  border-radius: var(--md3-rounded-full);
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-lg);
  font-weight: var(--md3-weight-semibold);
  cursor: pointer;
  margin-top: var(--md3-space-2);
  box-shadow: var(--md3-shadow-card);
  transition: background var(--md3-transition-fast), box-shadow var(--md3-transition-fast);
}

.create-btn:hover {
  background: var(--md3-primary-dim);
  box-shadow: var(--md3-shadow-elevated);
}

/* Coming soon banner (MVP: single profile) */
.coming-soon-banner {
  display: flex;
  align-items: flex-start;
  gap: var(--md3-space-3);
  padding: var(--md3-space-3) var(--md3-space-4);
  background: var(--md3-surface-container);
  border-radius: var(--md3-rounded-md);
  border: 1px solid var(--md3-outline-variant);
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-md);
}

.coming-soon-icon {
  font-size: 1.5rem;
  color: var(--md3-on-surface-variant);
  flex-shrink: 0;
  margin-top: 0.1rem;
}

.coming-soon-banner div {
  flex: 1;
}

.coming-soon-banner strong {
  display: block;
  color: var(--md3-on-surface);
  font-weight: var(--md3-weight-semibold);
}

.coming-soon-banner p {
  margin: var(--md3-space-1) 0 0;
  color: var(--md3-on-surface-variant);
  font-size: var(--md3-body-sm);
}

/* Transitions */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all var(--md3-transition-normal);
}

.slide-down-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* ─── Account Section ─── */
.baby-profile-section {
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-3);
}

.account-section {
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-3);
  padding-top: var(--md3-space-6);
  border-top: 1px solid var(--md3-outline-variant);
  margin-top: var(--md3-space-4);
}

.section-header {
  display: flex;
  align-items: center;
  gap: var(--md3-space-2);
}

.section-icon {
  font-size: 1.5rem;
  color: var(--md3-primary);
}

.section-title {
  margin: 0;
  font-family: var(--md3-font-headline);
  font-size: var(--md3-headline-sm);
  font-weight: var(--md3-weight-bold);
  color: var(--md3-on-surface);
}

.account-card {
  background: var(--md3-surface-container-lowest);
  border-radius: var(--md3-rounded-lg);
  box-shadow: var(--md3-shadow-card);
  padding: var(--md3-space-4);
}

.account-info {
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-3);
}

.info-row {
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-1);
}

.info-label {
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-md);
  font-weight: var(--md3-weight-medium);
  color: var(--md3-on-surface-variant);
  text-transform: uppercase;
  letter-spacing: var(--md3-label-tracking);
}

.info-value {
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-md);
  color: var(--md3-on-surface);
}

.tier-badge {
  display: inline-flex;
  align-items: center;
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-md);
  font-weight: var(--md3-weight-bold);
  padding: 0.25rem 0.75rem;
  border-radius: var(--md3-rounded-full);
  width: fit-content;
}

.badge-pro {
  background: var(--md3-tertiary-container);
  color: var(--md3-on-tertiary-container);
}

.badge-free {
  background: var(--md3-primary-container);
  color: var(--md3-on-primary-container);
}

.badge-trial {
  background: var(--md3-secondary-container);
  color: var(--md3-on-secondary-container);
}

.badge-expired {
  background: var(--md3-error-container);
  color: var(--md3-on-error-container);
}

.subscription-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--md3-space-3);
  padding: var(--md3-space-3) var(--md3-space-4);
  background: var(--md3-surface-container-low);
  border-radius: var(--md3-rounded-md);
}

.subscription-info {
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-1);
}

.subscription-label {
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-sm);
  color: var(--md3-on-surface-variant);
}

.subscription-plan {
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-md);
  font-weight: var(--md3-weight-semibold);
  color: var(--md3-on-surface);
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--md3-space-1);
  padding: var(--md3-space-2) var(--md3-space-4);
  border-radius: var(--md3-rounded-full);
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-lg);
  font-weight: var(--md3-weight-semibold);
  text-decoration: none;
  border: none;
  cursor: pointer;
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
  opacity: 0.95;
}

.btn-outline {
  background: transparent;
  color: var(--md3-primary);
  border: 1px solid var(--md3-outline);
}

.btn-outline:hover {
  background: var(--md3-surface-container-low);
}

.signout-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--md3-space-2);
  width: 100%;
  padding: var(--md3-space-3) var(--md3-space-4);
  background: var(--md3-error-container);
  color: var(--md3-on-error-container);
  border: none;
  border-radius: var(--md3-rounded-lg);
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-lg);
  font-weight: var(--md3-weight-semibold);
  cursor: pointer;
  transition: opacity var(--md3-transition-fast);
}

.signout-btn:hover:not(:disabled) {
  opacity: 0.9;
}

.signout-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.signout-btn .material-symbols-outlined {
  font-size: 1.25rem;
}
</style>
