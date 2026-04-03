<template>
  <div class="profile-page">
    <!-- Page header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Perfiles de bebé</h1>
        <p class="page-subtitle" :class="{ 'limit-reached': atLimit }">
          {{ profileStore.profiles.length }} / {{ profileLimit }} bebés
          <span v-if="atLimit"> — límite alcanzado</span>
        </p>
      </div>

      <!-- Add button — gated by tier and limit -->
      <button
        v-if="!atLimit"
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

      <!-- Pro upsell if at limit and not pro -->
      <div v-if="atLimit && !authStore.isPro" class="upsell-banner" role="complementary">
        <span class="material-symbols-outlined upsell-icon" aria-hidden="true">workspace_premium</span>
        <div>
          <strong>Límite de perfiles alcanzado</strong>
          <p>Con Pro podés tener hasta 3 perfiles y mucho más.</p>
        </div>
        <RouterLink to="/pricing" class="upsell-btn">Ver Pro</RouterLink>
      </div>
    </TierGate>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { BabyProfile } from '@pakulab/shared'
import { BABY_PROFILE_LIMITS } from '@pakulab/shared'
import { useAuthStore } from '@/shared/stores/authStore.js'
import { useProfileStore } from '@/shared/stores/profileStore.js'
import TierGate from '@/shared/components/TierGate.vue'
import BabyProfileForm from './components/BabyProfileForm.vue'
import BabyProfileCard from './components/BabyProfileCard.vue'

const authStore = useAuthStore()
const profileStore = useProfileStore()

// ─── State ────────────────────────────────────────────────────────────────
const showForm = ref(false)
const editingProfile = ref<BabyProfile | null>(null)
const createFormRef = ref<InstanceType<typeof BabyProfileForm> | null>(null)
const editFormRef = ref<InstanceType<typeof BabyProfileForm> | null>(null)

// ─── Computed ─────────────────────────────────────────────────────────────
const profileLimit = computed(() => BABY_PROFILE_LIMITS[authStore.tier])
const atLimit = computed(
  () => profileStore.profiles.length >= profileLimit.value,
)

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

/* Upsell */
.upsell-banner {
  display: flex;
  align-items: center;
  gap: var(--md3-space-3);
  padding: var(--md3-space-3) var(--md3-space-4);
  background: var(--md3-tertiary-container);
  border-radius: var(--md3-rounded-md);
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-md);
}

.upsell-icon {
  font-size: 1.5rem;
  color: var(--md3-on-tertiary-container);
  flex-shrink: 0;
}

.upsell-banner div {
  flex: 1;
}

.upsell-banner strong {
  display: block;
  color: var(--md3-on-tertiary-container);
  font-weight: var(--md3-weight-semibold);
}

.upsell-banner p {
  margin: var(--md3-space-1) 0 0;
  color: var(--md3-on-tertiary-container);
  font-size: var(--md3-body-sm);
}

.upsell-btn {
  flex-shrink: 0;
  padding: 0.5rem 1rem;
  background: var(--md3-tertiary);
  color: var(--md3-on-tertiary);
  border-radius: var(--md3-rounded-sm);
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-lg);
  font-weight: var(--md3-weight-semibold);
  text-decoration: none;
  transition: opacity var(--md3-transition-fast);
}

.upsell-btn:hover {
  opacity: 0.88;
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
</style>
