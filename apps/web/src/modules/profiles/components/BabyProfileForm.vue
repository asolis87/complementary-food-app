<template>
  <form class="profile-form" novalidate @submit.prevent="handleSubmit">
    <h2 class="form-title">{{ isEditing ? 'Editar perfil' : 'Nuevo perfil de bebé' }}</h2>

    <!-- General error -->
    <div v-if="submitError" class="error-banner" role="alert">
      <span class="material-symbols-outlined error-banner__icon" aria-hidden="true">warning</span>
      {{ submitError }}
    </div>

    <!-- Name -->
    <div class="form-group">
      <label for="profile-name" class="form-label">Nombre del bebé *</label>
      <input
        id="profile-name"
        v-model="fields.name"
        type="text"
        class="form-input"
        :class="{ 'input-error': errors.name }"
        placeholder="Ej. Sofía"
        maxlength="50"
        required
        :disabled="submitting"
      />
      <span v-if="errors.name" class="field-error" role="alert">{{ errors.name }}</span>
    </div>

    <!-- Birth date -->
    <div class="form-group">
      <label for="profile-birthdate" class="form-label">Fecha de nacimiento *</label>
      <input
        id="profile-birthdate"
        v-model="fields.birthDate"
        type="date"
        class="form-input"
        :class="{ 'input-error': errors.birthDate }"
        :max="today"
        required
        :disabled="submitting"
      />
      <span v-if="errors.birthDate" class="field-error" role="alert">{{ errors.birthDate }}</span>
    </div>

    <!-- AC Start date -->
    <div class="form-group">
      <label for="profile-acstart" class="form-label">
        Inicio de alimentación complementaria
        <span class="label-optional">(opcional)</span>
      </label>
      <input
        id="profile-acstart"
        v-model="fields.acStartDate"
        type="date"
        class="form-input"
        :min="fields.birthDate"
        :max="today"
        :disabled="submitting"
      />
      <span class="field-hint">La fecha en que tu bebé comenzó a comer sólidos</span>
    </div>

    <!-- Notes -->
    <div class="form-group">
      <label for="profile-notes" class="form-label">
        Notas
        <span class="label-optional">(opcional)</span>
      </label>
      <textarea
        id="profile-notes"
        v-model="fields.notes"
        class="form-input form-textarea"
        placeholder="Alergias conocidas, preferencias, notas del pediatra..."
        maxlength="500"
        rows="3"
        :disabled="submitting"
      />
      <span class="field-hint char-count">{{ fields.notes?.length ?? 0 }}/500</span>
    </div>

    <!-- Actions -->
    <div class="form-actions">
      <button
        type="button"
        class="btn btn-ghost"
        :disabled="submitting"
        @click="$emit('cancel')"
      >
        Cancelar
      </button>
      <button
        type="submit"
        class="btn btn-primary"
        :disabled="submitting"
      >
        <span v-if="submitting" class="spinner-sm" aria-hidden="true" />
        {{ submitting ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Crear perfil' }}
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import type { BabyProfile } from '@pakulab/shared'

// ─── Props & Emits ────────────────────────────────────────────────────────
const props = defineProps<{
  /** If provided, the form is in edit mode */
  profile?: BabyProfile
}>()

const emit = defineEmits<{
  (e: 'save', data: { name: string; birthDate: string; acStartDate?: string; notes?: string }): void
  (e: 'cancel'): void
}>()

// ─── State ────────────────────────────────────────────────────────────────
const isEditing = computed(() => !!props.profile)
const today = new Date().toISOString().split('T')[0] as string

const fields = reactive({
  name: props.profile?.name ?? '',
  birthDate: props.profile?.birthDate
    ? new Date(props.profile.birthDate).toISOString().split('T')[0]
    : '',
  acStartDate: props.profile?.acStartDate
    ? new Date(props.profile.acStartDate).toISOString().split('T')[0]
    : '',
  notes: props.profile?.notes ?? '',
})

const errors = reactive({ name: '', birthDate: '' })
const submitError = ref<string | null>(null)
const submitting = ref(false)

// ─── Validation ────────────────────────────────────────────────────────────
function validate(): boolean {
  errors.name = ''
  errors.birthDate = ''
  let valid = true

  if (!fields.name.trim()) {
    errors.name = 'El nombre del bebé es obligatorio'
    valid = false
  }

  if (!fields.birthDate) {
    errors.birthDate = 'La fecha de nacimiento es obligatoria'
    valid = false
  }

  return valid
}

// ─── Handler ──────────────────────────────────────────────────────────────
async function handleSubmit() {
  submitError.value = null
  if (!validate()) return

  submitting.value = true
  try {
    emit('save', {
      name: fields.name.trim(),
      birthDate: fields.birthDate,
      acStartDate: fields.acStartDate || undefined,
      notes: fields.notes?.trim() || undefined,
    })
  } finally {
    submitting.value = false
  }
}

/** Let the parent signal a save error back to the form */
function setError(msg: string) {
  submitError.value = msg
  submitting.value = false
}

defineExpose({ setError })
</script>

<style scoped>
.profile-form {
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-3);
  padding: var(--md3-space-6);
  background: var(--md3-surface-container-lowest);
  border-radius: var(--md3-rounded-md);
  box-shadow: var(--md3-shadow-elevated);
}

.form-title {
  margin: 0 0 var(--md3-space-1);
  font-family: var(--md3-font-headline);
  font-size: var(--md3-headline-sm);
  font-weight: var(--md3-weight-bold);
  color: var(--md3-on-surface);
}

.error-banner {
  display: flex;
  align-items: center;
  gap: var(--md3-space-2);
  padding: 0.75rem 1rem;
  background: var(--md3-on-error);
  border: 1.5px solid var(--md3-error-container);
  border-radius: var(--md3-rounded-sm);
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-md);
  color: var(--md3-error);
}

