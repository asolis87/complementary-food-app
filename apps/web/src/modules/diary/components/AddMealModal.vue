<template>
  <!-- Backdrop -->
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-meal-title"
      @click.self="close"
    >
      <div class="modal-card">

        <!-- ── Header ─────────────────────────────────────────────────── -->
        <div class="modal-header">
          <h2 id="add-meal-title" class="modal-title">Nueva comida</h2>
          <button class="close-btn" aria-label="Cerrar" @click="close">
            <span class="material-symbols-outlined" aria-hidden="true">close</span>
          </button>
        </div>

        <!-- ── Form ───────────────────────────────────────────────────── -->
        <div class="form-body">

          <!-- Meal type -->
          <div class="field-group">
            <p class="field-label">Tipo de comida</p>
            <div class="chips-row" role="group" aria-label="Tipo de comida">
              <button
                v-for="type in mealTypes"
                :key="type.value"
                class="meal-chip"
                :class="{ 'meal-chip--active': selectedMealType === type.value }"
                :aria-pressed="selectedMealType === type.value"
                @click="selectedMealType = type.value"
              >
                <span class="material-symbols-outlined chip-icon" aria-hidden="true">{{ type.icon }}</span>
                {{ type.label }}
              </button>
            </div>
          </div>

          <!-- Time -->
          <div class="field-group">
            <label class="field-label" for="meal-time">Hora</label>
            <input
              id="meal-time"
              v-model="selectedTime"
              type="time"
              class="time-input"
              aria-label="Hora de la comida"
            />
          </div>

          <!-- Food search -->
          <div class="field-group">
            <p class="field-label">Alimento</p>
            <div class="search-bar">
              <span class="material-symbols-outlined search-icon" aria-hidden="true">search</span>
              <input
                v-model="searchQuery"
                type="search"
                class="search-input"
                placeholder="Buscar alimento..."
                autocomplete="off"
                aria-label="Buscar alimento para registrar"
                @input="onSearchInput"
              />
              <button v-if="searchQuery" class="clear-search-btn" aria-label="Limpiar búsqueda" @click="clearSearch">
                ×
              </button>
            </div>

            <!-- Search results -->
            <ul
              v-if="debouncedQuery && searchResults.length > 0 && !selectedFood"
              class="food-results"
              role="list"
              aria-label="Resultados de búsqueda"
            >
              <li
                v-for="food in searchResults"
                :key="food.id"
                class="food-result-item"
              >
                <button
                  class="food-result-btn"
                  :aria-label="`Seleccionar ${food.name}`"
                  @click="selectFood(food)"
                >
                  <span class="material-symbols-outlined food-result-icon" aria-hidden="true">nutrition</span>
                  <span class="food-result-name">{{ food.name }}</span>
                  <span class="material-symbols-outlined add-icon" aria-hidden="true">add</span>
                </button>
              </li>
            </ul>

            <div
              v-else-if="debouncedQuery && searchResults.length === 0 && !selectedFood"
              class="search-empty"
              role="status"
            >
              Sin resultados para "{{ debouncedQuery }}"
            </div>

            <!-- Selected food chip -->
            <div v-if="selectedFood" class="selected-food" aria-label="Alimento seleccionado">
              <span class="food-chip food-chip--selected">
                <span class="material-symbols-outlined chip-food-icon" aria-hidden="true">nutrition</span>
                {{ selectedFood.name }}
                <button
                  class="remove-food-btn"
                  :aria-label="`Cambiar ${selectedFood.name}`"
                  @click="clearFood"
                >
                  <span class="material-symbols-outlined" aria-hidden="true">close</span>
                </button>
              </span>
            </div>

            <p v-else class="no-foods-hint">
              Busca y selecciona un alimento para continuar
            </p>
          </div>

          <!-- Reaction -->
          <div class="field-group">
            <p class="field-label">Reacción (opcional)</p>
            <div class="reaction-grid" role="group" aria-label="Reacción del bebé">
              <button
                v-for="r in reactions"
                :key="r.value"
                class="reaction-btn"
                :class="{ 'reaction-btn--active': selectedReaction === r.value }"
                :aria-pressed="selectedReaction === r.value"
                @click="toggleReaction(r.value)"
              >
                <span class="reaction-emoji" aria-hidden="true">{{ r.emoji }}</span>
                <span class="reaction-label">{{ r.label }}</span>
              </button>
            </div>
          </div>

          <!-- Notes -->
          <div class="field-group">
            <label class="field-label" for="meal-notes">Notas (opcional)</label>
            <textarea
              id="meal-notes"
              v-model="notes"
              class="notes-input"
              rows="3"
              placeholder="Ej: Primera vez con pollo, reaccionó bien..."
              maxlength="500"
              aria-label="Notas sobre la comida"
            />
          </div>

        </div>

        <!-- ── Footer ─────────────────────────────────────────────────── -->
        <div class="modal-footer">
          <button class="btn-secondary" @click="close">Cancelar</button>
          <button
            class="btn-primary"
            :disabled="!canSubmit || submitting"
            @click="submit"
          >
            <span v-if="submitting" class="spinner" aria-hidden="true" />
            <span v-else class="material-symbols-outlined" aria-hidden="true">check</span>
            Guardar comida
          </button>
        </div>

        <p v-if="submitError" class="error-msg" role="alert">{{ submitError }}</p>

      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { MealType, ReactionType } from '@pakulab/shared'
