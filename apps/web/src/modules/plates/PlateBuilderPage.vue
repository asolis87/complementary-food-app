<template>
  <div class="plate-builder-page">
    <main class="page-main">
      <!-- ─── Hero Header ──────────────────────────────────────────── -->
      <header class="page-header">
        <div class="header-text">
          <span class="eyebrow">Planificación de Comidas</span>
          <!-- Editable plate name — inline input styled as heading (AD-4, AC: A8, A9) -->
          <input
            v-model="draftName"
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
            <span>Esta información es orientativa. Consulta siempre con tu pediatra.</span>
          </div>
          <!-- Toggle on mobile: below subtitle -->
          <div class="toggle-mobile">
            <div class="group-toggle" role="radiogroup" aria-label="Número de grupos alimenticios">
              <button
                class="toggle-btn"
                :class="{ 'toggle-btn--active': draftGroupCount === 4 }"
                role="radio"
                :aria-checked="draftGroupCount === 4"
                @click="setGroupCount(4)"
              >
                4 Grupos
              </button>
              <button
                class="toggle-btn"
                :class="{ 'toggle-btn--active': draftGroupCount === 5 }"
                role="radio"
                :aria-checked="draftGroupCount === 5"
                @click="setGroupCount(5)"
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
              :class="{ 'toggle-btn--active': draftGroupCount === 4 }"
              role="radio"
              :aria-checked="draftGroupCount === 4"
              @click="setGroupCount(4)"
            >
              4 Grupos
            </button>
            <button
              class="toggle-btn"
              :class="{ 'toggle-btn--active': draftGroupCount === 5 }"
              role="radio"
              :aria-checked="draftGroupCount === 5"
              @click="setGroupCount(5)"
            >
              5 Grupos
            </button>
          </div>
        </div>

        <!-- Stage selector (T-05-06 REQ-C2) -->
        <div class="stage-selector-wrapper">
          <label for="stage-selector" class="stage-label">Etapa objetivo:</label>
          <select
            id="stage-selector"
            v-model="draftStageFor"
            class="stage-selector"
            aria-label="Seleccionar etapa objetivo del plato"
          >
            <option :value="null">Sin definir</option>
            <option
              v-for="stage in PLATE_STAGES"
              :key="stage"
              :value="stage"
            >
              {{ PLATE_STAGE_LABELS[stage] }}
            </option>
          </select>
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
                :items="draftItems"
                :group-count="draftGroupCount"
                :times-offered-by-food-id="timesOfferedByFoodId"
                @remove-item="removeFood"
                @select-group="onGroupSelect"
              />
            </section>

            <!-- ③ Actions -->
            <section class="actions-section" aria-label="Acciones">
              <PlateActions
                :can-save="canSave"
                :has-items="hasItems"
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
                :items="draftItems"
                :group-count="draftGroupCount"
                :times-offered-by-food-id="timesOfferedByFoodId"
                @select-group="onGroupSelect"
                @remove-item="removeFood"
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
      @remove-food="removeFood"
      @search="onModalSearch"
    />



    <!-- ⑤ Meal Slot Picker — post-save assignment to weekly menu (AD-4) -->
    <MealSlotPicker
      v-if="lastSavedPlate"
      :visible="showMealSlotPicker"
      :plate-id="lastSavedPlate.id"
      :plate-name="lastSavedPlate.name"
      @assigned="onMealSlotAssigned"
      @close="onMealSlotClose"
      @skip="onMealSlotSkip"
    />

    <!-- Off-screen beautiful export frame -->
    <PlateExportFrame
      ref="exportFrameRef"
      :plate-name="draftName || 'Mi plato'"
      :items="draftItems"
      :group-count="draftGroupCount"
      :times-offered-by-food-id="timesOfferedByFoodId"
      :baby-name="profileStore.activeProfile?.name"
      :is-pro="authStore.isPro"
      :balance-label="balance?.labelEs"
      @done="onExportDone"
      @error="onExportError"
    />

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
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { FoodGroup, Food, FoodHistoryMap } from '@pakulab/shared'
import { getEffectiveGroup } from '@pakulab/shared'
import type { Plate } from '@pakulab/shared'
import { PLATE_STAGES, PLATE_STAGE_LABELS, type PlateStage } from '@pakulab/shared'
import { usePlateStore } from '@/shared/stores/plateStore.js'
import { useFoodStore } from '@/shared/stores/foodStore.js'
import { useAuthStore } from '@/shared/stores/authStore.js'
import { useProfileStore } from '@/shared/stores/profileStore.js'
import { useFoodHistoryStore } from '@/shared/stores/foodHistoryStore.js'
import { usePlateBuilder } from '@/shared/composables/usePlateBuilder.js'
import { useFoodExposure } from '@/shared/composables/useFoodExposure.js'
import PlateVisualization from './components/PlateVisualization.vue'
import BalanceIndicator from './components/BalanceIndicator.vue'
import PlateContents from './components/PlateContents.vue'
import FoodSearchModal from './components/FoodSearchModal.vue'
import PlateActions from './components/PlateActions.vue'
import PlateExportFrame from './components/PlateExportFrame.vue'
import MealSlotPicker from '@/shared/components/MealSlotPicker.vue'
import type { SlotSelection } from '@/shared/components/MealSlotPicker.vue'
import { fixHtml2CanvasColors } from '@/shared/utils/exportUtils.js'

