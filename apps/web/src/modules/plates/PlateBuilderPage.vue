<template>
  <div class="plate-builder-page">
    <main class="page-main">
      <!-- ─── Hero Header ──────────────────────────────────────────── -->
      <header class="page-header">
        <div class="header-text">
          <span class="eyebrow">Planificación de Comidas</span>
          <!-- Editable plate name — inline input styled as heading (AD-4, AC: A8, A9) -->
          <input
            v-model="plateStore.draftName"
            type="text"
            class="plate-name-input"
            maxlength="100"
            placeholder="Mi plato"
            aria-label="Nombre del plato"
            @blur="onNameBlur"
            @keydown.enter.prevent="($event.target as HTMLInputElement).blur()"
          />
          <p class="page-subtitle">
            Arrastra y suelta o toca los segmentos para armar una comida nutricionalmente
            optimizada para tu pequeño.
          </p>
          <!-- Medical disclaimer (REQ-AL-02) -->
          <div class="disclaimer-banner" role="note">
            <span class="material-symbols-outlined disclaimer-icon" aria-hidden="true">info</span>
            <span>Esta información es orientativa. Consultá siempre con tu pediatra.</span>
          </div>
          <!-- Toggle on mobile: below subtitle -->
          <div class="toggle-mobile">
            <div class="group-toggle" role="radiogroup" aria-label="Número de grupos alimenticios">
              <button
                class="toggle-btn"
                :class="{ 'toggle-btn--active': plateStore.draftGroupCount === 4 }"
                role="radio"
                :aria-checked="plateStore.draftGroupCount === 4"
                @click="plateStore.setGroupCount(4)"
              >
                4 Grupos
              </button>
              <button
                class="toggle-btn"
                :class="{ 'toggle-btn--active': plateStore.draftGroupCount === 5 }"
                role="radio"
                :aria-checked="plateStore.draftGroupCount === 5"
                @click="plateStore.setGroupCount(5)"
              >
                5 Grupos
              </button>
            </div>
          </div>
        </div>

        <!-- Toggle on desktop: right side of header -->
        <div class="toggle-desktop">
          <div class="group-toggle" role="radiogroup" aria-label="Número de grupos alimenticios">
            <button
              class="toggle-btn"
              :class="{ 'toggle-btn--active': plateStore.draftGroupCount === 4 }"
              role="radio"
              :aria-checked="plateStore.draftGroupCount === 4"
              @click="plateStore.setGroupCount(4)"
            >
              4 Grupos
            </button>
            <button
              class="toggle-btn"
              :class="{ 'toggle-btn--active': plateStore.draftGroupCount === 5 }"
              role="radio"
              :aria-checked="plateStore.draftGroupCount === 5"
              @click="plateStore.setGroupCount(5)"
            >
              5 Grupos
            </button>
          </div>
        </div>
      </header>

      <!-- ─── Main Content Grid ─────────────────────────────────────── -->
      <div class="content-area">
        <!-- Decorative blobs -->
        <div class="blob blob-top-left" aria-hidden="true"></div>
        <div class="blob blob-bottom-right" aria-hidden="true"></div>

        <div class="content-grid">
          <!-- Left column: Plate + Actions -->
          <div class="col-plate">
            <!-- ① Plate Visualization (tap zones to add food) -->
            <section aria-label="Visualización del plato">
              <PlateVisualization
                ref="vizRef"
                :items="plateStore.draftItems"
                :group-count="plateStore.draftGroupCount"
                @remove-item="plateStore.removeFoodFromDraft"
                @select-group="onGroupSelect"
              />
            </section>

            <!-- ③ Actions -->
            <section class="actions-section" aria-label="Acciones">
              <PlateActions
                :can-save="plateStore.canSave"
                :has-items="plateStore.hasItems"
                :saving="saving"
                :exporting="exporting"
                @save="handleSave"
                @export="handleExport"
                @clear="handleClear"
                @share="handleShare"
              />
            </section>
          </div>

          <!-- Right column: Sidebar (Balance + PlateContents placeholder) -->
          <div class="col-sidebar">
            <!-- ② Balance Indicator -->
            <section aria-label="Equilibrio A/L">
              <BalanceIndicator :balance="balance" />
            </section>

            <!-- ③ Plate Contents (list of selected foods per group) -->
            <section aria-label="Contenido del plato">
              <PlateContents
                :items="plateStore.draftItems"
                :group-count="plateStore.draftGroupCount"
                @select-group="onGroupSelect"
                @remove-item="plateStore.removeFoodFromDraft"
              />
            </section>
          </div>
        </div>
      </div>
    </main>

    <!-- ④ Food Search Modal (bottom sheet) -->
    <FoodSearchModal
      :is-open="showFoodModal"
      :group="modalGroup"
      :group-foods="foodsForModalGroup"
      :current-items="itemsForModalGroup"
      :loading="foodStore.loading"
      :food-histories="foodHistoriesForModal"
      :history-loading="foodHistoryStore.historyLoading"
      @close="onModalClose"
      @add-food="onModalAddFood"
      @remove-food="plateStore.removeFoodFromDraft"
      @search="onModalSearch"
    />

    <!-- Export helper (off-screen capture) -->
    <PlateExport
      ref="exportRef"
      :plate-name="plateStore.draftName"
      :balance="balance"
      :show-watermark="!authStore.isPro"
      @done="onExportDone"
      @error="onExportError"
    >
      <template #visualization>
        <div class="export-mini-plate">
          <PlateVisualization
            :items="plateStore.draftItems"
            :group-count="plateStore.draftGroupCount"
          />
        </div>
      </template>
    </PlateExport>

    <!-- Toast notification -->
    <transition name="toast">
      <div v-if="toast" class="toast" :class="`toast-${toast.type}`" role="status">
        <span class="material-symbols-outlined toast-icon" aria-hidden="true">
          {{ toast.type === 'success' ? 'check_circle' : toast.type === 'error' ? 'error' : 'info' }}
        </span>
        {{ toast.message }}
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute } from 'vue-router'
import type { FoodGroup, Food, FoodHistoryMap } from '@pakulab/shared'
import { usePlateStore } from '@/shared/stores/plateStore.js'
import { useFoodStore } from '@/shared/stores/foodStore.js'
import { useAuthStore } from '@/shared/stores/authStore.js'
import { useProfileStore } from '@/shared/stores/profileStore.js'
import { useFoodHistoryStore } from '@/shared/stores/foodHistoryStore.js'
import { useBalance } from '@/shared/composables/useBalance.js'
import PlateVisualization from './components/PlateVisualization.vue'
import BalanceIndicator from './components/BalanceIndicator.vue'
import PlateContents from './components/PlateContents.vue'
import FoodSearchModal from './components/FoodSearchModal.vue'
import PlateActions from './components/PlateActions.vue'
import PlateExport from './components/PlateExport.vue'