import type { Food, CreateMealLogPayload } from '@pakulab/shared'
import { useDiaryStore } from '../../../shared/stores/diaryStore.js'
import { useFoodStore } from '../../../shared/stores/foodStore.js'

// ── Props & Emits ─────────────────────────────────────────────────────────

const props = defineProps<{
  modelValue: boolean
  babyProfileId: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  logged: []
}>()

// ── Stores ────────────────────────────────────────────────────────────────

const diaryStore = useDiaryStore()
const foodStore = useFoodStore()

// ── State ─────────────────────────────────────────────────────────────────

const selectedMealType = ref<MealType>(autoSelectMealType())
const selectedTime = ref<string>(currentTime())
const searchQuery = ref('')
const debouncedQuery = ref('')
const selectedFood = ref<Food | null>(null)
const selectedReaction = ref<ReactionType | null>(null)
const notes = ref('')
const submitting = ref(false)
const submitError = ref<string | null>(null)

let debounceTimer: ReturnType<typeof setTimeout> | null = null

// ── Meal type options ─────────────────────────────────────────────────────

const mealTypes: { value: MealType; label: string; icon: string }[] = [
  { value: MealType.BREAKFAST, label: 'Desayuno', icon: 'wb_sunny' },
  { value: MealType.LUNCH,     label: 'Comida',   icon: 'lunch_dining' },
  { value: MealType.SNACK,     label: 'Colación', icon: 'apple' },
  { value: MealType.DINNER,    label: 'Cena',     icon: 'bedtime' },
]

// ── Reaction options ──────────────────────────────────────────────────────

const reactions: { value: ReactionType; emoji: string; label: string }[] = [
  { value: ReactionType.LIKED,    emoji: '😊', label: 'Le gustó' },
  { value: ReactionType.DISLIKED, emoji: '😣', label: 'No le gustó' },
  { value: ReactionType.NEUTRAL,  emoji: '😐', label: 'Neutral' },
  { value: ReactionType.ALLERGIC, emoji: '🤧', label: 'Alergia' },
  { value: ReactionType.GAS,      emoji: '💨', label: 'Gases' },
  { value: ReactionType.RASH,     emoji: '🔴', label: 'Sarpullido' },
]

// ── Getters ───────────────────────────────────────────────────────────────

const searchResults = computed<Food[]>(() => {
  if (!debouncedQuery.value) return []
  const q = debouncedQuery.value.toLowerCase()
  return foodStore.foods
    .filter((f) => f.name.toLowerCase().includes(q) && f.id !== selectedFood.value?.id)
    .slice(0, 15)
})

const canSubmit = computed(
  () => !!selectedFood.value && !!selectedMealType.value,
)

// ── Helpers ───────────────────────────────────────────────────────────────

function autoSelectMealType(): MealType {
  const hour = new Date().getHours()
  if (hour >= 7 && hour < 11)  return MealType.BREAKFAST
  if (hour >= 11 && hour < 15) return MealType.LUNCH
  if (hour >= 15 && hour < 18) return MealType.SNACK
  return MealType.DINNER
}

function currentTime(): string {
  const now = new Date()
  const hh = String(now.getHours()).padStart(2, '0')
  const mm = String(now.getMinutes()).padStart(2, '0')
  return `${hh}:${mm}`
}

function todayIso(): string {
  return new Date().toISOString().split('T')[0]
}

function onSearchInput() {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    debouncedQuery.value = searchQuery.value.trim()
  }, 300)
}

function clearSearch() {
  searchQuery.value = ''
  debouncedQuery.value = ''
}

function selectFood(food: Food) {
  selectedFood.value = food
  clearSearch()
}

function clearFood() {
  selectedFood.value = null
}

function toggleReaction(reaction: ReactionType) {
  selectedReaction.value = selectedReaction.value === reaction ? null : reaction
}

function close() {
  emit('update:modelValue', false)
}