// ─── Meal Slot Picker state (AD-4: Builder → Menu flow) ─────────────────
const showMealSlotPicker = ref(false)
const lastSavedPlate = ref<{ id: string; name: string } | null>(null)

/** Called by usePlateBuilder's onSaved — shows MealSlotPicker after successful save */
function onPlateSaved(plate: Plate) {
  lastSavedPlate.value = { id: plate.id, name: plate.name }
  showMealSlotPicker.value = true
}

// ─── Composable: plate builder draft state (AD-1) ──────────────────────
const {
  draftItems,
  draftName,
  draftGroupCount,
  draftStageFor,
  saving,
  balance,
  hasItems,
  canSave,
  initDraft,
  addFood,
  removeFood,
  setGroupCount,
  setStageFor,
  clearItems,
  loadPlateIntoDraft,
  savePlate,
  updatePlate,
} = usePlateBuilder({ onSaved: onPlateSaved })

// ─── Stores ─────────────────────────────────────────────────────────────
const route = useRoute()
const router = useRouter()
const plateStore = usePlateStore() // Still needed for loadPlate() in edit mode
const foodStore = useFoodStore()
const authStore = useAuthStore()
const profileStore = useProfileStore()
const foodHistoryStore = useFoodHistoryStore()

// ─── Food Exposure ─────────────────────────────────────────────────────────
const foodExposure = useFoodExposure()

/** Unique food IDs from the current draft items */
const draftFoodIds = computed<string[]>(() => {
  const ids = draftItems.value.map((item) => item.food.id)
  return [...new Set(ids)]
})

/** Map of foodId → timesOffered for passing to child components (null = unknown) */
const timesOfferedByFoodId = computed<Record<string, number | null>>(() => {
  const result: Record<string, number | null> = {}
  for (const foodId of draftFoodIds.value) {
    result[foodId] = foodExposure.getTimesOffered(foodId)
  }
  return result
})

/** Fetch exposure data whenever draft items change */
watch(draftItems, async () => {
  if (draftFoodIds.value.length > 0) {
    await foodExposure.fetch(draftFoodIds.value)
  }
}, { deep: true })

/** Re-fetch when active profile changes (new baby → different exposure data) */
watch(() => profileStore.activeProfile?.id, async (profileId) => {
  if (profileId && draftFoodIds.value.length > 0) {
    await foodExposure.fetch(draftFoodIds.value)
  }
})

// ─── Food Search Modal ────────────────────────────────────────────────────
const showFoodModal = ref(false)
const modalGroup = ref<FoodGroup>('FRUIT')

