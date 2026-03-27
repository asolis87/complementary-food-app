<template>
  <div class="plate-builder-page">
    <!-- Config Step — shown when creating a new plate -->
    <transition name="slide-up">
      <div v-if="step === 'config'" class="step-wrapper">
        <PlateConfigStep @create="onConfigCreate" />
      </div>
    </transition>

    <!-- Builder Step -->
    <transition name="slide-up">
      <div v-if="step === 'builder'" class="builder-wrapper">
        <!-- Sticky header with plate name & group count -->
        <div class="builder-header">
          <button class="back-btn" aria-label="Volver" @click="step = 'config'">
            ← Nuevo
          </button>
          <h1 class="builder-title">{{ plateStore.draftName }}</h1>
          <span class="group-badge">{{ plateStore.draftGroupCount }} grupos</span>
        </div>

        <!-- Medical disclaimer (REQ-AL-02) -->
        <div class="disclaimer-banner" role="note">
          <span aria-hidden="true">⚕️</span>
          <span>Esta información es orientativa. Consultá siempre con tu pediatra.</span>
        </div>

        <!-- ① Plate Visualization (tap zones to add food) -->
        <section class="section" aria-label="Visualización del plato">
          <PlateVisualization
            ref="vizRef"
            :items="plateStore.draftItems"
            :group-count="plateStore.draftGroupCount"
            @remove-item="plateStore.removeFoodFromDraft"
            @select-group="onGroupSelect"
          />
        </section>

        <!-- ② Balance Indicator -->
        <section class="section" aria-label="Equilibrio A/L">
          <BalanceIndicator :balance="balance" />
        </section>

        <!-- ③ Actions -->
        <section class="section section-actions" aria-label="Acciones">
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

        <!-- ④ Food Search Modal (bottom sheet) -->
        <FoodSearchModal
          :is-open="showFoodModal"
          :group="modalGroup"
          :group-foods="foodsForModalGroup"
          :current-items="itemsForModalGroup"
          :loading="foodStore.loading"
          @close="onModalClose"
          @add-food="onModalAddFood"
          @remove-food="plateStore.removeFoodFromDraft"
          @search="onModalSearch"
        />
      </div>
    </transition>

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
        <!-- Re-render a mini plate for export -->
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
        {{ toast.message }}
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute } from 'vue-router'
import type { FoodGroup, Food } from '@cfa/shared'
import { usePlateStore } from '@/shared/stores/plateStore.js'
import { useFoodStore } from '@/shared/stores/foodStore.js'
import { useAuthStore } from '@/shared/stores/authStore.js'
import { useBalance } from '@/shared/composables/useBalance.js'
import PlateConfigStep from './components/PlateConfigStep.vue'
import PlateVisualization from './components/PlateVisualization.vue'
import BalanceIndicator from './components/BalanceIndicator.vue'
import FoodSearchModal from './components/FoodSearchModal.vue'
import PlateActions from './components/PlateActions.vue'
import PlateExport from './components/PlateExport.vue'

// ─── Stores & composables ─────────────────────────────────────────────────
const route = useRoute()
const plateStore = usePlateStore()
const foodStore = useFoodStore()
const authStore = useAuthStore()
// storeToRefs gives us a real Ref<PlateItemDraft[]> — required by useBalance
const { draftItems } = storeToRefs(plateStore)
const { balance } = useBalance(draftItems)

// ─── Step management ─────────────────────────────────────────────────────
type Step = 'config' | 'builder'
const step = ref<Step>('config')

// ─── Food Search Modal ────────────────────────────────────────────────────
const showFoodModal = ref(false)
const modalGroup = ref<FoodGroup>('FRUIT')

function onGroupSelect(group: FoodGroup) {
  modalGroup.value = group
  showFoodModal.value = true
  // Set group filter — triggers API call with group filter
  foodStore.setFilter('group', group)
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

// ─── Lifecycle ────────────────────────────────────────────────────────────
onMounted(async () => {
  // Fetch food catalog if not loaded
  if (foodStore.foods.length === 0) {
    await foodStore.fetchFoods()
  }

  // If route has an id param, load that plate
  const plateId = route.params.id as string | undefined
  if (plateId) {
    const plate = await plateStore.loadPlate(plateId)
    if (plate) {
      plateStore.draftName = plate.name
      plateStore.setGroupCount(plate.groupCount)
      // Note: items would be populated from API in full implementation
      step.value = 'builder'
    }
  }
})

// ─── Handlers ────────────────────────────────────────────────────────────

function onConfigCreate(config: { name: string; groupCount: 4 | 5 }) {
  plateStore.resetDraft()
  plateStore.draftName = config.name
  plateStore.setGroupCount(config.groupCount)
  modalGroup.value = 'FRUIT'
  step.value = 'builder'
}

function onModalAddFood(food: Food, group: FoodGroup) {
  plateStore.addFoodToDraft(food, group)
  onModalClose()
}

async function handleSave() {
  if (!plateStore.canSave || !plateStore.hasItems) return
  saving.value = true
  try {
    await plateStore.saveDraftAsPlate()
    showToast('Plato guardado ✓', 'success')
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
  link.download = `${plateStore.draftName || 'plato'}-cfa.png`
  link.click()
  showToast('Imagen descargada ✓', 'success')
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
        text: '¡Mirá el plato que armé para mi bebé con CFA!',
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
.plate-builder-page {
  max-width: 600px;
  margin: 0 auto;
  position: relative;
  min-height: 60vh;
}

/* Steps */
.step-wrapper,
.builder-wrapper {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* Builder header */
.builder-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #f3f4f6;
}

.back-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #6b7280;
  font-size: 0.875rem;
  padding: 0.25rem 0.5rem;
  border-radius: 0.5rem;
  transition: background 0.15s;
}

.back-btn:hover {
  background: #f3f4f6;
}

.builder-title {
  flex: 1;
  margin: 0;
  font-size: 1.2rem;
  font-weight: 700;
  color: #111827;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.group-badge {
  background: #ecfdf5;
  color: #10b981;
  border: 1px solid #6ee7b7;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.2rem 0.6rem;
  white-space: nowrap;
}

/* Disclaimer */
.disclaimer-banner {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 0.5rem;
  padding: 0.6rem 0.875rem;
  font-size: 0.8rem;
  color: #166534;
}

/* Sections */
.section {
  background: white;
  border-radius: 1rem;
  padding: 1rem;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  border: 1px solid #f3f4f6;
}

.section-actions {
  background: transparent;
  border: none;
  box-shadow: none;
  padding: 0;
}

/* Export mini plate helper */
.export-mini-plate {
  max-width: 300px;
  margin: 0 auto;
}

/* Toast */
.toast {
  position: fixed;
  bottom: 6rem;
  left: 50%;
  transform: translateX(-50%);
  padding: 0.75rem 1.5rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 600;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  z-index: 300;
  white-space: nowrap;
}

.toast-success {
  background: #10b981;
  color: white;
}

.toast-error {
  background: #ef4444;
  color: white;
}

.toast-info {
  background: #374151;
  color: white;
}

/* Transitions */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.25s ease;
}

.slide-up-enter-from {
  opacity: 0;
  transform: translateY(12px);
}

.slide-up-leave-to {
  opacity: 0;
  transform: translateY(-12px);
}

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
