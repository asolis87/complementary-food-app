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
        aria-label="Crear nuevo plato"
      >
        <!-- Header -->
        <div class="drawer-header">
          <h2 class="drawer-title">Crear plato</h2>
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
          <!-- Plate name -->
          <div class="drawer-section">
            <label class="drawer-label" for="drawer-plate-name">Nombre del plato</label>
            <input
              id="drawer-plate-name"
              v-model="builder.draftName.value"
              type="text"
              class="drawer-name-input"
              maxlength="100"
              placeholder="Mi plato"
              aria-label="Nombre del plato"
              @blur="onNameBlur"
              @keydown.enter.prevent="($event.target as HTMLInputElement).blur()"
            />
          </div>

          <!-- Group count toggle -->
          <div class="drawer-section">
            <div class="group-toggle" role="radiogroup" aria-label="Número de grupos alimenticios">
              <button
                class="toggle-btn"
                :class="{ 'toggle-btn--active': builder.draftGroupCount.value === 4 }"
                role="radio"
                :aria-checked="builder.draftGroupCount.value === 4"
                @click="builder.setGroupCount(4)"
              >
                4 Grupos
              </button>
              <button
                class="toggle-btn"
                :class="{ 'toggle-btn--active': builder.draftGroupCount.value === 5 }"
                role="radio"
                :aria-checked="builder.draftGroupCount.value === 5"
                @click="builder.setGroupCount(5)"
              >
                5 Grupos
              </button>
            </div>
          </div>

          <!-- Plate visualization -->
          <div class="drawer-section drawer-plate-section">
            <PlateVisualization
              :items="builder.draftItems.value"
              :group-count="builder.draftGroupCount.value"
              :times-offered-by-food-id="timesOfferedByFoodId"
              @remove-item="builder.removeFood"
              @select-group="onGroupSelect"
            />
          </div>

          <!-- Balance indicator -->
          <div v-if="builder.hasItems.value" class="drawer-section">
            <div
              class="drawer-balance-bar"
              :class="balanceClass"
            >
              <span class="material-symbols-outlined drawer-balance-icon" aria-hidden="true">
                {{ balanceIcon }}
              </span>
              <span class="drawer-balance-label">{{ balanceLabel }}</span>
            </div>
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
            {{ builder.saving.value ? 'Guardando...' : 'Guardar plato' }}
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
import type { Food, FoodGroup, Plate } from '@pakulab/shared'
import type { MealKey, DayKey } from '@pakulab/shared'
import {
  getEffectiveGroup,
  FOOD_GROUP_LABELS,
  getAgeMonths,
  getSuggestedStageForAge,
} from '@pakulab/shared'
import { usePlateBuilder } from '@/shared/composables/usePlateBuilder.js'
import { useFoodStore } from '@/shared/stores/foodStore.js'
import { useProfileStore } from '@/shared/stores/profileStore.js'
import { useFoodHistoryStore } from '@/shared/stores/foodHistoryStore.js'
import { useFoodExposure } from '@/shared/composables/useFoodExposure.js'
import PlateVisualization from '@/modules/plates/components/PlateVisualization.vue'
import FoodSearchModal from '@/modules/plates/components/FoodSearchModal.vue'

// ─── Props & emits ────────────────────────────────────────────────────────────

interface MealContext {
  dayOfWeek: number
  mealType: MealKey
}

const props = defineProps<{
  visible: boolean
  /** Optional: day+meal context for auto-assign after save (Builder→Menu flow). */
  mealContext?: MealContext
}>()

const emit = defineEmits<{
  'plate-created': [plate: Plate]
  close: []
  'update:visible': [value: boolean]
}>()

// ─── Composable ──────────────────────────────────────────────────────────────

const builder = usePlateBuilder({
  onSaved(plate: Plate) {
    emit('plate-created', plate)
    builder.resetDraft()
    handleClose()
  },
})

// ─── Stores ──────────────────────────────────────────────────────────────────

const foodStore = useFoodStore()
const profileStore = useProfileStore()
const foodHistoryStore = useFoodHistoryStore()

// ─── Food Exposure ─────────────────────────────────────────────────────────────
const foodExposure = useFoodExposure()

/** Unique food IDs from the current drawer draft items */
const drawerFoodIds = computed<string[]>(() => {
  const ids = builder.draftItems.value.map((item) => item.food.id)
  return [...new Set(ids)]
})

/** Map of foodId → timesOffered for passing to PlateVisualization (null = unknown) */
const timesOfferedByFoodId = computed<Record<string, number | null>>(() => {
  const result: Record<string, number | null> = {}
  for (const foodId of drawerFoodIds.value) {
    result[foodId] = foodExposure.getTimesOffered(foodId)
  }
  return result
})

/** Fetch exposure data whenever draft items change */
watch(
  () => builder.draftItems.value,
  async () => {
    if (drawerFoodIds.value.length > 0) {
      await foodExposure.fetch(drawerFoodIds.value)
    }
  },
  { deep: true },
)

/** Re-fetch when active profile changes */
watch(
  () => profileStore.activeProfile?.id,
  async (profileId) => {
    if (profileId && drawerFoodIds.value.length > 0) {
      await foodExposure.fetch(drawerFoodIds.value)
    }
  },
)

// ─── Stage Suggestion (REQ-C2 / REQ-C4) — mirror of PlateBuilderPage ───────────
/** Baby's age in months derived from the active profile (null if none active) */
const babyAgeMonths = computed<number | null>(() => {
  const birthDate = profileStore.activeProfile?.birthDate
  return birthDate ? getAgeMonths(birthDate) : null
})