function onGroupSelect(group: FoodGroup) {
  modalGroup.value = group
  showFoodModal.value = true
  // Clear group and search filters — we filter locally using getEffectiveGroup
  // to handle dual-group foods (e.g., cacahuate → PROTEIN in 4-group, HEALTHY_FAT in 5-group).
  // The full catalog is already in memory from the initial fetchFoods() call.
  foodStore.setFilter('group', null)
  foodStore.setFilter('search', '')
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
 *
 * Uses getEffectiveGroup() to handle dual-group foods that change plate zone
 * based on groupCount. Example: Cacahuate is PROTEIN in a 4-group plate,
 * but HEALTHY_FAT in a 5-group plate (per Dra. Trueba / Protocolo Beikost).
 *
 * Source: Dra. Paulina Trueba — 6-9m table has nuts under Proteínas,
 * 10-11m table moves them to Grasas.
 */
const foodsForModalGroup = computed((): Food[] => {
  const groupCount = draftGroupCount.value
  return foodStore.filteredFoods.filter((f) => {
    const effectiveGroup = getEffectiveGroup(f.name, f.group, groupCount)
    return effectiveGroup === modalGroup.value
  })
})

/** Draft items already assigned to the currently selected modal group */
const itemsForModalGroup = computed(() => {
  return draftItems.value.filter((item) => item.groupAssignment === modalGroup.value)
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
const exporting = ref(false)
const vizRef = ref<InstanceType<typeof PlateVisualization> | null>(null)
const exportFrameRef = ref<InstanceType<typeof PlateExportFrame> | null>(null)

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
  // Reset draft state first — prevents stale data from previous visits (UX-1)
  initDraft()

  // Fetch food catalog if not loaded
  if (foodStore.foods.length === 0) {
    await foodStore.fetchFoods()
  }

  // Fetch exposure data for draft foods
  if (draftFoodIds.value.length > 0) {
    await foodExposure.fetch(draftFoodIds.value)
  }

  // If route has an id param or ?edit= query, load that plate into edit mode
  const plateId = (route.params.id ?? route.query.edit) as string | undefined
  if (plateId) {
    const plate = await plateStore.loadPlate(plateId)
    if (plate) {
      editingPlateId.value = plateId
      // Load plate data into composable draft (replaces manual property-by-property mapping)
      loadPlateIntoDraft(plate)
    }
  }
})

// ─── Handlers ────────────────────────────────────────────────────────────

function onModalAddFood(food: Food, group: FoodGroup) {
  addFood(food, group)
  onModalClose()
}

/**
 * Revert to default name when the user clears the field on blur (AC: A8 scenario).
 */
function onNameBlur() {
  if (!draftName.value.trim()) {
    draftName.value = 'Mi plato'
  }
}

async function handleSave() {
  if (!hasItems.value) return
  // Validate plate name (AC: A9)
  if (!draftName.value.trim()) {
    showToast('El nombre no puede estar vacío', 'error')
    return
  }

  if (editingPlateId.value) {
    // Edit mode — update existing plate (name + items are included in updatePlate)
    try {
      await updatePlate(editingPlateId.value)
      showToast('Plato actualizado', 'success')
      router.push('/plates')
    } catch {
      showToast('Error al guardar. Intenta de nuevo.', 'error')
    }
  } else {
    // Create mode — requires canSave (tier limit check)
    if (!canSave.value) return
    try {
      await savePlate()
      showToast('Plato guardado', 'success')
      // onSaved callback (via usePlateBuilder) already set lastSavedPlate + showMealSlotPicker
      // Do NOT navigate yet — user must choose to assign or skip
    } catch {
      showToast('Error al guardar. Intenta de nuevo.', 'error')
    }
  }
}

// ─── Meal Slot Picker handlers (AD-4: Builder → Menu flow) ────────────

function onMealSlotAssigned(selections: SlotSelection[]) {
  showMealSlotPicker.value = false
  const count = selections.length
  const message = count === 1
    ? 'Plato asignado al menú'
    : `Plato asignado a ${count} horarios`
  showToast(message, 'success')
  router.push('/menus')
}

function onMealSlotSkip() {
  showMealSlotPicker.value = false
  router.push('/plates')
}

function onMealSlotClose() {
  showMealSlotPicker.value = false
  router.push('/plates')
}

// ─── Export & share handlers ───────────────────────────────────────────

async function handleExport() {
  if (!hasItems.value) return

  showToast('Iniciando exportación...', 'info')

  exporting.value = true
  if (exportFrameRef.value) {
    await exportFrameRef.value.capture()
  } else {
    exporting.value = false
    showToast('No se pudo inicializar el exportador', 'error')
  }
}

function onExportDone(dataUrl: string) {
  const link = document.createElement('a')
  link.href = dataUrl
  link.download = `${draftName.value || 'plato'}-pakulab.png`
  // Must be in the DOM for click() to trigger download in all browsers
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  showToast('Imagen descargada', 'success')
}

function onExportError(message: string) {
  showToast(`Error al exportar: ${message}`, 'error')
}

function handleClear() {
  if (!confirm('¿Borrar todos los alimentos del plato?')) return
  clearItems()
  showToast('Plato limpiado', 'info')
}

async function handleShare() {
  const url = window.location.href
  try {
    if (navigator.share) {
      await navigator.share({
        title: `Mi plato: ${draftName.value}`,
        text: '¡Mira el plato que armé para mi bebé con Pakulab!',
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
  overflow-x: hidden;
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

/* Mobile responsive — reduce horizontal padding on small screens */
@media (max-width: 430px) {
  .page-main {
    padding: var(--md3-space-3) var(--md3-space-2) var(--md3-space-8);
  }
}

/* ─── Stage Selector + Suggestion Badge (T-05-06) ──────────────────────── */
.stage-selector-wrapper {
  display: flex;
  align-items: center;
  gap: var(--md3-space-2);
  margin-top: var(--md3-space-3);
}

.stage-label {
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-md);
  color: var(--md3-on-surface-variant);
}

.stage-selector {
  padding: 0.5rem 1rem;
  border: 1px solid var(--md3-outline);
  border-radius: var(--md3-rounded-sm);
  background: var(--md3-surface-container-low);
  color: var(--md3-on-surface);
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-md);
  cursor: pointer;
}

.badge-suggested {
  display: inline-flex;
  align-items: center;
  font-size: 0.7rem;
  font-weight: var(--md3-weight-medium);
  background: var(--md3-secondary-container);
  color: var(--md3-on-secondary-container);
  padding: 0.125rem 0.5rem;
  border-radius: var(--md3-rounded-sm);
  margin-left: 0.375rem;
}
</style>