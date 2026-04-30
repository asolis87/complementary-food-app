<template>
  <Teleport to="body">
    <!-- Backdrop -->
    <div
      v-if="open"
      class="sheet-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="obs-sheet-title"
      @click.self="emit('close')"
    >
      <div class="sheet-card">

        <!-- ── Drag handle (mobile) ────────────────────────────────── -->
        <div class="drag-handle" aria-hidden="true" />

        <!-- ── Header ────────────────────────────────────────────────── -->
        <div class="sheet-header">
          <h2 id="obs-sheet-title" class="sheet-title">Observación del día</h2>
          <button class="close-btn" aria-label="Cerrar" @click="emit('close')">
            <span class="material-symbols-outlined" aria-hidden="true">close</span>
          </button>
        </div>

        <!-- ── Form body ──────────────────────────────────────────────── -->
        <div class="form-body">

          <!-- Stool section -->
          <div class="field-group">
            <p class="field-label">Deposición del día</p>
            <div class="stool-chips" role="group" aria-label="Tipo de deposición">
              <button
                v-for="opt in stoolOptions"
                :key="opt.value"
                class="stool-chip"
                :class="{ 'stool-chip--active': localStool === opt.value }"
                :aria-pressed="localStool === opt.value"
                @click="toggleStool(opt.value)"
              >
                <span class="chip-emoji" aria-hidden="true">{{ opt.emoji }}</span>
                <span class="chip-label">{{ opt.label }}</span>
              </button>
            </div>
          </div>

          <!-- Symptoms section -->
          <div class="field-group">
            <p class="field-label">
              Síntomas
              <span class="field-hint">(multi-selección)</span>
            </p>
            <div class="symptom-chips" role="group" aria-label="Síntomas observados">
              <button
                v-for="opt in symptomOptions"
                :key="opt.value"
                class="symptom-chip"
                :class="{ 'symptom-chip--active': localSymptoms.includes(opt.value) }"
                :aria-pressed="localSymptoms.includes(opt.value)"
                :disabled="!localSymptoms.includes(opt.value) && localSymptoms.length >= MAX_SYMPTOMS"
                @click="toggleSymptom(opt.value)"
              >
                <span class="chip-emoji" aria-hidden="true">{{ opt.emoji }}</span>
                {{ opt.label }}
              </button>
            </div>
            <p v-if="localSymptoms.length >= MAX_SYMPTOMS" class="field-hint field-hint--warn">
              Máximo {{ MAX_SYMPTOMS }} síntomas
            </p>
          </div>

          <!-- Notes section -->
          <div class="field-group">
            <label class="field-label" for="obs-notes">Notas del día (opcional)</label>
            <textarea
              id="obs-notes"
              v-model="localNotes"
              class="notes-input"
              rows="4"
              placeholder="Ej: Comió kiwi por primera vez, reaccionó con manchas..."
              :maxlength="MAX_NOTES"
              aria-label="Notas de la observación del día"
            />
            <p class="char-count" :class="{ 'char-count--warn': localNotes.length >= MAX_NOTES - 50 }">
              {{ localNotes.length }}/{{ MAX_NOTES }}
            </p>
          </div>

        </div>

        <!-- ── Footer ─────────────────────────────────────────────────── -->
        <div class="sheet-footer">
          <button
            class="btn-primary"
            :disabled="saving"
            @click="save"
          >
            <span v-if="saving" class="spinner" aria-hidden="true" />
            <span v-else class="material-symbols-outlined" aria-hidden="true">check</span>
            Guardar observación
          </button>

          <!-- Delete CTA — only visible when observation exists -->
          <button
            v-if="observation"
            class="btn-danger"
            :disabled="deleting"
            @click="confirmDelete"
          >
            <span v-if="deleting" class="spinner spinner--dark" aria-hidden="true" />
            <span v-else class="material-symbols-outlined" aria-hidden="true">delete</span>
            Quitar observación del día
          </button>
        </div>

        <p v-if="errorMsg" class="error-msg" role="alert">{{ errorMsg }}</p>

      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { DayObservation } from '@pakulab/shared'
import { StoolType, SymptomType, STOOL_LABELS, SYMPTOM_LABELS } from '@pakulab/shared'
import { useDiaryStore } from '../../../shared/stores/diaryStore.js'

// ── Props & Emits ─────────────────────────────────────────────────────────