// ─── Stores & composables ─────────────────────────────────────────────────
const route = useRoute()
const plateStore = usePlateStore()
const foodStore = useFoodStore()
const authStore = useAuthStore()
const profileStore = useProfileStore()
const foodHistoryStore = useFoodHistoryStore()
// storeToRefs gives us a real Ref<PlateItemDraft[]> — required by useBalance
const { draftItems } = storeToRefs(plateStore)
const { balance } = useBalance(draftItems)

// ─── Food Search Modal ────────────────────────────────────────────────────
const showFoodModal = ref(false)
const modalGroup = ref<FoodGroup>('FRUIT')

function onGroupSelect(group: FoodGroup) {
  modalGroup.value = group
  showFoodModal.value = true
  // Set group filter — triggers API call with group filter
  foodStore.setFilter('group', group)
  // Fire-and-forget: fetch food history for this group's foods (AC: A1, A13)
  // Does NOT block modal opening — historyLoading state handles the skeleton
  const babyProfileId = profileStore.activeProfile?.id
  if (babyProfileId) {
    const foodIds = foodsForModalGroup.value.map((f) => f.id)
    if (foodIds.length > 0) {
      foodHistoryStore.fetchForFoods(babyProfileId, foodIds)
    }
  }
}

function onModalSearch(query: string) {
  // Called when the modal search input changes (debounced)
  // setFilter triggers an API call with both group + search term
  foodStore.setFilter('search', query)
}

