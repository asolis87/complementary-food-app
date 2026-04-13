<template>
  <Teleport to="body">
    <!-- Backdrop -->
    <Transition name="picker-backdrop">
      <div
        v-if="visible"
        class="picker-backdrop"
        @click="handleClose"
      />
    </Transition>

    <!-- Bottom sheet -->
    <Transition name="picker-slide">
      <div
        v-if="visible"
        class="picker-sheet"
        role="dialog"
        aria-modal="true"
        aria-label="Asignar plato al menú"
      >
        <!-- Drag handle (mobile) -->
        <div class="picker-drag-handle" aria-hidden="true" />

        <!-- Header -->
        <div class="picker-header">
          <div class="picker-header-text">
            <h3 class="picker-title">Asignar al menú</h3>
            <p class="picker-subtitle">{{ plateName }}</p>
          </div>
          <button
            class="picker-skip"
            aria-label="Saltar asignación"
            @click="handleSkip"
          >
            Saltar
          </button>
        </div>

        <!-- Week grid -->
        <div class="picker-grid" role="grid">
          <div class="picker-grid-header" role="row">
            <div class="picker-grid-cell picker-grid-cell--header" role="columnheader" />
            <div
              v-for="day in DAYS"
              :key="day.key"
              class="picker-grid-cell picker-grid-cell--header"
              role="columnheader"
            >
              {{ day.shortName }}
            </div>
          </div>

          <div
            v-for="meal in MEALS"
            :key="meal.key"
            class="picker-grid-row"
            role="row"
          >
            <div class="picker-grid-cell picker-grid-cell--meal" role="rowheader">
              <span class="material-symbols-outlined meal-icon" aria-hidden="true">{{ meal.icon }}</span>
              <span class="meal-name">{{ meal.name }}</span>
            </div>

            <button
              v-for="day in DAYS"
              :key="`${day.key}-${meal.key}`"
              class="picker-grid-cell picker-grid-cell--slot"
              :class="{
                'picker-grid-cell--assigned': isSlotAssigned(day.key, meal.key) && !isSlotSelected(day.key, meal.key),
                'picker-grid-cell--selected': isSlotSelected(day.key, meal.key),
                'picker-grid-cell--confirming': isAssigning && isSlotSelected(day.key, meal.key),
              }"
              role="gridcell"
              :aria-label="`${MEAL_KEY_LABELS[meal.key]} — ${day.name}${isSlotAssigned(day.key, meal.key) ? ' (ocupado)' : ''}${isSlotSelected(day.key, meal.key) ? ' (seleccionado)' : ''}`"
              :aria-pressed="isSlotSelected(day.key, meal.key)"
              :disabled="isAssigning"
              @click="handleSlotToggle(day.key, meal.key)"
            >
              <template v-if="isAssigning && isSlotSelected(day.key, meal.key)">
                <span class="slot-spinner" aria-hidden="true" />
              </template>
              <template v-else-if="isSlotSelected(day.key, meal.key)">
                <span class="material-symbols-outlined check-icon" aria-hidden="true">check</span>
              </template>
              <template v-else-if="isSlotAssigned(day.key, meal.key)">
                <span class="assigned-dot" :title="getAssignedPlateName(day.key, meal.key)" />
              </template>
              <template v-else>
                <span class="plus-icon" aria-hidden="true">+</span>
              </template>
            </button>
          </div>
        </div>

        <!-- Confirm button -->
        <div class="picker-actions">
          <button
            class="picker-confirm"
            :disabled="selectedSlots.size === 0 || isAssigning"
            @click="handleConfirm"
          >
            <span v-if="isAssigning" class="confirm-spinner" aria-hidden="true" />
            <template v-else>
              {{ selectedSlots.size > 0 ? `Asignar (${selectedSlots.size})` : 'Seleccioná horarios' }}
            </template>
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { MealKey, DayKey } from '@pakulab/shared'
import { useMenuStore } from '@/shared/stores/menuStore.js'
import { useProfileStore } from '@/shared/stores/profileStore.js'

// ─── Meal/Day definitions ────────────────────────────────────────────────────

interface MealDef {
  key: MealKey
  name: string
  icon: string
}

interface DayDef {
  key: DayKey
  name: string
  shortName: string
}

/** A single slot selection: day + meal */
export interface SlotSelection {
  dayKey: DayKey
  mealKey: MealKey
}

const MEALS: MealDef[] = [
  { key: 'desayuno', name: 'Desayuno', icon: 'wb_sunny' },
  { key: 'comida', name: 'Comida', icon: 'lunch_dining' },
  { key: 'cena', name: 'Cena', icon: 'bedtime' },
]