/**
 * Default the draft stage to the baby's current stage. Sticky semantics
 * (REQ-C4): applies once and never overwrites a manual choice. Re-runs on
 * profile change so switching babies refreshes the default until the user
 * picks something. Same contract as PlateBuilderPage.vue.
 */
watch(
  babyAgeMonths,
  (age) => {
    if (age === null) return
    builder.applyStageHintIfUnset(getSuggestedStageForAge(age))
  },
)

// ─── Food Search Modal ─────────────────────────────────────────────────────────

const showFoodModal = ref(false)
const modalGroup = ref<FoodGroup>('FRUIT')

function onGroupSelect(group: FoodGroup) {
  modalGroup.value = group
  showFoodModal.value = true
  foodStore.setFilter('group', null)
  const babyProfileId = profileStore.activeProfile?.id
  if (babyProfileId) {
    const foodIds = foodsForModalGroup.value.map((f) => f.id)
    if (foodIds.length > 0) {
      foodHistoryStore.fetchForFoods(babyProfileId, foodIds)
    }
  }
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

/** Foods for the currently selected modal group (uses effective group mapping). */
const foodsForModalGroup = computed((): Food[] => {
  const groupCount = builder.draftGroupCount.value
  return foodStore.filteredFoods.filter((f) => {
    const effectiveGroup = getEffectiveGroup(f.name, f.group, groupCount)
    return effectiveGroup === modalGroup.value
  })
})

/** Draft items already assigned to the currently selected modal group. */
const itemsForModalGroup = computed(() => {
  return builder.draftItems.value.filter((item) => item.groupAssignment === modalGroup.value)
})

// ─── Balance display ─────────────────────────────────────────────────────────

const balanceLabel = computed(() => {
  const b = builder.balance.value
  if (!b) return 'Sin datos'
  if (b.label === 'balanced') return 'Equilibrado'
  if (b.label === 'astringent') return 'Astringente'
  return 'Laxante'
})

const balanceClass = computed(() => {
  const b = builder.balance.value
  if (!b) return ''
  if (b.label === 'balanced') return 'drawer-balance--balanced'
  if (b.label === 'astringent') return 'drawer-balance--astringent'
  return 'drawer-balance--laxative'
})

const balanceIcon = computed(() => {
  const b = builder.balance.value
  if (!b) return 'remove_circle'
  if (b.label === 'balanced') return 'check_circle'
  if (b.label === 'astringent') return 'warning'
  return 'water_drop'
})

// ─── Handlers ─────────────────────────────────────────────────────────────────

function handleClose() {
  emit('update:visible', false)
  emit('close')
}

function onNameBlur() {
  if (!builder.draftName.value.trim()) {
    builder.draftName.value = 'Mi plato'
  }
}

function handleClear() {
  builder.clearItems()
}

async function handleSave() {
  if (!builder.isValid.value || !builder.canSave.value || builder.saving.value) return
  await builder.savePlate()
  // onSaved callback handles emit + close
}

// ─── Lifecycle ───────────────────────────────────────────────────────────────

/** Reset draft on close; init fresh draft on open; ensure food catalog is loaded.
 *
 * `immediate: true` is required so the initial mount with `visible: true`
 * AND an already-loaded active profile applies the age hint without waiting
 * for a subsequent change. The callback is async but its synchronous
 * prelude (`initDraft` + `applyStageHintIfUnset`) runs before any `await`,
 * so the prior sync/async fire-order race is avoided: the hint is applied
 * AFTER `initDraft` clears `draftStageFor`, not before.
 */
watch(
  () => props.visible,
  async (open) => {
    if (open) {
      builder.initDraft()
      // REQ-C4: initDraft clears draftStageFor; re-apply the age hint for
      // the new draft so a close+reopen starts with a fresh inferred stage.
      // (The watcher on babyAgeMonths above picks up profile changes while
      // the drawer is open; the composable's sticky-once-set preserves any
      // manual choice within the same draft.)
      if (babyAgeMonths.value !== null) {
        builder.applyStageHintIfUnset(getSuggestedStageForAge(babyAgeMonths.value))
      }
      if (foodStore.foods.length === 0) {
        await foodStore.fetchFoods()
      }
      // Fetch exposure data for draft foods
      if (drawerFoodIds.value.length > 0) {
        await foodExposure.fetch(drawerFoodIds.value)
      }
    } else {
      builder.resetDraft()
    }
  },
  { immediate: true },
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

.drawer-plate-section {
  align-items: center;
}

/* ─── Plate name input ──────────────────────────────────────────────────── */
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

/* ─── Group toggle ──────────────────────────────────────────────────────── */
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

/* ─── Balance bar ────────────────────────────────────────────────────────── */
.drawer-balance-bar {
  display: flex;
  align-items: center;
  gap: var(--md3-space-2);
  padding: var(--md3-space-2) var(--md3-space-3);
  border-radius: var(--md3-rounded-md);
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-lg);
  font-weight: var(--md3-weight-semibold);
}

.drawer-balance--balanced {
  background: var(--md3-primary-container);
  color: var(--md3-on-primary-container);
}

.drawer-balance--astringent {
  background: var(--md3-error-container);
  color: var(--md3-on-error-container);
}

.drawer-balance--laxative {
  background: var(--md3-tertiary-container);
  color: var(--md3-on-tertiary-container);
}

.drawer-balance-icon {
  font-size: 1.125rem;
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