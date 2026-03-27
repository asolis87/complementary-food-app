<template>
  <form class="profile-form" novalidate @submit.prevent="handleSubmit">
    <h2 class="form-title">{{ isEditing ? 'Editar perfil' : 'Nuevo perfil de bebé' }}</h2>

    <!-- General error -->
    <div v-if="submitError" class="error-banner" role="alert">
      <span aria-hidden="true">⚠️</span>
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
import type { BabyProfile } from '@cfa/shared'

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
  gap: 1rem;
  padding: 1.5rem;
  background: white;
  border-radius: 1.25rem;
  border: 1px solid #f3f4f6;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.form-title {
  margin: 0 0 0.25rem;
  font-size: 1.1rem;
  font-weight: 700;
  color: #111827;
}

.error-banner {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 0.75rem;
  font-size: 0.875rem;
  color: #b91c1c;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.form-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
}

.label-optional {
  font-weight: 400;
  color: #9ca3af;
  font-size: 0.8rem;
}

.form-input {
  padding: 0.65rem 1rem;
  border: 1.5px solid #e5e7eb;
  border-radius: 0.75rem;
  font-size: 1rem;
  color: #111827;
  outline: none;
  transition: border-color 0.15s;
  font-family: inherit;
}

.form-input:focus {
  border-color: #10b981;
}

.form-input.input-error {
  border-color: #ef4444;
}

.form-input:disabled {
  background: #f9fafb;
  color: #9ca3af;
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}

.field-error {
  font-size: 0.75rem;
  color: #ef4444;
}

.field-hint {
  font-size: 0.75rem;
  color: #9ca3af;
}

.char-count {
  text-align: right;
}

.form-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  margin-top: 0.25rem;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.65rem 1.25rem;
  border-radius: 0.75rem;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all 0.15s;
}

.btn-primary {
  background: #10b981;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #059669;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-ghost {
  background: #f3f4f6;
  color: #374151;
}

.btn-ghost:hover:not(:disabled) {
  background: #e5e7eb;
}

.btn-ghost:disabled {
  opacity: 0.6;
}

.spinner-sm {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