const DAYS: DayDef[] = [
  { key: 'lun', name: 'Lunes', shortName: 'Lu' },
  { key: 'mar', name: 'Martes', shortName: 'Ma' },
  { key: 'mie', name: 'Miércoles', shortName: 'Mi' },
  { key: 'jue', name: 'Jueves', shortName: 'Ju' },
  { key: 'vie', name: 'Viernes', shortName: 'Vi' },
  { key: 'sab', name: 'Sábado', shortName: 'Sá' },
  { key: 'dom', name: 'Domingo', shortName: 'Do' },
]

const MEAL_KEY_LABELS: Record<MealKey, string> = {
  desayuno: 'Desayuno',
  comida: 'Comida',
  cena: 'Cena',
  snack1: 'Snack 1',
  snack2: 'Snack 2',
  snack: 'Snack',
} as const

/** Build a unique key for a slot: `${dayKey}:${mealKey}` */
function slotKey(dayKey: DayKey, mealKey: MealKey): string {
  return `${dayKey}:${mealKey}`
}

// ─── Props & emits ──────────────────────────────────────────────────────────

const props = defineProps<{
  visible: boolean
  plateId: string
  plateName: string
}>()

const emit = defineEmits<{
  assigned: [selections: SlotSelection[]]
  close: []
  'update:visible': [value: boolean]
  skip: []
}>()

// ─── Store ───────────────────────────────────────────────────────────────────

const menuStore = useMenuStore()
const profileStore = useProfileStore()
const isAssigning = ref(false)

// ─── Multi-selection state ───────────────────────────────────────────────────

/** Set of selected slot keys ("dayKey:mealKey") — toggled on/off by user */
const selectedSlots = ref<Set<string>>(new Set())

/** Check if a slot is in the user's multi-selection */
function isSlotSelected(dayKey: DayKey, mealKey: MealKey): boolean {
  return selectedSlots.value.has(slotKey(dayKey, mealKey))
}

/** Toggle a slot in/out of the selection */
function handleSlotToggle(dayKey: DayKey, mealKey: MealKey): void {
  if (isAssigning.value) return

  const key = slotKey(dayKey, mealKey)
  const next = new Set(selectedSlots.value)
  if (next.has(key)) {
    next.delete(key)
  } else {
    next.add(key)
  }
  selectedSlots.value = next
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Check if a slot already has a plate assigned */
function isSlotAssigned(dayKey: DayKey, mealKey: MealKey): boolean {
  const plate = menuStore.getPlate(dayKey, mealKey)
  return plate !== null
}

/** Get the name of the plate assigned to a slot */
function getAssignedPlateName(dayKey: DayKey, mealKey: MealKey): string {
  const plate = menuStore.getPlate(dayKey, mealKey)
  return plate?.name ?? ''
}

/**
 * Get the ISO date string (YYYY-MM-DD) for the Monday of the current week.
 * Same logic as MenuWeekPage — ensures MealSlotPicker works independently
 * of whether MenuWeekPage has been visited.
 */
function getCurrentWeekStartISO(): string {
  const now = new Date()
  const dayOfWeek = now.getDay() // 0=Sun…6=Sat
  const diffToMonday = (dayOfWeek + 6) % 7
  const monday = new Date(now)
  monday.setDate(now.getDate() - diffToMonday)
  monday.setHours(0, 0, 0, 0)
  return monday.toISOString().slice(0, 10)
}

// ─── Confirm & assign ───────────────────────────────────────────────────────

/** Parse a slot key back into { dayKey, mealKey } */
function parseSlotKey(key: string): SlotSelection {
  const [dayKey, mealKey] = key.split(':') as [DayKey, MealKey]
  return { dayKey, mealKey }
}

/** Confirm all selected slots: assign the plate and emit */
async function handleConfirm(): Promise<void> {
  if (selectedSlots.value.size === 0 || isAssigning.value) return

  // Ensure profiles are loaded — they may not be if we arrived from PlateBuilderPage
  // without visiting MenuWeekPage or ProfilePage first.
  if (!profileStore.activeProfile) {
    await profileStore.fetchProfiles()
  }

  const profileId = profileStore.activeProfile?.id
  if (!profileId) {
    console.warn('[MealSlotPicker] No active profile after fetch — cannot assign plate')
    return
  }

  isAssigning.value = true

  try {
    // Use currentWeekStart from menuStore if available (navigated from MenuWeekPage),
    // otherwise calculate it — the picker must work standalone from PlateBuilderPage too.
    const weekStart = menuStore.currentWeekStart ?? getCurrentWeekStartISO()

    const { usePlateStore } = await import('@/shared/stores/plateStore.js')
    const plateStore = usePlateStore()
    const plate = plateStore.savedPlates.find(p => p.id === props.plateId)

    if (!plate) {
      console.warn(`[MealSlotPicker] Plate ${props.plateId} not found in savedPlates`)
      return
    }

    // Ensure the weekly menu exists (lazy creation — AD-4).
    // This is critical when opening from PlateBuilderPage where the menu
    // may not have been loaded/created yet.
    await menuStore.ensureMenu(profileId, weekStart)

    // Assign to each selected slot
    const selections: SlotSelection[] = []
    const slotKeys = Array.from(selectedSlots.value)

    for (const key of slotKeys) {
      const { dayKey, mealKey } = parseSlotKey(key)

      // Optimistic UI: menuStore.assignPlate handles per-slot loading and rollback
      try {
        await menuStore.assignPlate(profileId, weekStart, dayKey, mealKey, plate)
        selections.push({ dayKey, mealKey })
      } catch (err) {
        // Continue assigning remaining slots even if one fails
        console.error(`[MealSlotPicker] Failed to assign plate to ${key}:`, err)
      }
    }

    if (selections.length > 0) {
      emit('assigned', selections)
    }

    handleClose()
  } catch (err) {
    console.error('[MealSlotPicker] Failed to assign plates:', err)
  } finally {
    isAssigning.value = false
    selectedSlots.value = new Set()
  }
}

function handleClose() {
  emit('update:visible', false)
  emit('close')
}

function handleSkip() {
  emit('skip')
  handleClose()
}

/** Reset selection when the picker opens */
import { watch } from 'vue'
watch(() => props.visible, (isVisible) => {
  if (isVisible) {
    selectedSlots.value = new Set()
    isAssigning.value = false
  }
})
</script>

<style scoped>
/* ─── Backdrop ──────────────────────────────────────────────────────────── */
.picker-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(11, 15, 15, 0.45);
  backdrop-filter: blur(4px);
  z-index: 1300;
}