const props = defineProps<{
  open: boolean
  date: string
  observation: DayObservation | null
  babyProfileId: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

// ── Store ─────────────────────────────────────────────────────────────────

const diaryStore = useDiaryStore()

// ── Constants ─────────────────────────────────────────────────────────────

const MAX_SYMPTOMS = 10
const MAX_NOTES = 500

const stoolOptions: { value: StoolType; emoji: string; label: string }[] = [
  { value: StoolType.NORMAL, emoji: '✅', label: STOOL_LABELS[StoolType.NORMAL] },
  { value: StoolType.LOOSE,  emoji: '💧', label: STOOL_LABELS[StoolType.LOOSE] },
  { value: StoolType.HARD,   emoji: '🪨', label: STOOL_LABELS[StoolType.HARD] },
  { value: StoolType.NONE,   emoji: '⛔', label: STOOL_LABELS[StoolType.NONE] },
]

const symptomOptions: { value: SymptomType; emoji: string; label: string }[] = [
  { value: SymptomType.ALLERGY_SUSPECT, emoji: '⚠️', label: SYMPTOM_LABELS[SymptomType.ALLERGY_SUSPECT] },
  { value: SymptomType.RASH,            emoji: '🔴', label: SYMPTOM_LABELS[SymptomType.RASH] },
  { value: SymptomType.GAS,             emoji: '💨', label: SYMPTOM_LABELS[SymptomType.GAS] },
  { value: SymptomType.VOMITING,        emoji: '🤢', label: SYMPTOM_LABELS[SymptomType.VOMITING] },
  { value: SymptomType.FEVER,           emoji: '🌡️', label: SYMPTOM_LABELS[SymptomType.FEVER] },
]

// ── Local state ───────────────────────────────────────────────────────────

const localStool = ref<StoolType | null>(null)
const localSymptoms = ref<SymptomType[]>([])
const localNotes = ref('')
const saving = ref(false)
const deleting = ref(false)
const errorMsg = ref<string | null>(null)

// ── Sync local state with props when sheet opens ──────────────────────────

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      localStool.value = props.observation?.stool ?? null
      localSymptoms.value = [...(props.observation?.symptoms ?? [])]
      localNotes.value = props.observation?.notes ?? ''
      errorMsg.value = null
      saving.value = false
      deleting.value = false
    }
  },
)

// Also re-sync if observation changes while sheet is open
watch(
  () => props.observation,
  (obs) => {
    if (props.open) {
      localStool.value = obs?.stool ?? null
      localSymptoms.value = [...(obs?.symptoms ?? [])]
      localNotes.value = obs?.notes ?? ''
    }
  },
)

// ── Helpers ───────────────────────────────────────────────────────────────

function toggleStool(value: StoolType) {
  localStool.value = localStool.value === value ? null : value
}

function toggleSymptom(value: SymptomType) {
  const idx = localSymptoms.value.indexOf(value)
  if (idx === -1) {
    if (localSymptoms.value.length < MAX_SYMPTOMS) {
      localSymptoms.value = [...localSymptoms.value, value]
    }
  } else {
    localSymptoms.value = localSymptoms.value.filter((s) => s !== value)
  }
}

// ── Actions ───────────────────────────────────────────────────────────────

async function save() {
  saving.value = true
  errorMsg.value = null
  try {
    await diaryStore.upsertObservation({
      babyProfileId: props.babyProfileId,
      date: props.date,
      stool: localStool.value,
      symptoms: localSymptoms.value,
      notes: localNotes.value.trim() || null,
    })
    emit('close')
  } catch (err) {
    errorMsg.value = err instanceof Error ? err.message : 'Error al guardar la observación'
  } finally {
    saving.value = false
  }
}

async function confirmDelete() {
  if (!confirm('¿Eliminar la observación de este día? Esta acción no se puede deshacer.')) return
  deleting.value = true
  errorMsg.value = null
  try {
    await diaryStore.deleteObservation(props.babyProfileId, props.date)
    emit('close')
  } catch (err) {
    errorMsg.value = err instanceof Error ? err.message : 'Error al eliminar la observación'
  } finally {
    deleting.value = false
  }
}
</script>

<style scoped>
/* ═══════════════════════════════════════════════════════════════════════
   DayObservationSheet — bottom sheet para registrar observación del día
   Matches AddMealModal pattern (backdrop + slide-up card)
   ═══════════════════════════════════════════════════════════════════════ */

