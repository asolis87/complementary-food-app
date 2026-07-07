<template>
  <div class="snack-list-section">
    <!-- Loading -->
    <div v-if="snackStore.loading" class="state-center" aria-live="polite">
      <div class="spinner" aria-hidden="true" />
      <p>Cargando colaciones...</p>
    </div>

    <!-- Tier upsell banner when at FREE limit (REQ-SC6 — check BEFORE empty-state) -->
    <div
      v-else-if="atLimit && authStore.tier === 'FREE'"
      class="upsell-banner"
      role="complementary"
    >
      <div class="upsell-banner-content">
        <h4 class="upsell-banner-title">Alcanzaste el límite de colaciones del plan gratuito</h4>
        <p class="upsell-banner-text">Actualiza a Pro para crear colaciones ilimitadas.</p>
        <RouterLink to="/pricing" class="upsell-banner-btn">Hacete Pro</RouterLink>
      </div>
    </div>

    <!-- Empty state (REQ-SC2) -->
    <div
      v-else-if="snackStore.savedSnacks.length === 0"
      class="empty-state"
      role="status"
    >
      <span class="material-symbols-outlined empty-icon" aria-hidden="true">restaurant</span>
      <h2 class="empty-title">No tienes colaciones guardadas todavía</h2>
      <p class="empty-subtitle">¡Crea tu primera colación para tener opciones rápidas y saludables!</p>
      <button
        data-test="create-snack-btn"
        class="create-btn"
        @click="openDrawer"
      >
        Crear colación
      </button>
    </div>

    <!-- Snack cards grid -->
    <div v-else>

      <!-- Snack grid -->
      <ul class="snack-grid" role="list" aria-label="Mis colaciones guardadas">
        <li v-for="snack in snackStore.savedSnacks" :key="snack.id" class="snack-item" role="listitem">
          <div class="snack-card">
            <!-- Card Content -->
            <div class="card-content">
              <h3 class="card-name">{{ snack.name }}</h3>
              <p class="card-meta">
                {{ snack.items.length }} {{ snack.items.length === 1 ? 'alimento' : 'alimentos' }}
              </p>
            </div>

            <!-- Delete button -->
            <button
              data-test="delete-snack-btn"
              class="delete-btn"
              :aria-label="`Eliminar ${snack.name}`"
              @click="openDeleteModal(snack.id)"
            >
              <span class="material-symbols-outlined" aria-hidden="true">delete</span>
            </button>
          </div>
        </li>

        <!-- Load more button -->
        <li v-if="snackStore.hasMore" class="load-more-item">
          <button
            data-test="load-more-btn"
            class="load-more-btn"
            :disabled="snackStore.fetchMoreLoading"
            @click="snackStore.fetchMoreSnacks()"
          >
            <span
              v-if="snackStore.fetchMoreLoading"
              class="spinner-mini"
              aria-hidden="true"
            />
            <span
              v-else
              class="material-symbols-outlined"
              aria-hidden="true"
            >expand_more</span>
            {{
              snackStore.fetchMoreLoading
                ? 'Cargando...'
                : `Cargar más (${snackStore.savedSnacks.length} de ${snackStore.totalSnacks})`
            }}
          </button>
        </li>
      </ul>

      <!-- Create FAB (mobile) -->
      <button
        v-if="!atLimit"
        class="snack-fab mobile-only"
        data-test="create-snack-btn"
        aria-label="Crear nueva colación"
        @click="openDrawer"
      >
        <span class="material-symbols-outlined" aria-hidden="true">add</span>
      </button>
    </div>

    <!-- Delete confirmation modal (REQ-SC5 — mirrors PlateDetailPage pattern) -->
    <Teleport to="body">
      <div
        v-if="showDeleteModal"
        class="modal-overlay"
        @click.self="closeDeleteModal"
      >
        <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
          <h3 id="modal-title" class="modal-title">¿Eliminar colación?</h3>
          <p class="modal-body">Esta acción no se puede deshacer.</p>
          <div class="modal-actions">
            <button class="modal-btn btn-cancel" @click="closeDeleteModal">
              Cancelar
            </button>
            <button
              class="modal-btn btn-confirm-delete"
              :disabled="deleting"
              @click="confirmDelete"
            >
              <span v-if="deleting" class="btn-spinner" aria-hidden="true" />
              {{ deleting ? 'Eliminando...' : 'Eliminar' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Snack Builder Drawer -->
    <SnackBuilderDrawer
      v-if="showDrawer"
      :visible="showDrawer"
      :age-months="babyAgeMonths"
      data-test="snack-builder-drawer"
      @close="closeDrawer"
      @snack-created="onSnackCreated"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useSnackStore } from '@/shared/stores/snackStore.js'
import { useAuthStore } from '@/shared/stores/authStore.js'
import { SNACK_LIMITS } from '@pakulab/shared'
import SnackBuilderDrawer from '@/shared/components/SnackBuilderDrawer.vue'
import type { Snack } from '@pakulab/shared'

interface Props {
  babyAgeMonths: number
}

const props = defineProps<Props>()

const snackStore = useSnackStore()
const authStore = useAuthStore()

const snackLimit = computed(() => SNACK_LIMITS[authStore.tier])
const atLimit = computed(
  () => snackStore.savedSnacks.length >= snackLimit.value,
)

// Drawer state
const showDrawer = ref(false)

function openDrawer(): void {
  showDrawer.value = true
}

function closeDrawer(): void {
  showDrawer.value = false
}

function onSnackCreated(snack: Snack): void {
  closeDrawer()
  // Store already unshifts the snack, so list updates reactively
}

// Delete modal state
const showDeleteModal = ref(false)
const deleteTargetId = ref<string | null>(null)
const deleting = ref(false)

function openDeleteModal(snackId: string): void {
  deleteTargetId.value = snackId
  showDeleteModal.value = true
}

function closeDeleteModal(): void {
  showDeleteModal.value = false
  deleteTargetId.value = null
}

async function confirmDelete(): Promise<void> {
  if (!deleteTargetId.value) return

  deleting.value = true
  try {
    await snackStore.deleteSnack(deleteTargetId.value)
  } catch (error) {
    // Store sets snackStore.error; surface it so the user isn't left guessing.
    console.error('Error deleting snack:', error)
  } finally {
    // Always close the modal + reset (mirrors PlateDetailPage). Leaving it open
    // on failure would strand the user with a spinner-less, feedback-less dialog
    // and allow a double-delete on re-click.
    deleting.value = false
    closeDeleteModal()
  }
}

// Fetch snacks on mount if empty
onMounted(() => {
  if (snackStore.savedSnacks.length === 0) {
    snackStore.fetchSavedSnacks()
  }
})
</script>

<style scoped>
/* ═══════════════════════════════════════════════════════════════
   SNACK LIST SECTION - Mobile First
   Mirrors PlateListPage structure for snacks
   ═══════════════════════════════════════════════════════════════ */

.snack-list-section {
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-4);
}