/* ─── Bottom sheet ───────────────────────────────────────────────────────── */
.picker-sheet {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1301;
  background: var(--md3-surface-container-lowest);
  border-radius: var(--md3-rounded-lg) var(--md3-rounded-lg) 0 0;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: var(--md3-shadow-elevated);
  overflow: hidden;
}

@media (min-width: 600px) {
  .picker-sheet {
    bottom: auto;
    top: 50%;
    left: 50%;
    right: auto;
    transform: translate(-50%, -50%);
    width: 480px;
    max-width: calc(100vw - 2rem);
    border-radius: var(--md3-rounded-lg);
    max-height: 70vh;
  }
}

/* ─── Drag handle ────────────────────────────────────────────────────────── */
.picker-drag-handle {
  width: 40px;
  height: 4px;
  background: var(--md3-outline-variant);
  border-radius: var(--md3-rounded-full);
  margin: 0.75rem auto 0;
  flex-shrink: 0;
}

@media (min-width: 600px) {
  .picker-drag-handle {
    display: none;
  }
}

/* ─── Header ─────────────────────────────────────────────────────────────── */
.picker-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--md3-space-3) var(--md3-space-4) var(--md3-space-2);
  border-bottom: 1px solid var(--md3-outline-variant);
  flex-shrink: 0;
}

.picker-header-text {
  flex: 1;
  min-width: 0;
}

.picker-title {
  margin: 0;
  font-family: var(--md3-font-headline);
  font-size: var(--md3-title-md);
  font-weight: var(--md3-weight-bold);
  color: var(--md3-on-surface);
}

.picker-subtitle {
  margin: 0.1rem 0 0;
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-sm);
  color: var(--md3-on-surface-variant);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.picker-skip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: var(--md3-rounded-full);
  background: transparent;
  color: var(--md3-on-surface-variant);
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-lg);
  font-weight: var(--md3-weight-semibold);
  cursor: pointer;
  transition: background var(--md3-transition-fast);
  flex-shrink: 0;
  margin-left: var(--md3-space-2);
}

.picker-skip:hover {
  background: var(--md3-surface-container-high);
}

/* ─── Week grid ─────────────────────────────────────────────────────────── */
.picker-grid {
  flex: 1;
  overflow-y: auto;
  padding: var(--md3-space-2) var(--md3-space-3) var(--md3-space-4);
  scrollbar-width: thin;
  scrollbar-color: var(--md3-outline-variant) transparent;
}

.picker-grid-header,
.picker-grid-row {
  display: grid;
  grid-template-columns: 80px repeat(7, 1fr);
  gap: 2px;
}