.error-banner__icon {
  font-size: 1.125rem;
  flex-shrink: 0;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-2);
}

.form-label {
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-lg);
  font-weight: var(--md3-weight-semibold);
  color: var(--md3-on-surface);
}

.label-optional {
  font-weight: var(--md3-weight-regular);
  color: var(--md3-on-surface-variant);
  font-size: var(--md3-label-md);
}

.form-input {
  padding: 0.65rem 1rem;
  border: 1.5px solid var(--md3-outline-variant);
  border-radius: var(--md3-rounded-sm);
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-lg);
  color: var(--md3-on-surface);
  background: var(--md3-surface-container-lowest);
  outline: none;
  transition: border-color var(--md3-transition-fast);
}

.form-input:focus {
  border-color: var(--md3-primary);
}

.form-input.input-error {
  border-color: var(--md3-error);
}

.form-input:disabled {
  background: var(--md3-surface-container-low);
  color: var(--md3-on-surface-variant);
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}

.field-error {
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-sm);
  color: var(--md3-error);
}

.field-hint {
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-sm);
  color: var(--md3-on-surface-variant);
}

.char-count {
  text-align: right;
}

.form-actions {
  display: flex;
  gap: var(--md3-space-3);
  justify-content: flex-end;
  margin-top: var(--md3-space-1);
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: var(--md3-space-2);
  padding: 0.65rem 1.25rem;
  border-radius: var(--md3-rounded-full);
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-lg);
  font-weight: var(--md3-weight-semibold);
  cursor: pointer;
  border: none;
  transition: background var(--md3-transition-fast), opacity var(--md3-transition-fast);
}

.btn-primary {
  background: var(--md3-primary);
  color: var(--md3-on-primary);
  box-shadow: var(--md3-shadow-card);
}

.btn-primary:hover:not(:disabled) {
  background: var(--md3-primary-dim);
  box-shadow: var(--md3-shadow-elevated);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-ghost {
  background: var(--md3-surface-container-low);
  color: var(--md3-on-surface-variant);
}

.btn-ghost:hover:not(:disabled) {
  background: var(--md3-surface-container);
  color: var(--md3-on-surface);
}

.btn-ghost:disabled {
  opacity: 0.6;
}

.spinner-sm {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: currentColor;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
