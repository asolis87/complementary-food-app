<template>
  <!-- Backdrop -->
  <Teleport to="body">
    <div
      v-if="open"
      class="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-log-title"
      @click.self="cancel"
    >
      <div class="modal-card">

        <!-- ── Header ─────────────────────────────────────────────────── -->
        <div class="modal-header">
          <div class="modal-header-text">
            <h2 id="edit-log-title" class="modal-title">Editar registro</h2>
            <p class="modal-subtitle">{{ entry.food?.name ?? 'Alimento' }}</p>
          </div>
          <button class="close-btn" aria-label="Cerrar" @click="cancel">
            <span class="material-symbols-outlined" aria-hidden="true">close</span>
          </button>
        </div>

        <!-- ── Food (editable behind "Cambiar alimento") ──────────────── -->
        <div class="food-info">
          <span class="material-symbols-outlined food-icon" aria-hidden="true">nutrition</span>
          <span class="food-name">{{ currentFoodName }}</span>
          <button
            v-if="!isEditingFood && !foodChanged"
            class="link-btn"
            type="button"
            @click="startEditingFood"
          >
            Cambiar
          </button>
          <button
            v-if="foodChanged"
            class="link-btn link-btn--undo"
            type="button"
            @click="revertFood"
          >
            Deshacer
          </button>
        </div>

        <!-- Inline food search (visible only when changing food) -->
        <div v-if="isEditingFood" class="food-search-block">
          <div class="search-bar">
            <span class="material-symbols-outlined search-icon" aria-hidden="true">search</span>
            <input
              v-model="foodSearchQuery"
              type="search"
              class="search-input"
              placeholder="Buscar otro alimento..."
              autocomplete="off"
              aria-label="Buscar alimento"
              @input="onFoodSearchInput"
            />
            <button
              v-if="foodSearchQuery"
              class="clear-search-btn"
              type="button"
              aria-label="Limpiar búsqueda"
              @click="clearFoodSearch"
            >
              ×
            </button>
          </div>

          <ul
            v-if="debouncedFoodQuery && foodSearchResults.length > 0"
            class="food-results"
            role="list"
            aria-label="Resultados de búsqueda"
          >
            <li
              v-for="food in foodSearchResults"
              :key="food.id"
              class="food-result-item"
            >
              <button
                class="food-result-btn"
                type="button"
                :aria-label="`Seleccionar ${food.name}`"
                @click="pickFood(food)"
              >
                <span class="material-symbols-outlined food-result-icon" aria-hidden="true">nutrition</span>
                <span class="food-result-name">{{ food.name }}</span>
                <span class="material-symbols-outlined add-icon" aria-hidden="true">check</span>
              </button>
            </li>
          </ul>

          <p
            v-else-if="debouncedFoodQuery && foodSearchResults.length === 0"
            class="search-empty"
            role="status"
          >
            Sin resultados para "{{ debouncedFoodQuery }}"
          </p>

          <button
            class="link-btn link-btn--cancel"
            type="button"
            @click="cancelEditingFood"
          >
            Cancelar cambio
          </button>
        </div>

        <!-- ── Form body ──────────────────────────────────────────────── -->
        <div class="form-body">

          <!-- Meal type -->
          <div class="field-group">
            <p class="field-label">Tipo de comida</p>
            <div class="chips-row" role="group" aria-label="Tipo de comida">
              <button
                v-for="type in mealTypes"
                :key="type.value"
                class="meal-chip"
                type="button"
                :class="{ 'meal-chip--active': localMealType === type.value }"
                :aria-pressed="localMealType === type.value"
                @click="localMealType = type.value"
              >
                <span class="material-symbols-outlined chip-icon" aria-hidden="true">{{ type.icon }}</span>
                {{ type.label }}
              </button>
            </div>
          </div>

          <!-- Time -->
          <div class="field-group">
            <label class="field-label" for="edit-meal-time">Hora</label>
            <input
              id="edit-meal-time"
              v-model="localTime"
              type="time"
              class="time-input"
              aria-label="Hora de la comida"
            />
          </div>

          <!-- ¿Lo aceptó? toggle -->
          <div class="field-group">
            <p class="field-label">¿Lo aceptó?</p>
            <div class="chips-row" role="group" aria-label="¿Lo aceptó?">
              <button
                class="choice-chip"
                :class="{ 'choice-chip--active': localAccepted === true }"
                :aria-pressed="localAccepted === true"
                @click="localAccepted = localAccepted === true ? null : true"
              >
                <span class="material-symbols-outlined chip-icon" aria-hidden="true">check_circle</span>
                Sí
              </button>
              <button
                class="choice-chip choice-chip--no"
                :class="{ 'choice-chip--active choice-chip--no-active': localAccepted === false }"
                :aria-pressed="localAccepted === false"
                @click="localAccepted = localAccepted === false ? null : false"
              >
                <span class="material-symbols-outlined chip-icon" aria-hidden="true">cancel</span>
                No
              </button>
              <button
                class="choice-chip choice-chip--neutral"
                :class="{ 'choice-chip--active choice-chip--neutral-active': localAccepted === null }"
                :aria-pressed="localAccepted === null"
                @click="localAccepted = null"
              >
                <span class="material-symbols-outlined chip-icon" aria-hidden="true">help</span>
                Sin revisar
              </button>
            </div>
          </div>

          <!-- Reaction picker -->
          <div class="field-group">
            <p class="field-label">Reacción (opcional)</p>
            <div class="reaction-grid" role="group" aria-label="Reacción del bebé">
              <button
                v-for="r in reactions"
                :key="r.value"
                class="reaction-btn"
                :class="{ 'reaction-btn--active': localReaction === r.value }"
                :aria-pressed="localReaction === r.value"
                @click="toggleReaction(r.value)"
              >
                <span class="reaction-emoji" aria-hidden="true">{{ r.emoji }}</span>
                <span class="reaction-label-text">{{ r.label }}</span>
              </button>
              <!-- Clear reaction option -->
              <button
                class="reaction-btn reaction-btn--clear"
                :class="{ 'reaction-btn--active': localReaction === null }"
                :aria-pressed="localReaction === null"
                @click="localReaction = null"
              >
                <span class="reaction-emoji" aria-hidden="true">—</span>
                <span class="reaction-label-text">Sin revisar</span>
              </button>
            </div>
          </div>

          <!-- Notes -->
          <div class="field-group">
            <label class="field-label" for="edit-notes">Notas (opcional)</label>
            <textarea
              id="edit-notes"
              v-model="localNotes"
              class="notes-input"
              rows="3"
              placeholder="Ej: Le costó un poco al principio pero después aceptó bien..."
              maxlength="500"
              aria-label="Notas sobre la comida"
            />
            <p class="char-count" :class="{ 'char-count--warn': localNotes.length >= 450 }">
              {{ localNotes.length }}/500
            </p>
          </div>

        </div>

        <!-- ── Footer ─────────────────────────────────────────────────── -->
        <div class="modal-footer">
          <button class="btn-secondary" @click="cancel">Cancelar</button>
          <button
            class="btn-primary"
            :disabled="submitting || !hasChanges"
            @click="save"
          >
            <span v-if="submitting" class="spinner" aria-hidden="true" />
            <span v-else class="material-symbols-outlined" aria-hidden="true">check</span>
            Guardar cambios
          </button>
        </div>

        <p v-if="submitError" class="error-msg" role="alert">{{ submitError }}</p>

      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ReactionType, MealType } from '@pakulab/shared'