function onModalClose() {
  showFoodModal.value = false
}

/**
 * Foods for the currently selected modal group.
 * Uses filteredFoods which reflects the current group + search filters
 * applied by the store (server-side via API).
 */
const foodsForModalGroup = computed((): Food[] => {
  return foodStore.filteredFoods.filter((f) => f.group === modalGroup.value)
})

/** Draft items already assigned to the currently selected modal group */
const itemsForModalGroup = computed(() => {
  return plateStore.draftItems.filter((item) => item.groupAssignment === modalGroup.value)
})

/**
 * Food history map for the current modal group foods.
 * Keyed by foodId — passed as prop to FoodSearchModal (AD-3).
 * Returns undefined when no active profile (graceful degradation, AC: A6).
 */
const foodHistoriesForModal = computed((): FoodHistoryMap | undefined => {
  const profileId = profileStore.activeProfile?.id
  if (!profileId) return undefined
  const result: FoodHistoryMap = {}
  for (const food of foodsForModalGroup.value) {
    const h = foodHistoryStore.historyForFood(profileId, food.id)
    if (h) result[food.id] = h
  }
  return Object.keys(result).length > 0 ? result : undefined
})

// ─── State flags ──────────────────────────────────────────────────────────
const saving = ref(false)
const exporting = ref(false)
const vizRef = ref<InstanceType<typeof PlateVisualization> | null>(null)
const exportRef = ref<InstanceType<typeof PlateExport> | null>(null)

// ─── Toast ────────────────────────────────────────────────────────────────
interface Toast {
  message: string
  type: 'success' | 'error' | 'info'
}
const toast = ref<Toast | null>(null)

function showToast(message: string, type: Toast['type'] = 'info', duration = 3000) {
  toast.value = { message, type }
  setTimeout(() => {
    toast.value = null
  }, duration)
}

// ─── Edit mode ────────────────────────────────────────────────────────────

/** ID of the plate being edited, or null for create mode */
const editingPlateId = ref<string | null>(null)

// ─── Lifecycle ────────────────────────────────────────────────────────────
onMounted(async () => {
  // Fetch food catalog if not loaded
  if (foodStore.foods.length === 0) {
    await foodStore.fetchFoods()
  }

  // If route has an id param, load that plate into edit mode
  const plateId = route.params.id as string | undefined
  if (plateId) {
    const plate = await plateStore.loadPlate(plateId)
    if (plate) {
      editingPlateId.value = plateId
      plateStore.draftName = plate.name
      plateStore.setGroupCount(plate.groupCount)
      // Note: items would be populated from API in full implementation
    }
  }
})

// ─── Handlers ────────────────────────────────────────────────────────────

function onModalAddFood(food: Food, group: FoodGroup) {
  plateStore.addFoodToDraft(food, group)
  onModalClose()
}

/**
 * Revert to default name when the user clears the field on blur (AC: A8 scenario).
 */
function onNameBlur() {
  if (!plateStore.draftName.trim()) {
    plateStore.draftName = 'Mi plato'
  }
}

async function handleSave() {
  if (!plateStore.hasItems) return
  // Validate plate name (AC: A9)
  if (!plateStore.draftName.trim()) {
    showToast('El nombre no puede estar vacío', 'error')
    return
  }
  saving.value = true
  try {
    if (editingPlateId.value) {
      // Edit mode — update existing plate (name + items are included in updatePlate)
      await plateStore.updatePlate(editingPlateId.value)
      showToast('Plato actualizado', 'success')
    } else {
      // Create mode — requires canSave (tier limit check)
      if (!plateStore.canSave) return
      await plateStore.saveDraftAsPlate()
      showToast('Plato guardado', 'success')
    }
  } catch {
    showToast('Error al guardar. Intentá de nuevo.', 'error')
  } finally {
    saving.value = false
  }
}