function resetForm() {
  selectedMealType.value = autoSelectMealType()
  selectedTime.value = currentTime()
  searchQuery.value = ''
  debouncedQuery.value = ''
  selectedFood.value = null
  selectedReaction.value = null
  notes.value = ''
  submitError.value = null
  submitting.value = false
}

// ── Lifecycle ─────────────────────────────────────────────────────────────

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      resetForm()
      // Ensure food catalog is loaded
      if (foodStore.foods.length === 0) {
        foodStore.fetchFoods()
      }
    }
  },
)

// ── Submit ────────────────────────────────────────────────────────────────

async function submit() {
  if (!canSubmit.value || !selectedFood.value) return

  submitting.value = true
  submitError.value = null

  try {
    const payload: CreateMealLogPayload = {
      date: todayIso(),
      time: selectedTime.value || undefined,
      mealType: selectedMealType.value,
      reaction: selectedReaction.value ?? undefined,
      notes: notes.value.trim() || undefined,
      babyProfileId: props.babyProfileId,
      foodId: selectedFood.value.id,
    }
    await diaryStore.logMeal(payload)
    emit('logged')
    close()
  } catch (err) {
    submitError.value = err instanceof Error ? err.message : 'Error al guardar la comida'
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
/* ═══════════════════════════════════════════════════════════════════════
   AddMealModal — Full-form modal para registrar una comida custom
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

/* ─── Header ───────────────────────────────────────────────────── */
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.modal-title {
  font-family: var(--md3-font-headline);
  font-size: var(--md3-title-lg);
  font-weight: var(--md3-weight-semibold);
  color: var(--md3-on-surface);
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
}

.close-btn:hover {
  background: var(--md3-surface-container-high);
}

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

/* ─── Meal type chips ───────────────────────────────────────────── */
.chips-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--md3-space-2);
}

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

.meal-chip:hover {
  background: var(--md3-surface-container-high);
}

.meal-chip--active {
  background: var(--md3-primary-container);
  color: var(--md3-on-primary-container);
  font-weight: var(--md3-weight-semibold);
}

.chip-icon {
  font-size: 1rem;
  line-height: 1;
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

.time-input:focus {
  border-color: var(--md3-primary);
}

/* ─── Food search ───────────────────────────────────────────────── */
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

.search-input:focus {
  border-color: var(--md3-primary);
}

.search-input::-webkit-search-cancel-button {
  display: none;
}

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
  transition: background var(--md3-transition-fast);
}

.clear-search-btn:hover {
  background: var(--md3-surface-container-high);
}

/* Search results list */
.food-results {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  max-height: 200px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--md3-outline-variant) transparent;
}

.food-result-item {
  display: flex;
}

.food-result-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.55rem 0.75rem;
  background: var(--md3-surface-container-low);
  border: none;
  border-radius: var(--md3-rounded-md);
  cursor: pointer;
  text-align: left;
  transition: all var(--md3-transition-fast);
}

.food-result-btn:hover {
  background: var(--md3-primary-container);
}

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
  padding: var(--md3-space-3);
}

/* Selected food */
.selected-food {
  display: flex;
  align-items: center;
  gap: var(--md3-space-2);
  padding: var(--md3-space-2) 0;
}

.food-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 0.75rem;
  background: var(--md3-secondary-container);
  color: var(--md3-on-secondary-container);
  border-radius: var(--md3-rounded-full);
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-md);
  font-weight: var(--md3-weight-medium);
}

.food-chip--selected {
  background: var(--md3-primary-container);
  color: var(--md3-on-primary-container);
  padding: 0.5rem 0.625rem 0.5rem 0.875rem;
}

.chip-food-icon {
  font-size: 0.875rem;
}

.remove-food-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--md3-on-secondary-container);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2px;
  border-radius: 50%;
  transition: background var(--md3-transition-fast);
  opacity: 0.7;
}

.remove-food-btn .material-symbols-outlined {
  font-size: 0.875rem;
}

.remove-food-btn:hover {
  opacity: 1;
  background: rgba(0, 0, 0, 0.1);
}

.no-foods-hint {
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-sm);
  color: var(--md3-on-surface-variant);
  margin: 0;
  font-style: italic;
}

/* ─── Reaction grid ─────────────────────────────────────────────── */
.reaction-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
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

.reaction-emoji {
  font-size: 1.5rem;
  line-height: 1;
}

.reaction-label {
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-sm);
  color: var(--md3-on-surface-variant);
  text-align: center;
  line-height: 1.2;
}

.reaction-btn--active .reaction-label {
  color: var(--md3-on-secondary-container);
  font-weight: var(--md3-weight-semibold);
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