import type { Food, MealLog, UpdateMealLogPayload } from '@pakulab/shared'
import { useDiaryStore } from '../../../shared/stores/diaryStore.js'
import { useDashboardStore } from '../../../shared/stores/dashboardStore.js'
import { useUiStore } from '../../../shared/stores/uiStore.js'
import { useFoodStore } from '../../../shared/stores/foodStore.js'
import { normalizeAccents } from '../../../shared/utils/text.js'

// ── Props & Emits ─────────────────────────────────────────────────────────

const props = defineProps<{
  entry: MealLog
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [boolean]
  updated: []
}>()

// ── Stores ────────────────────────────────────────────────────────────────

const diaryStore = useDiaryStore()
const dashboardStore = useDashboardStore()
const uiStore = useUiStore()
const foodStore = useFoodStore()

// ── Local state ───────────────────────────────────────────────────────────

const localReaction = ref<ReactionType | null>(null)
const localAccepted = ref<boolean | null>(null)
const localNotes = ref('')
const localMealType = ref<MealType>(MealType.LUNCH)
const localTime = ref<string>('')
const localFoodId = ref<string>('')
const localFoodName = ref<string>('')
const submitting = ref(false)
const submitError = ref<string | null>(null)

// ── Food picker state ─────────────────────────────────────────────────────