async function handleExport() {
  if (!exportRef.value) return
  exporting.value = true
  try {
    await exportRef.value.capture()
  } finally {
    exporting.value = false
  }
}

function onExportDone(dataUrl: string) {
  const link = document.createElement('a')
  link.href = dataUrl
  link.download = `${plateStore.draftName || 'plato'}-pakulab.png`
  link.click()
  showToast('Imagen descargada', 'success')
}

function onExportError(message: string) {
  showToast(`Error al exportar: ${message}`, 'error')
}

function handleClear() {
  if (!confirm('¿Borrar todos los alimentos del plato?')) return
  plateStore.clearItems()
  showToast('Plato limpiado', 'info')
}

async function handleShare() {
  const url = window.location.href
  try {
    if (navigator.share) {
      await navigator.share({
        title: `Mi plato: ${plateStore.draftName}`,
        text: '¡Mirá el plato que armé para mi bebé con Pakulab!',
        url,
      })
    } else {
      await navigator.clipboard.writeText(url)
      showToast('Enlace copiado al portapapeles', 'info')
    }
  } catch {
    showToast('No se pudo compartir', 'error')
  }
}
</script>

<style scoped>
/* ─── Page shell ──────────────────────────────────────────────────────── */
.plate-builder-page {
  min-height: 60vh;
}

.page-main {
  max-width: 64rem;
  margin: 0 auto;
  padding: var(--md3-space-8) var(--md3-space-6) var(--md3-space-12);
}

/* ─── Hero Header ─────────────────────────────────────────────────────── */
.page-header {
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-4);
  margin-bottom: var(--md3-space-12);
}

@media (min-width: 1024px) {
  .page-header {
    flex-direction: row;
    align-items: flex-end;
    justify-content: space-between;
    gap: var(--md3-space-6);
  }
}

.header-text {
  flex: 1;
}

/* Eyebrow */
.eyebrow {
  display: block;
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-sm);
  font-weight: var(--md3-weight-bold);
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--md3-primary);
  margin-bottom: var(--md3-space-2);
}

/* H1 (kept for reference — replaced by plate-name-input) */
.page-title {
  margin: 0 0 var(--md3-space-3);
  font-family: var(--md3-font-headline);
  font-size: clamp(1.75rem, 5vw, 3rem);
  font-weight: 800;
  letter-spacing: var(--md3-headline-tracking);
  line-height: var(--md3-headline-line-height);
  color: var(--md3-on-surface);
}

/* Inline editable plate name — looks like the page title heading at rest */
.plate-name-input {
  display: block;
  width: 100%;
  margin: 0 0 var(--md3-space-3);
  padding: 0;
  border: none;
  border-bottom: 2px solid transparent;
  border-radius: 0;
  background: transparent;
  font-family: var(--md3-font-headline);
  font-size: clamp(1.75rem, 5vw, 3rem);
  font-weight: 800;
  letter-spacing: var(--md3-headline-tracking);
  line-height: var(--md3-headline-line-height);
  color: var(--md3-on-surface);
  outline: none;
  cursor: text;
  transition: border-color var(--md3-transition-fast);
}

.plate-name-input::placeholder {
  color: var(--md3-on-surface-variant);
  opacity: 0.6;
}

.plate-name-input:hover {
  border-bottom-color: var(--md3-outline-variant);
}

.plate-name-input:focus {
  border-bottom-color: var(--md3-primary);
  cursor: text;
}

/* Subtitle */
.page-subtitle {
  margin: 0 0 var(--md3-space-3);
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-lg);
  color: var(--md3-on-surface-variant);
  line-height: var(--md3-body-line-height);
  max-width: 42ch;
}

