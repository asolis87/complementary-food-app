<template>
  <Teleport to="body">
    <!-- Backdrop -->
    <Transition name="drawer-backdrop">
      <div
        v-if="visible"
        class="drawer-backdrop"
        @click="handleClose"
      />
    </Transition>

    <!-- Drawer panel -->
    <Transition name="drawer-slide">
      <div
        v-if="visible"
        class="drawer-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Crear nueva colación"
      >
        <!-- Header -->
        <div class="drawer-header">
          <h2 class="drawer-title">Crear colación</h2>
          <button
            class="drawer-close"
            aria-label="Cerrar"
            @click="handleClose"
          >
            <span class="material-symbols-outlined" aria-hidden="true">close</span>
          </button>
        </div>

        <!-- Body: scrollable content -->
        <div class="drawer-body">
          <!-- Snack name -->
          <div class="drawer-section">
            <label class="drawer-label" for="drawer-snack-name">Nombre de la colación</label>
            <input
              id="drawer-snack-name"
              v-model="builder.draftName.value"
              type="text"
              class="drawer-name-input"
              maxlength="100"
              placeholder="Mi colación"
              aria-label="Nombre de la colación"
              @blur="onNameBlur"
              @keydown.enter.prevent="($event.target as HTMLInputElement).blur()"
            />
          </div>

          <!-- Snack visualization (3 zones) -->
          <div class="drawer-section drawer-snack-section">
            <SnackVisualization
              :items="builder.draftItems.value"
              :suggested-groups="builder.suggestedGroups.value"
              @select-group="onGroupSelect"
            />
          </div>

          <!-- Tier lockout upsell -->
          <div v-if="!builder.canSave.value && !builder.saving.value" class="drawer-upsell">
            <span class="material-symbols-outlined upsell-icon" aria-hidden="true">lock</span>
            <span>
              Alcanzaste el límite de colaciones del plan gratuito.
              <strong>Actualiza a Pro</strong> para crear colaciones ilimitadas.
            </span>
          </div>

          <!-- Medical disclaimer -->
          <div class="drawer-disclaimer" role="note">
            <span class="material-symbols-outlined disclaimer-icon" aria-hidden="true">info</span>
            <span>Esta información es orientativa. Consulta siempre con tu pediatra.</span>
          </div>
        </div>

        <!-- Footer: actions -->
        <div class="drawer-footer">
          <button
            class="drawer-btn drawer-btn--secondary"
            :disabled="builder.saving.value"
            @click="handleClear"
          >
            Limpiar
          </button>
          <button
            class="drawer-btn drawer-btn--primary"
            :disabled="!builder.canSave.value || !builder.isValid.value || builder.saving.value"
            @click="handleSave"
          >
            <span v-if="builder.saving.value" class="drawer-btn-spinner" aria-hidden="true" />
            <template v-else>
              <span class="material-symbols-outlined" aria-hidden="true">save</span>
            </template>
            {{ builder.saving.value ? 'Guardando...' : 'Guardar colación' }}
          </button>
        </div>
      </div>
    </Transition>

    <!-- Food Search Modal (z-index offset so it layers above drawer) -->
    <FoodSearchModal
      :is-open="showFoodModal"
      :group="modalGroup"
      :group-foods="foodsForModalGroup"
      :current-items="itemsForModalGroup"
      :loading="foodStore.loading"
      :z-index-offset="1000"
      @close="onModalClose"
      @add-food="onModalAddFood"
      @remove-food="builder.removeFood"
      @search="onModalSearch"
    />
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Food, FoodGroup, Snack } from '@pakulab/shared'
import { getEffectiveGroup } from '@pakulab/shared'
import { useSnackBuilder } from '@/shared/composables/useSnackBuilder.js'
import { useFoodStore } from '@/shared/stores/foodStore.js'
import { useUiStore } from '@/shared/stores/uiStore.js'
import SnackVisualization from '@/modules/snacks/components/SnackVisualization.vue'
import FoodSearchModal from '@/modules/plates/components/FoodSearchModal.vue'

// ─── Props & emits ────────────────────────────────────────────────────────────

const props = defineProps<{
  visible: boolean
  /** Baby age in months for suggested groups */
  ageMonths: number
}>()

const emit = defineEmits<{
  'snack-created': [snack: Snack]
  close: []
  'update:visible': [value: boolean]
}>()

// ─── Composable ──────────────────────────────────────────────────────────────