const isEditingFood = ref(false)
const foodSearchQuery = ref('')
const debouncedFoodQuery = ref('')
let foodDebounceTimer: ReturnType<typeof setTimeout> | null = null

// ── Meal type options ─────────────────────────────────────────────────────

const mealTypes: { value: MealType; label: string; icon: string }[] = [
  { value: MealType.BREAKFAST, label: 'Desayuno', icon: 'wb_sunny' },
  { value: MealType.LUNCH,     label: 'Comida',   icon: 'lunch_dining' },
  { value: MealType.SNACK,     label: 'Colación', icon: 'nutrition' },
  { value: MealType.DINNER,    label: 'Cena',     icon: 'bedtime' },
]

// ── Reaction options ──────────────────────────────────────────────────────

const reactions: { value: ReactionType; emoji: string; label: string }[] = [
  { value: ReactionType.LIKED,    emoji: '😊', label: 'Le gustó' },
  { value: ReactionType.DISLIKED, emoji: '😣', label: 'No le gustó' },
  { value: ReactionType.NEUTRAL,  emoji: '😐', label: 'Neutral' },
  { value: ReactionType.REJECTED, emoji: '🙅', label: 'Lo rechazó' },
]

// ── Init local state from entry when modal opens ──────────────────────────

function initFromEntry(entry: MealLog) {
  localReaction.value = entry.reaction ?? null
  localAccepted.value = entry.accepted ?? null
  localNotes.value = entry.notes ?? ''
  localMealType.value = entry.mealType
  localTime.value = entry.time ?? ''
  localFoodId.value = entry.foodId
  localFoodName.value = entry.food?.name ?? '—'
  isEditingFood.value = false
  foodSearchQuery.value = ''
  debouncedFoodQuery.value = ''
}

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      initFromEntry(props.entry)
      submitError.value = null
      submitting.value = false
      if (foodStore.foods.length === 0) {
        foodStore.fetchFoods()
      }
    }
  },
  { immediate: true },
)

// Also re-init if entry changes while open (e.g. sequential editing)
watch(
  () => props.entry,
  (newEntry) => {
    if (props.open) initFromEntry(newEntry)
  },
)

// ── Helpers ───────────────────────────────────────────────────────────────

const currentFoodName = computed(() => localFoodName.value || '—')
const foodChanged = computed(() => localFoodId.value !== props.entry.foodId)

const foodSearchResults = computed<Food[]>(() => {
  if (!debouncedFoodQuery.value) return []
  const q = normalizeAccents(debouncedFoodQuery.value.toLowerCase())
  return foodStore.foods
    .filter(
      (f) =>
        normalizeAccents(f.name.toLowerCase()).includes(q) &&
        f.id !== localFoodId.value,
    )
    .slice(0, 15)
})

/** True when at least one field differs from the original entry */
const hasChanges = computed(() => {
  const origReaction = props.entry.reaction ?? null
  const origAccepted = props.entry.accepted ?? null
  const origNotes = props.entry.notes ?? ''
  const origTime = props.entry.time ?? ''
  return (
    localReaction.value !== origReaction ||
    localAccepted.value !== origAccepted ||
    (localNotes.value.trim() || null) !== (origNotes || null) ||
    localMealType.value !== props.entry.mealType ||
    localTime.value !== origTime ||
    localFoodId.value !== props.entry.foodId
  )
})

function toggleReaction(reaction: ReactionType) {
  localReaction.value = localReaction.value === reaction ? null : reaction
}

function onFoodSearchInput() {
  if (foodDebounceTimer) clearTimeout(foodDebounceTimer)
  foodDebounceTimer = setTimeout(() => {
    debouncedFoodQuery.value = foodSearchQuery.value.trim()
  }, 300)
}

function clearFoodSearch() {
  foodSearchQuery.value = ''
  debouncedFoodQuery.value = ''
}