/* ─── Loading / Empty States ─────────────────────────────────── */

.state-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--md3-space-8) var(--md3-space-4);
  text-align: center;
  color: var(--md3-on-surface-variant);
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-md);
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--md3-outline-variant);
  border-top-color: var(--md3-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: var(--md3-space-3);
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--md3-space-8) var(--md3-space-4);
  text-align: center;
}

.empty-icon {
  font-size: 48px;
  color: var(--md3-outline);
  margin-bottom: var(--md3-space-3);
}

.empty-title {
  margin: 0 0 var(--md3-space-2);
  font-family: var(--md3-font-headline);
  font-size: var(--md3-headline-sm);
  font-weight: var(--md3-weight-bold);
  color: var(--md3-on-surface);
}

.empty-subtitle {
  margin: 0 0 var(--md3-space-5);
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-md);
  color: var(--md3-on-surface-variant);
  max-width: 360px;
}

.create-btn {
  padding: 0.75rem var(--md3-space-5);
  background: var(--md3-primary);
  color: var(--md3-on-primary);
  border: none;
  border-radius: var(--md3-rounded-full);
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-lg);
  font-weight: var(--md3-weight-semibold);
  cursor: pointer;
  transition: background var(--md3-transition-fast);
}

.create-btn:hover {
  background: var(--md3-primary-dark);
}

/* ─── Upsell Banner ─────────────────────────────────────────── */

.upsell-banner {
  background: var(--md3-tertiary-container);
  border-radius: var(--md3-rounded-lg);
  padding: var(--md3-space-4);
  margin-bottom: var(--md3-space-4);
}

.upsell-banner-content {
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-2);
}

.upsell-banner-title {
  margin: 0;
  font-family: var(--md3-font-headline);
  font-size: var(--md3-title-sm);
  font-weight: var(--md3-weight-bold);
  color: var(--md3-on-tertiary-container);
}

.upsell-banner-text {
  margin: 0;
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-sm);
  color: var(--md3-on-tertiary-container);
  line-height: var(--md3-body-line-height);
}