.sheet-backdrop {
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
  .sheet-backdrop {
    align-items: center;
    padding: var(--md3-space-4);
  }
}

@keyframes fade-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}

.sheet-card {
  background: var(--md3-surface);
  border-radius: var(--md3-rounded-xl) var(--md3-rounded-xl) 0 0;
  width: 100%;
  max-width: 480px;
  padding: var(--md3-space-2) var(--md3-space-6) var(--md3-space-4);
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-5);
  animation: slide-up 0.25s ease;
  max-height: 92vh;
  overflow: hidden;
}

@media (min-width: 600px) {
  .sheet-card {
    border-radius: var(--md3-rounded-xl);
    max-height: 90vh;
    padding-top: var(--md3-space-6);
  }
}

@keyframes slide-up {
  from { transform: translateY(24px); opacity: 0; }
  to   { transform: translateY(0);    opacity: 1; }
}

/* ─── Drag handle ────────────────────────────────────────────────── */
.drag-handle {
  width: 40px;
  height: 4px;
  background: var(--md3-outline-variant);
  border-radius: var(--md3-rounded-full);
  margin: 0 auto;
  flex-shrink: 0;
}

@media (min-width: 600px) {
  .drag-handle {
    display: none;
  }
}

/* ─── Header ────────────────────────────────────────────────────── */
.sheet-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.sheet-title {
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
  display: flex;
  align-items: center;
  gap: var(--md3-space-2);
}

.field-hint {
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-sm);
  color: var(--md3-outline);
  font-weight: var(--md3-weight-regular);
  margin: 0;
}

.field-hint--warn {
  color: var(--md3-error);
}

/* ─── Stool chips ───────────────────────────────────────────────── */
.stool-chips {
  display: flex;
  gap: var(--md3-space-2);
  flex-wrap: wrap;
}

.stool-chip {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--md3-space-1);
  padding: var(--md3-space-2) var(--md3-space-3);
  background: var(--md3-surface-container-low);
  border: 2px solid transparent;
  border-radius: var(--md3-rounded-md);
  cursor: pointer;
  transition: all var(--md3-transition-fast);
  min-width: 70px;
}

.stool-chip:hover {
  background: var(--md3-surface-container);
}

.stool-chip--active {
  background: var(--md3-primary-container);
  border-color: var(--md3-primary);
}

/* ─── Symptom chips ─────────────────────────────────────────────── */
.symptom-chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--md3-space-2);
}

.symptom-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 0.875rem;
  background: var(--md3-surface-container);
  color: var(--md3-on-surface-variant);
  border: 2px solid transparent;
  border-radius: var(--md3-rounded-full);
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-md);
  font-weight: var(--md3-weight-medium);
  cursor: pointer;
  transition: all var(--md3-transition-fast);
}

.symptom-chip:hover:not(:disabled) {
  background: var(--md3-surface-container-high);
}

.symptom-chip:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.symptom-chip--active {
  background: var(--md3-tertiary-container);
  color: var(--md3-on-tertiary-container);
  border-color: var(--md3-tertiary, #4a5568);
}

/* ─── Emoji + label inside chips ───────────────────────────────── */
.chip-emoji {
  font-size: 1.25rem;
  line-height: 1;
}

.chip-label {
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-sm);
  color: var(--md3-on-surface-variant);
  text-align: center;
  line-height: 1.2;
}

.stool-chip--active .chip-label {
  color: var(--md3-on-primary-container);
  font-weight: var(--md3-weight-semibold);
}

/* ─── Notes textarea ────────────────────────────────────────────── */
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

/* ─── Footer ─────────────────────────────────────────────────────── */
.sheet-footer {
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-2);
  flex-shrink: 0;
  padding-top: var(--md3-space-2);
}

.btn-primary {
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

.btn-danger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--md3-space-2);
  padding: 0.625rem 1.25rem;
  background: none;
  color: var(--md3-error);
  border: none;
  border-radius: var(--md3-rounded-full);
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-md);
  font-weight: var(--md3-weight-medium);
  cursor: pointer;
  transition: all var(--md3-transition-fast);
}

.btn-danger:hover:not(:disabled) {
  background: var(--md3-error-container);
  color: var(--md3-on-error-container);
}

.btn-danger:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

/* ─── Spinner ────────────────────────────────────────────────────── */
.spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

.spinner--dark {
  border-color: rgba(0, 0, 0, 0.2);
  border-top-color: var(--md3-error);
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