/* Disclaimer */
.disclaimer-banner {
  display: flex;
  gap: 0.6rem;
  align-items: center;
  background: var(--md3-surface-container-low);
  border-radius: var(--md3-rounded-md);
  padding: 0.75rem var(--md3-space-3);
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-sm);
  color: var(--md3-on-surface-variant);
  margin-top: var(--md3-space-3);
}

.disclaimer-icon {
  font-size: 1.1rem;
  color: var(--md3-primary);
  flex-shrink: 0;
}

/* ─── Group Toggle ────────────────────────────────────────────────────── */

/* Toggle visibility: mobile below header-text, desktop alongside */
.toggle-mobile {
  display: block;
  margin-top: var(--md3-space-4);
}

.toggle-desktop {
  display: none;
  flex-shrink: 0;
}

@media (min-width: 1024px) {
  .toggle-mobile {
    display: none;
  }

  .toggle-desktop {
    display: flex;
    align-items: center;
  }
}

.group-toggle {
  display: inline-flex;
  background: var(--md3-surface-container-low);
  border-radius: var(--md3-rounded-full);
  padding: 0.375rem;
}

.toggle-btn {
  padding: 0.5rem 1.5rem;
  border: none;
  border-radius: var(--md3-rounded-full);
  cursor: pointer;
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-lg);
  font-weight: var(--md3-weight-semibold);
  background: transparent;
  color: var(--md3-on-surface-variant);
  transition: background var(--md3-transition-fast), color var(--md3-transition-fast),
    box-shadow var(--md3-transition-fast);
  white-space: nowrap;
}

.toggle-btn--active {
  background: var(--md3-surface-container-lowest);
  color: var(--md3-primary);
  box-shadow: var(--md3-shadow-soft);
}

/* ─── Content area with blobs ────────────────────────────────────────── */
.content-area {
  position: relative;
}

/* Decorative blobs */
.blob {
  position: absolute;
  border-radius: 43% 57% 53% 47% / 30% 41% 59% 70%;
  pointer-events: none;
  z-index: -1;
}

.blob-top-left {
  top: -3rem;
  left: -3rem;
  width: 12rem;
  height: 12rem;
  background: var(--md3-primary-container);
  opacity: 0.3;
}

.blob-bottom-right {
  bottom: -3rem;
  right: -3rem;
  width: 16rem;
  height: 16rem;
  background: var(--md3-secondary-container);
  opacity: 0.3;
}

/* ─── 2-column grid ──────────────────────────────────────────────────── */
.content-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--md3-space-12);
}

@media (min-width: 1024px) {
  .content-grid {
    grid-template-columns: 7fr 5fr;
    align-items: start;
  }
}

/* ─── Left column ─────────────────────────────────────────────────────── */
.col-plate {
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-4);
}

/* ─── Right column / Sidebar ──────────────────────────────────────────── */
.col-sidebar {
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-6);
}

/* PlateContents section wrapper — component handles its own styles */
section[aria-label="Contenido del plato"] {
  display: contents;
}

/* ─── Export mini plate helper ────────────────────────────────────────── */
.export-mini-plate {
  max-width: 300px;
  margin: 0 auto;
}

/* ─── Toast ────────────────────────────────────────────────────────────── */
.toast {
  position: fixed;
  bottom: 6rem;
  left: 50%;
  transform: translateX(-50%);
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  border-radius: var(--md3-rounded-full);
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-md);
  font-weight: var(--md3-weight-semibold);
  box-shadow: var(--md3-shadow-elevated);
  z-index: 300;
  white-space: nowrap;
}

.toast-icon {
  font-size: 1.1rem;
}

.toast-success {
  background: var(--md3-primary);
  color: var(--md3-on-primary);
}

.toast-error {
  background: var(--md3-error);
  color: var(--md3-on-error);
}

.toast-info {
  background: var(--md3-inverse-surface);
  color: var(--md3-surface-container-lowest);
}

/* Toast transition */
.toast-enter-active,
.toast-leave-active {
  transition: all 0.2s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translate(-50%, 12px);
}
</style>