.upsell-banner-btn {
  align-self: flex-start;
  padding: 0.5rem var(--md3-space-4);
  background: var(--md3-tertiary);
  color: var(--md3-on-tertiary);
  border-radius: var(--md3-rounded-full);
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-md);
  font-weight: var(--md3-weight-semibold);
  text-decoration: none;
  transition: opacity var(--md3-transition-fast);
}

.upsell-banner-btn:hover {
  opacity: 0.88;
}

/* ─── Snack Grid ───────────────────────────────────────────── */

.snack-grid {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--md3-space-3);
}

@media (min-width: 768px) {
  .snack-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .snack-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.snack-item {
  display: block;
}

.snack-card {
  background: var(--md3-surface-container-low);
  border-radius: var(--md3-rounded-lg);
  padding: var(--md3-space-4);
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--md3-space-3);
  transition: background var(--md3-transition-fast);
}

.snack-card:hover {
  background: var(--md3-surface-container);
}

.card-content {
  flex: 1;
  min-width: 0;
}

.card-name {
  margin: 0 0 var(--md3-space-1);
  font-family: var(--md3-font-headline);
  font-size: var(--md3-title-md);
  font-weight: var(--md3-weight-semibold);
  color: var(--md3-on-surface);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-meta {
  margin: 0;
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-sm);
  color: var(--md3-on-surface-variant);
}

.delete-btn {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  padding: 0;
  background: transparent;
  border: none;
  border-radius: var(--md3-rounded-full);
  color: var(--md3-error);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background var(--md3-transition-fast);
}

.delete-btn:hover {
  background: var(--md3-error-container);
}

/* ─── Load More ───────────────────────────────────────────── */

.load-more-item {
  grid-column: 1 / -1;
}

.load-more-btn {
  width: 100%;
  padding: var(--md3-space-3);
  background: var(--md3-surface-container);
  border: 1px solid var(--md3-outline-variant);
  border-radius: var(--md3-rounded-lg);
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-lg);
  font-weight: var(--md3-weight-medium);
  color: var(--md3-on-surface);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--md3-space-2);
  transition: background var(--md3-transition-fast);
}

.load-more-btn:hover:not(:disabled) {
  background: var(--md3-surface-container-high);
}

.load-more-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.spinner-mini {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid var(--md3-outline-variant);
  border-top-color: var(--md3-primary);
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

/* ─── FAB (mobile) ───────────────────────────────────────── */

.snack-fab {
  position: fixed;
  right: var(--md3-space-4);
  bottom: var(--md3-space-4);
  width: 56px;
  height: 56px;
  padding: 0;
  background: var(--md3-primary);
  color: var(--md3-on-primary);
  border: none;
  border-radius: var(--md3-rounded-full);
  box-shadow: var(--md3-shadow-3);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background var(--md3-transition-fast);
  z-index: 10;
}

.snack-fab:hover {
  background: var(--md3-primary-dark);
}

@media (min-width: 768px) {
  .mobile-only {
    display: none;
  }
}

/* ─── Modal (mirrors PlateDetailPage) ───────────────────────── */

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(11, 15, 15, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  padding: var(--md3-space-3);
}

.modal {
  background: var(--md3-surface-container-lowest);
  border-radius: var(--md3-rounded-md);
  padding: var(--md3-space-6);
  max-width: 380px;
  width: 100%;
  box-shadow: var(--md3-shadow-ambient);
}

.modal-title {
  margin: 0 0 0.5rem;
  font-family: var(--md3-font-headline);
  font-size: var(--md3-headline-sm);
  font-weight: var(--md3-weight-bold);
  color: var(--md3-on-surface);
}

.modal-body {
  margin: 0 0 1.25rem;
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-md);
  color: var(--md3-on-surface-variant);
  line-height: var(--md3-body-line-height);
}

.modal-actions {
  display: flex;
  gap: var(--md3-space-2);
  justify-content: flex-end;
}

.modal-btn {
  padding: 0.55rem var(--md3-space-3);
  border-radius: var(--md3-rounded-full);
  border: none;
  cursor: pointer;
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-lg);
  font-weight: var(--md3-weight-semibold);
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  transition: background var(--md3-transition-fast);
}

.btn-cancel {
  background: var(--md3-surface-container);
  color: var(--md3-on-surface);
}

.btn-cancel:hover {
  background: var(--md3-surface-container-high);
}

.btn-confirm-delete {
  background: var(--md3-error);
  color: var(--md3-on-error);
}

.btn-confirm-delete:not(:disabled):hover {
  opacity: 0.88;
}

.btn-confirm-delete:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: var(--md3-on-error);
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}
</style>