const builder = useSnackBuilder({
  ageMonths: () => props.ageMonths,
  onSaved(snack: Snack) {
    emit('snack-created', snack)
    builder.resetDraft()
    handleClose()
  },
})

// ─── Stores ──────────────────────────────────────────────────────────────────

const foodStore = useFoodStore()
const uiStore = useUiStore()

// ─── Food Search Modal ─────────────────────────────────────────────────────────

const showFoodModal = ref(false)
const modalGroup = ref<FoodGroup>('FRUIT')

function onGroupSelect(group: FoodGroup) {
  modalGroup.value = group
  showFoodModal.value = true
  foodStore.setFilter('group', null)
}

function onModalSearch(query: string) {
  foodStore.setFilter('search', query)
}

function onModalClose() {
  showFoodModal.value = false
}

function onModalAddFood(food: Food, group: FoodGroup) {
  builder.addFood(food, group)
  onModalClose()
}

/** Foods for the currently selected modal group (uses effective group mapping for 5-group context). */
const foodsForModalGroup = computed((): Food[] => {
  // Snacks always use 3 groups, but getEffectiveGroup supports 4/5 groupCount.
  // For snacks, we filter by the target snack group directly since we only have 3 zones.
  return foodStore.filteredFoods.filter((f) => {
    // For snack context, we only care about HEALTHY_FAT, CEREAL_TUBER, FRUIT
    // Map foods using groupCount=5 logic (so HEALTHY_FAT is available)
    const effectiveGroup = getEffectiveGroup(f.name, f.group, 5)
    return effectiveGroup === modalGroup.value
  })
})

/** Draft items already assigned to the currently selected modal group. */
const itemsForModalGroup = computed(() => {
  return builder.draftItems.value.filter((item) => item.groupAssignment === modalGroup.value)
})

// ─── Handlers ─────────────────────────────────────────────────────────────────

function handleClose() {
  emit('update:visible', false)
  emit('close')
}

function onNameBlur() {
  if (!builder.draftName.value.trim()) {
    builder.draftName.value = 'Mi colación'
  }
}

function handleClear() {
  builder.clear()
}

async function handleSave() {
  if (!builder.isValid.value || !builder.canSave.value || builder.saving.value) return

  try {
    const result = await builder.saveSnack()

    // Surface warnings via toast (REQ-SC4: warnings shown after save, non-blocking)
    if (result.warnings.length > 0) {
      result.warnings.forEach((warning) => {
        uiStore.addToast(warning, 'warning')
      })
    }

    // onSaved callback handles emit + close
  } catch (error) {
    uiStore.addToast(
      error instanceof Error ? error.message : 'Error al guardar la colación',
      'error',
    )
  }
}

// ─── Lifecycle ───────────────────────────────────────────────────────────────

/** Reset draft on close; init fresh draft on open; ensure food catalog is loaded. */
watch(
  () => props.visible,
  async (open) => {
    if (open) {
      builder.resetDraft()
      if (foodStore.foods.length === 0) {
        await foodStore.fetchFoods()
      }
    } else {
      builder.resetDraft()
    }
  },
)
</script>

<style scoped>
/* ─── Backdrop ──────────────────────────────────────────────────────────── */
.drawer-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(11, 15, 15, 0.45);
  backdrop-filter: blur(4px);
  z-index: 1100;
}

/* ─── Drawer panel ───────────────────────────────────────────────────────── */
.drawer-panel {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  max-width: 520px;
  background: var(--md3-surface-container-lowest);
  z-index: 1100;
  display: flex;
  flex-direction: column;
  box-shadow: -4px 0 24px rgba(0, 0, 0, 0.12);
  overflow: hidden;
}

/* ─── Header ────────────────────────────────────────────────────────────── */
.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--md3-space-4) var(--md3-space-6);
  border-bottom: 1px solid var(--md3-outline-variant);
  flex-shrink: 0;
}

.drawer-title {
  margin: 0;
  font-family: var(--md3-font-headline);
  font-size: var(--md3-title-lg);
  font-weight: var(--md3-weight-bold);
  color: var(--md3-on-surface);
}

.drawer-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: none;
  background: transparent;
  color: var(--md3-on-surface-variant);
  border-radius: var(--md3-rounded-full);
  cursor: pointer;
  transition: background var(--md3-transition-fast);
}

.drawer-close:hover {
  background: var(--md3-surface-container-high);
}

.drawer-close .material-symbols-outlined {
  font-size: 1.5rem;
}