function startEditingFood() {
  isEditingFood.value = true
  if (foodStore.foods.length === 0) foodStore.fetchFoods()
}

function cancelEditingFood() {
  isEditingFood.value = false
  clearFoodSearch()
}

function pickFood(food: Food) {
  localFoodId.value = food.id
  localFoodName.value = food.name
  isEditingFood.value = false
  clearFoodSearch()
}

function revertFood() {
  localFoodId.value = props.entry.foodId
  localFoodName.value = props.entry.food?.name ?? '—'
  cancelEditingFood()
}

function close() {
  emit('update:open', false)
}

function cancel() {
  close()
}

// ── Save ──────────────────────────────────────────────────────────────────

async function save() {
  submitting.value = true
  submitError.value = null

  try {
    const payload: UpdateMealLogPayload = {
      reaction: localReaction.value,
      accepted: localAccepted.value,
      notes: localNotes.value.trim() || null,
    }
    if (localMealType.value !== props.entry.mealType) {
      payload.mealType = localMealType.value
    }
    const origTime = props.entry.time ?? ''
    if (localTime.value !== origTime) {
      payload.time = localTime.value || null
    }
    if (localFoodId.value !== props.entry.foodId) {
      payload.foodId = localFoodId.value
    }
    await diaryStore.updateEntry(props.entry.id, payload)
    dashboardStore.invalidate()
    uiStore.addToast('Registro actualizado', 'success')
    emit('updated')
    close()
  } catch (err) {
    submitError.value = err instanceof Error ? err.message : 'Error al guardar los cambios'
    uiStore.addToast('Error al actualizar el registro', 'error')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
/* ═══════════════════════════════════════════════════════════════════════
   EditLogModal — Editar reacción, aceptación y notas de un registro
   MD3 design tokens, no border lines
   ═══════════════════════════════════════════════════════════════════════ */

.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 200;
  animation: fade-in 0.15s ease;
}

@media (min-width: 600px) {
  .modal-backdrop {
    align-items: center;
    padding: var(--md3-space-4);
  }
}

@keyframes fade-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}

.modal-card {
  background: var(--md3-surface);
  border-radius: var(--md3-rounded-xl) var(--md3-rounded-xl) 0 0;
  width: 100%;
  max-width: 480px;
  padding: var(--md3-space-6) var(--md3-space-6) var(--md3-space-4);
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-5);
  animation: slide-up 0.25s ease;
  max-height: 92vh;
  overflow: hidden;
}

@media (min-width: 600px) {
  .modal-card {
    border-radius: var(--md3-rounded-xl);
    max-height: 90vh;
  }
}

@keyframes slide-up {
  from { transform: translateY(24px); opacity: 0; }
  to   { transform: translateY(0);    opacity: 1; }
}

/* ─── Header ────────────────────────────────────────────────────── */
.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--md3-space-3);
  flex-shrink: 0;
}

.modal-header-text {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.modal-title {
  font-family: var(--md3-font-headline);
  font-size: var(--md3-title-lg);
  font-weight: var(--md3-weight-semibold);
  color: var(--md3-on-surface);
  margin: 0;
}

.modal-subtitle {
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-sm);
  color: var(--md3-on-surface-variant);
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--md3-on-surface-variant);
  padding: var(--md3-space-1);
  border-radius: var(--md3-rounded-full);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background var(--md3-transition-fast);
  flex-shrink: 0;
}

.close-btn:hover {
  background: var(--md3-surface-container-high);
}

/* ─── Food info ─────────────────────────────────────────────────── */
.food-info {
  display: flex;
  align-items: center;
  gap: var(--md3-space-2);
  background: var(--md3-tertiary-container);
  border-radius: var(--md3-rounded-md);
  padding: var(--md3-space-3) var(--md3-space-4);
  flex-shrink: 0;
}

.food-icon {
  font-size: 1.25rem;
  color: var(--md3-on-tertiary-container);
  flex-shrink: 0;
}

.food-name {
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-lg);
  font-weight: var(--md3-weight-semibold);
  color: var(--md3-on-tertiary-container);
  flex: 1;
}

.link-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-md);
  font-weight: var(--md3-weight-semibold);
  color: var(--md3-on-tertiary-container);
  text-decoration: underline;
  padding: var(--md3-space-1) var(--md3-space-2);
  border-radius: var(--md3-rounded-sm);
  transition: opacity var(--md3-transition-fast);
}

