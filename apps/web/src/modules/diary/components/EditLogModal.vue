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

        <!-- ── Food name (read-only) ──────────────────────────────────── -->
        <div class="food-info">
          <span class="material-symbols-outlined food-icon" aria-hidden="true">nutrition</span>
          <span class="food-name">{{ entry.food?.name ?? '—' }}</span>
        </div>

        <!-- ── Form body ──────────────────────────────────────────────── -->
        <div class="form-body">

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
import { ReactionType } from '@pakulab/shared'
import type { MealLog, UpdateMealLogPayload } from '@pakulab/shared'
import { useDiaryStore } from '../../../shared/stores/diaryStore.js'
import { useUiStore } from '../../../shared/stores/uiStore.js'

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
const uiStore = useUiStore()

// ── Local state ───────────────────────────────────────────────────────────

const localReaction = ref<ReactionType | null>(null)
const localAccepted = ref<boolean | null>(null)
const localNotes = ref('')
const submitting = ref(false)
const submitError = ref<string | null>(null)

// ── Reaction options ──────────────────────────────────────────────────────

const reactions: { value: ReactionType; emoji: string; label: string }[] = [
  { value: ReactionType.LIKED,    emoji: '😊', label: 'Le gustó' },
  { value: ReactionType.DISLIKED, emoji: '😣', label: 'No le gustó' },
  { value: ReactionType.NEUTRAL,  emoji: '😐', label: 'Neutral' },
  { value: ReactionType.ALLERGIC, emoji: '🤧', label: 'Alergia' },
  { value: ReactionType.GAS,      emoji: '💨', label: 'Gases' },
  { value: ReactionType.RASH,     emoji: '🔴', label: 'Sarpullido' },
]

// ── Init local state from entry when modal opens ──────────────────────────

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      localReaction.value = props.entry.reaction ?? null
      localAccepted.value = props.entry.accepted ?? null
      localNotes.value = props.entry.notes ?? ''
      submitError.value = null
      submitting.value = false
    }
  },
  { immediate: true },
)

// Also re-init if entry changes while open (e.g. sequential editing)
watch(
  () => props.entry,
  (newEntry) => {
    if (props.open) {
      localReaction.value = newEntry.reaction ?? null
      localAccepted.value = newEntry.accepted ?? null
      localNotes.value = newEntry.notes ?? ''
    }
  },
)

// ── Helpers ───────────────────────────────────────────────────────────────

/** True when at least one field differs from the original entry */
const hasChanges = computed(() => {
  const origReaction = props.entry.reaction ?? null
  const origAccepted = props.entry.accepted ?? null
  const origNotes = props.entry.notes ?? ''
  return (
    localReaction.value !== origReaction ||
    localAccepted.value !== origAccepted ||
    (localNotes.value.trim() || null) !== (origNotes || null)
  )
})

function toggleReaction(reaction: ReactionType) {
  localReaction.value = localReaction.value === reaction ? null : reaction
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
    await diaryStore.updateEntry(props.entry.id, payload)
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