/* ─── Body ──────────────────────────────────────────────────────────────── */
.drawer-body {
  flex: 1;
  overflow-y: auto;
  padding: var(--md3-space-4) var(--md3-space-6);
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-4);
}

.drawer-section {
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-2);
}

.drawer-snack-section {
  align-items: center;
}

/* ─── Snack name input ──────────────────────────────────────────────────── */
.drawer-label {
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-md);
  font-weight: var(--md3-weight-semibold);
  color: var(--md3-on-surface-variant);
  text-transform: uppercase;
  letter-spacing: var(--md3-label-tracking);
}

.drawer-name-input {
  width: 100%;
  padding: 0.625rem 0.75rem;
  border: 2px solid var(--md3-outline-variant);
  border-radius: var(--md3-rounded-md);
  background: var(--md3-surface-container-low);
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-lg);
  color: var(--md3-on-surface);
  outline: none;
  transition: border-color var(--md3-transition-fast), background var(--md3-transition-fast);
}

.drawer-name-input::placeholder {
  color: var(--md3-on-surface-variant);
  opacity: 0.6;
}

.drawer-name-input:hover {
  border-color: var(--md3-outline);
}

.drawer-name-input:focus {
  border-color: var(--md3-primary);
  background: var(--md3-surface-container-lowest);
}

/* ─── Tier lockout upsell ────────────────────────────────────────────────── */
.drawer-upsell {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  background: var(--md3-tertiary-container);
  border-radius: var(--md3-rounded-md);
  padding: 0.875rem var(--md3-space-3);
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-sm);
  color: var(--md3-on-tertiary-container);
  border: 1px solid var(--md3-tertiary);
}

.upsell-icon {
  font-size: 1.25rem;
  color: var(--md3-tertiary);
  flex-shrink: 0;
}

.drawer-upsell strong {
  font-weight: var(--md3-weight-bold);
  color: var(--md3-tertiary);
}

/* ─── Disclaimer ────────────────────────────────────────────────────────── */
.drawer-disclaimer {
  display: flex;
  gap: 0.6rem;
  align-items: center;
  background: var(--md3-surface-container-low);
  border-radius: var(--md3-rounded-md);
  padding: 0.75rem var(--md3-space-3);
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-sm);
  color: var(--md3-on-surface-variant);
  margin-top: auto;
}

.disclaimer-icon {
  font-size: 1.1rem;
  color: var(--md3-primary);
  flex-shrink: 0;
}

/* ─── Footer ────────────────────────────────────────────────────────────── */
.drawer-footer {
  display: flex;
  gap: var(--md3-space-3);
  padding: var(--md3-space-4) var(--md3-space-6);
  border-top: 1px solid var(--md3-outline-variant);
  flex-shrink: 0;
  background: var(--md3-surface-container-lowest);
}

.drawer-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--md3-space-2);
  padding: 0.75rem 1.5rem;
  border-radius: var(--md3-rounded-full);
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-lg);
  font-weight: var(--md3-weight-semibold);
  cursor: pointer;
  transition: background var(--md3-transition-fast), opacity var(--md3-transition-fast);
  border: none;
  min-height: 44px;
}

.drawer-btn--secondary {
  background: transparent;
  color: var(--md3-on-surface-variant);
}

.drawer-btn--secondary:hover:not(:disabled) {
  background: var(--md3-surface-container-low);
}

.drawer-btn--primary {
  background: var(--md3-primary);
  color: var(--md3-on-primary);
  flex: 1;
}

.drawer-btn--primary:hover:not(:disabled) {
  background: var(--md3-primary-hover, var(--md3-primary));
  opacity: 0.9;
}

.drawer-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.drawer-btn-spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: var(--md3-on-primary);
  border-radius: 50%;
  animation: drawer-spin 0.7s linear infinite;
}

@keyframes drawer-spin {
  to { transform: rotate(360deg); }
}

/* ─── Transitions ───────────────────────────────────────────────────────── */

/* Backdrop */
.drawer-backdrop-enter-active,
.drawer-backdrop-leave-active {
  transition: opacity 0.25s ease;
}
.drawer-backdrop-enter-from,
.drawer-backdrop-leave-to {
  opacity: 0;
}

/* Panel slide-in from right */
.drawer-slide-enter-active,
.drawer-slide-leave-active {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.drawer-slide-enter-from,
.drawer-slide-leave-to {
  transform: translateX(100%);
}

/* ─── Mobile: near fullscreen ───────────────────────────────────────────── */
@media (max-width: 520px) {
  .drawer-panel {
    max-width: 100%;
  }
}
</style>
