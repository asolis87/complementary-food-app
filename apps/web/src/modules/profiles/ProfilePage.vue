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
        <span aria-hidden="true">+</span>
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
        <span class="empty-icon" aria-hidden="true">👶</span>
        <h2 class="empty-title">No hay perfiles de bebé</h2>
        <p class="empty-subtitle">Creá el perfil de tu bebé para personalizar sus platos y hacer seguimiento de su alimentación.</p>
        <button class="create-btn" @click="showForm = true">
          Crear primer perfil
        </button>
      </div>

      <!-- Pro upsell if at limit and not pro -->
      <div v-if="atLimit && !authStore.isPro" class="upsell-banner" role="complementary">
        <span aria-hidden="true">⭐</span>
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
import type { BabyProfile } from '@cfa/shared'
import { BABY_PROFILE_LIMITS } from '@cfa/shared'
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
  gap: 1rem;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.page-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
}

.page-subtitle {
  margin: 0.2rem 0 0;
  font-size: 0.8rem;
  color: #6b7280;
}

.limit-reached {
  color: #f59e0b;
  font-weight: 600;
}

.fab-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.65rem 1.1rem;
  background: #10b981;
  color: white;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 700;
  border: none;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.35);
  transition: background 0.15s;
  white-space: nowrap;
  flex-shrink: 0;
}

.fab-btn:hover:not(:disabled) {
  background: #059669;
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
  gap: 0.75rem;
  padding: 3rem 0;
  color: #6b7280;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e5e7eb;
  border-top-color: #10b981;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Form wrapper */
.form-wrapper {
  margin-bottom: 0.5rem;
}

/* Profiles list */
.profile-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

/* Empty state */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 3rem 1rem;
  text-align: center;
  background: #f9fafb;
  border-radius: 1.5rem;
  border: 2px dashed #e5e7eb;
}

.empty-icon {
  font-size: 3.5rem;
}

.empty-title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: #374151;
}

.empty-subtitle {
  margin: 0;
  font-size: 0.875rem;
  color: #9ca3af;
  max-width: 300px;
}

.create-btn {
  display: inline-flex;
  padding: 0.7rem 1.5rem;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 9999px;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  margin-top: 0.5rem;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
  transition: background 0.15s;
}

.create-btn:hover {
  background: #059669;
}

/* Upsell */
.upsell-banner {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  border-radius: 1rem;
  border: 1px solid #fcd34d;
  font-size: 0.875rem;
}

.upsell-banner div {
  flex: 1;
}

.upsell-banner strong {
  display: block;
  color: #92400e;
  font-weight: 700;
}

.upsell-banner p {
  margin: 0.1rem 0 0;
  color: #78350f;
  font-size: 0.8rem;
}

.upsell-btn {
  flex-shrink: 0;
  padding: 0.5rem 1rem;
  background: #f59e0b;
  color: white;
  border-radius: 0.75rem;
  font-size: 0.875rem;
  font-weight: 700;
  text-decoration: none;
  transition: background 0.15s;
}

.upsell-btn:hover {
  background: #d97706;
}

/* Transitions */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.2s ease;
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