.link-btn:hover { opacity: 0.75; }
.link-btn--undo { color: var(--md3-error); }
.link-btn--cancel {
  color: var(--md3-on-surface-variant);
  align-self: flex-start;
  margin-top: var(--md3-space-1);
}

/* ─── Inline food search ────────────────────────────────────────── */
.food-search-block {
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-2);
  padding: var(--md3-space-3);
  background: var(--md3-surface-container-low);
  border-radius: var(--md3-rounded-md);
  flex-shrink: 0;
}

.search-bar {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 0.75rem;
  font-size: 1.1rem;
  color: var(--md3-on-surface-variant);
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 0.6rem 2.5rem 0.6rem 2.5rem;
  border: 2px solid var(--md3-outline-variant);
  border-radius: var(--md3-rounded-md);
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-md);
  color: var(--md3-on-surface);
  background: var(--md3-surface-container-lowest);
  outline: none;
  transition: border-color var(--md3-transition-fast);
  box-sizing: border-box;
}

.search-input:focus { border-color: var(--md3-primary); }
.search-input::-webkit-search-cancel-button { display: none; }

.clear-search-btn {
  position: absolute;
  right: 0.6rem;
  background: var(--md3-surface-container);
  border: none;
  border-radius: var(--md3-rounded-full);
  width: 20px;
  height: 20px;
  cursor: pointer;
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--md3-on-surface-variant);
}

.food-results {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  max-height: 200px;
  overflow-y: auto;
}

.food-result-item { display: flex; }

.food-result-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.55rem 0.75rem;
  background: var(--md3-surface-container-lowest);
  border: none;
  border-radius: var(--md3-rounded-md);
  cursor: pointer;
  text-align: left;
  transition: background var(--md3-transition-fast);
}

.food-result-btn:hover { background: var(--md3-primary-container); }

.food-result-icon {
  font-size: 1rem;
  color: var(--md3-on-surface-variant);
  flex-shrink: 0;
}

.food-result-name {
  flex: 1;
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-md);
  color: var(--md3-on-surface);
}

.add-icon {
  font-size: 1.1rem;
  color: var(--md3-primary);
}

.search-empty {
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-sm);
  color: var(--md3-on-surface-variant);
  text-align: center;
  padding: var(--md3-space-2);
  margin: 0;
}

/* ─── Meal type chips ───────────────────────────────────────────── */
.meal-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 1rem;
  background: var(--md3-surface-container);
  color: var(--md3-on-surface-variant);
  border: none;
  border-radius: var(--md3-rounded-full);
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-lg);
  font-weight: var(--md3-weight-medium);
  cursor: pointer;
  transition: all var(--md3-transition-fast);
}

.meal-chip:hover { background: var(--md3-surface-container-high); }

.meal-chip--active {
  background: var(--md3-primary-container);
  color: var(--md3-on-primary-container);
  font-weight: var(--md3-weight-semibold);
}

/* ─── Time input ────────────────────────────────────────────────── */
.time-input {
  width: fit-content;
  padding: 0.55rem 0.875rem;
  background: var(--md3-surface-container-lowest);
  border: 2px solid var(--md3-outline-variant);
  border-radius: var(--md3-rounded-md);
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-md);
  color: var(--md3-on-surface);
  outline: none;
  transition: border-color var(--md3-transition-fast);
}

.time-input:focus { border-color: var(--md3-primary); }

/* ─── Form body ─────────────────────────────────────────────────── */
.form-body {
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-5);
  overflow-y: auto;
  padding-right: var(--md3-space-1);
  scrollbar-width: thin;
  scrollbar-color: var(--md3-outline-variant) transparent;
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-2);
}

.field-label {
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-lg);
  font-weight: var(--md3-weight-semibold);
  color: var(--md3-on-surface);
  margin: 0;
}

/* ─── Choice chips (Sí / No / Sin revisar) ──────────────────────── */
.chips-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--md3-space-2);
}

.choice-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 1rem;
  background: var(--md3-surface-container);
  color: var(--md3-on-surface-variant);
  border: none;
  border-radius: var(--md3-rounded-full);
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-lg);
  font-weight: var(--md3-weight-medium);
  cursor: pointer;
  transition: all var(--md3-transition-fast);
}

