<template>
  <!-- Backdrop -->
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-log-title"
      @click.self="close"
    >
      <div class="modal-card">

        <!-- ── Header ─────────────────────────────────────────────────── -->
        <div class="modal-header">
          <div class="modal-header-text">
            <h2 id="quick-log-title" class="modal-title">Registrar comida</h2>
            <p class="modal-subtitle">{{ plate.name }}</p>
          </div>
          <button class="close-btn" aria-label="Cerrar" @click="close">
            <span class="material-symbols-outlined" aria-hidden="true">close</span>
          </button>
        </div>

        <!-- ── Food count summary ────────────────────────────────────── -->
        <div class="food-summary">
          <span class="material-symbols-outlined summary-icon" aria-hidden="true">restaurant</span>
          <span v-if="foodItems.length > 0" class="summary-text">
            {{ foodItems.length }} {{ foodItems.length === 1 ? 'alimento' : 'alimentos' }}
          </span>
          <span v-else class="summary-text summary-text--empty">
            Este plato no tiene alimentos
          </span>
        </div>

        <!-- ── Meal type selection ────────────────────────────────────── -->
        <div class="step-body">
          <p class="step-label">Tipo de comida</p>
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

          <!-- ── Confirm button ───────────────────────────────────────── -->
          <button
            class="btn-primary"
            :disabled="foodItems.length === 0 || submitting"
            @click="submit"
          >
            <span v-if="submitting" class="spinner" aria-hidden="true" />
            <span v-else class="material-symbols-outlined" aria-hidden="true">check</span>
            Confirmar
          </button>

          <p v-if="submitError" class="error-msg" role="alert">{{ submitError }}</p>
        </div>

      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { MealType, derivePlateBalanceLabel } from '@pakulab/shared'
import type { CreateMealLogPayload, Plate } from '@pakulab/shared'
import { useDiaryStore } from '../../../shared/stores/diaryStore.js'
import { useUiStore } from '../../../shared/stores/uiStore.js'

// ── Props & Emits ─────────────────────────────────────────────────────────

const props = defineProps<{
  plate: Plate
  babyProfileId: string
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  logged: []
}>()

// ── Stores ────────────────────────────────────────────────────────────────

const diaryStore = useDiaryStore()
const uiStore = useUiStore()

// ── State ─────────────────────────────────────────────────────────────────

const selectedMealType = ref<MealType>(MealType.BREAKFAST)
const submitting = ref(false)
const submitError = ref<string | null>(null)

// ── Derived ───────────────────────────────────────────────────────────────

/** Food items that have a valid food.id for logging */
const foodItems = computed(() =>
  (props.plate.items ?? []).filter((item) => item.food?.id ?? item.foodId),
)

// ── Meal type options ─────────────────────────────────────────────────────

const mealTypes: { value: MealType; label: string; icon: string }[] = [
  { value: MealType.BREAKFAST, label: 'Desayuno', icon: 'wb_sunny' },
  { value: MealType.LUNCH,     label: 'Comida',   icon: 'lunch_dining' },
  { value: MealType.SNACK,     label: 'Colación', icon: 'apple' },
  { value: MealType.DINNER,    label: 'Cena',     icon: 'bedtime' },
]

// Auto-select meal type based on current hour
function autoSelectMealType(): MealType {
  const hour = new Date().getHours()
  if (hour >= 7 && hour < 11)  return MealType.BREAKFAST
  if (hour >= 11 && hour < 15) return MealType.LUNCH
  if (hour >= 15 && hour < 18) return MealType.SNACK
  return MealType.DINNER
}

// ── Lifecycle ─────────────────────────────────────────────────────────────

// Reset state when modal opens
watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      selectedMealType.value = autoSelectMealType()
      submitError.value = null
      submitting.value = false
    }
  },
)

// ── Helpers ───────────────────────────────────────────────────────────────

function close() {
  emit('update:modelValue', false)
}

function todayIso(): string {
  return new Date().toISOString().split('T')[0]
}