.picker-grid-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 40px;
  border-radius: var(--md3-rounded-sm);
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-sm);
}

.picker-grid-cell--header {
  font-weight: var(--md3-weight-semibold);
  color: var(--md3-on-surface-variant);
  padding: var(--md3-space-1);
  text-transform: uppercase;
  letter-spacing: var(--md3-label-tracking);
}

.picker-grid-cell--meal {
  justify-content: flex-start;
  gap: var(--md3-space-1);
  padding: 0 var(--md3-space-1);
  font-weight: var(--md3-weight-medium);
  color: var(--md3-on-surface-variant);
}

.picker-grid-cell--slot {
  background: var(--md3-surface-container-low);
  cursor: pointer;
  transition: background var(--md3-transition-fast), transform 0.1s ease;
  position: relative;
}

.picker-grid-cell--slot:hover:not(:disabled) {
  background: var(--md3-surface-container);
}

.picker-grid-cell--slot:active:not(:disabled) {
  transform: scale(0.95);
}

.picker-grid-cell--slot:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.picker-grid-cell--assigned {
  background: var(--md3-surface-container);
}

.picker-grid-cell--selected {
  background: var(--md3-primary-container);
  color: var(--md3-on-primary-container);
}

.picker-grid-cell--confirming {
  opacity: 0.7;
}

/* ─── Meal label ─────────────────────────────────────────────────────────── */
.meal-icon {
  font-size: 1rem;
  flex-shrink: 0;
}

.meal-name {
  font-size: var(--md3-label-sm);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ─── Slot content ───────────────────────────────────────────────────────── */
.plus-icon {
  font-size: 1rem;
  font-weight: var(--md3-weight-bold);
  color: var(--md3-primary);
  opacity: 0.6;
}

.assigned-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--md3-on-surface-variant);
  flex-shrink: 0;
}

.check-icon {
  font-size: 1.1rem;
  color: var(--md3-primary);
  flex-shrink: 0;
}

.slot-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid var(--md3-outline-variant);
  border-top-color: var(--md3-primary);
  border-radius: 50%;
  animation: picker-spin 0.6s linear infinite;
}

/* ─── Confirm button area ────────────────────────────────────────────────── */
.picker-actions {
  padding: var(--md3-space-2) var(--md3-space-4) var(--md3-space-4);
  flex-shrink: 0;
  border-top: 1px solid var(--md3-outline-variant);
}

.picker-confirm {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--md3-space-2);
  width: 100%;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: var(--md3-rounded-full);
  background: var(--md3-primary);
  color: var(--md3-on-primary);
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-lg);
  font-weight: var(--md3-weight-semibold);
  cursor: pointer;
  transition: background var(--md3-transition-fast), opacity var(--md3-transition-fast);
}

.picker-confirm:hover:not(:disabled) {
  background: var(--md3-primary-hover, color-mix(in srgb, var(--md3-primary) 88%, #000));
}

.picker-confirm:active:not(:disabled) {
  background: var(--md3-primary-active, color-mix(in srgb, var(--md3-primary) 75%, #000));
}

.picker-confirm:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.confirm-spinner {
  width: 18px;
  height: 18px;
  border: 2px solid var(--md3-on-primary);
  border-top-color: transparent;
  border-radius: 50%;
  animation: picker-spin 0.6s linear infinite;
}

@keyframes picker-spin {
  to { transform: rotate(360deg); }
}

/* ─── Transitions ───────────────────────────────────────────────────────── */

/* Backdrop */
.picker-backdrop-enter-active,
.picker-backdrop-leave-active {
  transition: opacity 0.2s ease;
}
.picker-backdrop-enter-from,
.picker-backdrop-leave-to {
  opacity: 0;
}

/* Sheet slide-in from bottom */
.picker-slide-enter-active,
.picker-slide-leave-active {
  transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease;
}
.picker-slide-enter-from,
.picker-slide-leave-to {
  transform: translateY(100%);
  opacity: 0;
}

@media (min-width: 600px) {
  .picker-slide-enter-from,
  .picker-slide-leave-to {
    transform: translate(-50%, -44%);
    opacity: 0;
  }
  .picker-slide-enter-active,
  .picker-slide-leave-active {
    transform-origin: center;
  }
}

/* ─── Mobile responsive ──────────────────────────────────────────────────── */
@media (max-width: 400px) {
  .picker-grid-header,
  .picker-grid-row {
    grid-template-columns: 60px repeat(7, 1fr);
  }

  .meal-name {
    display: none;
  }
}
</style>