.choice-chip:hover {
  background: var(--md3-surface-container-high);
}

/* Active state — "Sí" → primary-container (green) */
.choice-chip--active {
  background: var(--md3-primary-container);
  color: var(--md3-on-primary-container);
  font-weight: var(--md3-weight-semibold);
}

/* "No" active → error-container (red) */
.choice-chip--no-active {
  background: var(--md3-error-container);
  color: var(--md3-on-error-container);
}

/* "Sin revisar" active → surface-container */
.choice-chip--neutral-active {
  background: var(--md3-surface-container-high);
  color: var(--md3-on-surface-variant);
}

.chip-icon {
  font-size: 1rem;
  line-height: 1;
}

/* ─── Reaction grid ─────────────────────────────────────────────── */
.reaction-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--md3-space-2);
}

.reaction-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--md3-space-1);
  padding: var(--md3-space-2) var(--md3-space-1);
  background: var(--md3-surface-container-low);
  border: 2px solid transparent;
  border-radius: var(--md3-rounded-md);
  cursor: pointer;
  transition: all var(--md3-transition-fast);
}

.reaction-btn:hover {
  background: var(--md3-surface-container);
}

.reaction-btn--active {
  background: var(--md3-secondary-container);
  border-color: var(--md3-secondary);
}

.reaction-btn--clear.reaction-btn--active {
  background: var(--md3-surface-container);
  border-color: var(--md3-outline-variant);
}

.reaction-emoji {
  font-size: 1.5rem;
  line-height: 1;
}

.reaction-label-text {
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-sm);
  color: var(--md3-on-surface-variant);
  text-align: center;
  line-height: 1.2;
}

.reaction-btn--active .reaction-label-text {
  color: var(--md3-on-secondary-container);
  font-weight: var(--md3-weight-semibold);
}

.reaction-btn--clear.reaction-btn--active .reaction-label-text {
  color: var(--md3-on-surface-variant);
}

/* ─── Notes input ───────────────────────────────────────────────── */
.notes-input {
  width: 100%;
  padding: var(--md3-space-3);
  background: var(--md3-surface-container-lowest);
  border: 2px solid var(--md3-outline-variant);
  border-radius: var(--md3-rounded-md);
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-md);
  color: var(--md3-on-surface);
  resize: vertical;
  outline: none;
  transition: border-color var(--md3-transition-fast);
  box-sizing: border-box;
}

.notes-input:focus {
  border-color: var(--md3-primary);
}

.notes-input::placeholder {
  color: var(--md3-on-surface-variant);
  opacity: 0.7;
}

.char-count {
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-sm);
  color: var(--md3-outline);
  text-align: right;
  margin: 0;
}

.char-count--warn {
  color: var(--md3-error);
}

/* ─── Footer buttons ────────────────────────────────────────────── */
.modal-footer {
  display: flex;
  gap: var(--md3-space-3);
  flex-shrink: 0;
  padding-top: var(--md3-space-2);
}

.btn-primary {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--md3-space-2);
  padding: 0.75rem 1.5rem;
  background: var(--md3-primary);
  color: var(--md3-on-primary);
  border: none;
  border-radius: var(--md3-rounded-full);
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-lg);
  font-weight: var(--md3-weight-semibold);
  cursor: pointer;
  transition: all var(--md3-transition-fast);
}

.btn-primary:hover:not(:disabled) {
  filter: brightness(0.92);
}

.btn-primary:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.btn-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--md3-space-2);
  padding: 0.75rem 1.25rem;
  background: var(--md3-surface-container);
  color: var(--md3-on-surface-variant);
  border: none;
  border-radius: var(--md3-rounded-full);
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-lg);
  font-weight: var(--md3-weight-medium);
  cursor: pointer;
  transition: all var(--md3-transition-fast);
}

.btn-secondary:hover {
  background: var(--md3-surface-container-high);
}

/* ─── Spinner ───────────────────────────────────────────────────── */
.spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ─── Error message ─────────────────────────────────────────────── */
.error-msg {
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-sm);
  color: var(--md3-error);
  margin: 0;
  text-align: center;
  flex-shrink: 0;
}
</style>