function currentTime(): string {
  const now = new Date()
  const hh = String(now.getHours()).padStart(2, '0')
  const mm = String(now.getMinutes()).padStart(2, '0')
  return `${hh}:${mm}`
}

// ── Submit ────────────────────────────────────────────────────────────────

async function submit() {
  if (foodItems.value.length === 0) return

  submitting.value = true
  submitError.value = null

  const plateBalanceLabel = derivePlateBalanceLabel(props.plate.balanceScore)
  const date = todayIso()
  const time = currentTime()

  const payloads: CreateMealLogPayload[] = foodItems.value.map((item) => ({
    babyProfileId: props.babyProfileId,
    foodId: item.food?.id ?? item.foodId,
    date,
    time,
    mealType: selectedMealType.value,
    plateId: props.plate.id,
    plateBalanceLabel,
  }))

  const results = await Promise.allSettled(payloads.map((p) => diaryStore.logMeal(p)))

  const succeeded = results.filter((r) => r.status === 'fulfilled').length
  const failed = results.filter((r) => r.status === 'rejected').length
  const total = payloads.length

  submitting.value = false

  if (failed === 0) {
    // All succeeded
    uiStore.addToast(
      `${succeeded} ${succeeded === 1 ? 'alimento registrado' : 'alimentos registrados'}`,
      'success',
    )
    emit('logged')
    close()
  } else if (succeeded > 0) {
    // Partial failure — some succeeded
    uiStore.addToast(
      `Error al registrar ${failed} de ${total} alimentos`,
      'warning',
    )
    emit('logged')
    close()
  } else {
    // Total failure
    submitError.value = 'Error al registrar los alimentos. Intentá de nuevo.'
    uiStore.addToast('Error al registrar los alimentos', 'error')
  }
}
</script>

<style scoped>
/* ═══════════════════════════════════════════════════════════════════════
   QuickLogModal — Confirmación rápida de plato (1-click)
   MD3 design tokens, no border lines
   ═══════════════════════════════════════════════════════════════════════ */

.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--md3-space-4);
  z-index: 200;
  animation: fade-in 0.15s ease;
}

@keyframes fade-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}

.modal-card {
  background: var(--md3-surface);
  border-radius: var(--md3-rounded-xl);
  width: 100%;
  max-width: 420px;
  padding: var(--md3-space-6);
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-5);
  animation: slide-up 0.2s ease;
  max-height: 90vh;
  overflow-y: auto;
}

@keyframes slide-up {
  from { transform: translateY(16px); opacity: 0; }
  to   { transform: translateY(0);    opacity: 1; }
}

/* ─── Header ───────────────────────────────────────────────── */
.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--md3-space-3);
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

/* ─── Food summary ──────────────────────────────────────────── */
.food-summary {
  display: flex;
  align-items: center;
  gap: var(--md3-space-2);
  background: var(--md3-surface-container-low);
  border-radius: var(--md3-rounded-md);
  padding: var(--md3-space-3) var(--md3-space-4);
}

.summary-icon {
  font-size: 1.25rem;
  color: var(--md3-primary);
  flex-shrink: 0;
}

.summary-text {
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-lg);
  font-weight: var(--md3-weight-semibold);
  color: var(--md3-on-surface);
}

.summary-text--empty {
  color: var(--md3-on-surface-variant);
  font-weight: var(--md3-weight-medium);
  font-style: italic;
}

/* ─── Step body ─────────────────────────────────────────────── */
.step-body {
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-4);
}

.step-label {
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-lg);
  font-weight: var(--md3-weight-medium);
  color: var(--md3-on-surface-variant);
  margin: 0;
  text-align: center;
}

/* ─── Meal type chips ───────────────────────────────────────── */
.chips-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--md3-space-2);
  justify-content: center;
}

.meal-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.55rem 1.125rem;
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

/* ─── Buttons ───────────────────────────────────────────────── */
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

/* ─── Spinner ───────────────────────────────────────────────── */
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

/* ─── Error message ─────────────────────────────────────────── */
.error-msg {
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-sm);
  color: var(--md3-error);
  margin: 0;
  text-align: center;
}
</style>
