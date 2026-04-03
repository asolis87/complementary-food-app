<template>
  <div class="app-input" :class="{ 'app-input--error': !!error, 'app-input--disabled': disabled }">
    <!-- Label -->
    <label
      v-if="label"
      :for="inputId"
      class="app-input__label"
    >
      {{ label }}
      <span v-if="required" class="app-input__required" aria-hidden="true"> *</span>
    </label>

    <!-- Input wrapper (holds icon + native input + toggle) -->
    <div class="app-input__wrapper">
      <!-- Leading icon -->
      <span
        v-if="icon"
        class="material-symbols-outlined app-input__icon app-input__icon--leading"
        aria-hidden="true"
      >{{ icon }}</span>

      <!-- Native input -->
      <input
        :id="inputId"
        :type="resolvedType"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :required="required"
        :aria-invalid="!!error"
        :aria-describedby="error ? errorId : undefined"
        class="app-input__field"
        :class="{
          'app-input__field--with-icon': !!icon,
          'app-input__field--with-toggle': isPassword,
        }"
        @input="onInput"
      />

      <!-- Password visibility toggle -->
      <button
        v-if="isPassword"
        type="button"
        class="app-input__toggle"
        :aria-label="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'"
        @click="showPassword = !showPassword"
      >
        <span class="material-symbols-outlined app-input__toggle-icon">
          {{ showPassword ? 'visibility_off' : 'visibility' }}
        </span>
      </button>
    </div>

    <!-- Error message -->
    <span
      v-if="error"
      :id="errorId"
      class="app-input__error"
      role="alert"
    >
      <span class="material-symbols-outlined app-input__error-icon" aria-hidden="true">error</span>
      {{ error }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const props = withDefaults(
  defineProps<{
    /** v-model value */
    modelValue: string
    /** Input type */
    type?: 'text' | 'email' | 'password' | 'number' | 'tel'
    /** Floating label above the input */
    label?: string
    /** Placeholder text */
    placeholder?: string
    /** Error message — triggers error styling when truthy */
    error?: string
    /** Disables the input */
    disabled?: boolean
    /** Marks field as required (adds * to label) */
    required?: boolean
    /** Material Symbols Outlined icon name for leading icon */
    icon?: string
    /** HTML id for the input (auto-generated if omitted) */
    id?: string
  }>(),
  {
    type: 'text',
    label: undefined,
    placeholder: undefined,
    error: undefined,
    disabled: false,
    required: false,
    icon: undefined,
    id: undefined,
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

// ─── Password visibility toggle ──────────────────────────────────────────────
const showPassword = ref(false)

const isPassword = computed(() => props.type === 'password')

const resolvedType = computed(() => {
  if (!isPassword.value) return props.type
  return showPassword.value ? 'text' : 'password'
})

// ─── Stable IDs ──────────────────────────────────────────────────────────────
// Use the provided id or generate one from label to keep label association stable
let _uid: string | undefined
function uid(): string {
  if (!_uid) {
    _uid = props.id ?? `app-input-${Math.random().toString(36).slice(2, 7)}`
  }
  return _uid
}

const inputId = computed(() => uid())
const errorId = computed(() => `${uid()}-error`)

// ─── Emit ─────────────────────────────────────────────────────────────────────
function onInput(event: Event) {
  emit('update:modelValue', (event.target as HTMLInputElement).value)
}
</script>

<style scoped>
/* ─── Container ─── */
.app-input {
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-1);
  width: 100%;
}

/* ─── Label ─── */
.app-input__label {
  display: block;
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-lg);
  font-weight: var(--md3-weight-semibold);
  color: var(--md3-on-surface-variant);
  line-height: var(--md3-label-line-height);
  letter-spacing: var(--md3-label-tracking);
  cursor: pointer;
}

.app-input__required {
  color: var(--md3-error);
  font-weight: var(--md3-weight-bold);
}

/* ─── Input wrapper (relative container for icons) ─── */
.app-input__wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

/* ─── Native input ─── */
.app-input__field {
  width: 100%;
  height: 48px;
  padding: 0 var(--md3-space-4);
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-lg);
  color: var(--md3-on-surface);
  background: var(--md3-surface-container);
  border: 2px solid transparent;
  border-radius: var(--md3-rounded-full);
  outline: none;
  box-sizing: border-box;
  transition:
    border-color var(--md3-transition-fast),
    background var(--md3-transition-fast);
  /* Remove default browser appearance */
  -webkit-appearance: none;
  appearance: none;
}

.app-input__field::placeholder {
  color: var(--md3-outline);
  font-weight: var(--md3-weight-regular);
}

/* Focus ring */
.app-input__field:focus {
  border-color: var(--md3-primary);
  background: var(--md3-surface-container-low);
}

/* Shift padding when there's a leading icon */
.app-input__field--with-icon {
  padding-left: calc(var(--md3-space-4) + 1.5rem + var(--md3-space-2));
}

/* Shift padding when there's a trailing toggle */
.app-input__field--with-toggle {
  padding-right: calc(var(--md3-space-4) + 1.5rem + var(--md3-space-2));
}

/* ─── Error state ─── */
.app-input--error .app-input__field {
  border-color: var(--md3-error);
  background: var(--md3-surface-container-low);
}

.app-input--error .app-input__field:focus {
  border-color: var(--md3-error);
}

/* ─── Disabled state ─── */
.app-input--disabled .app-input__field {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

.app-input--disabled .app-input__label {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ─── Leading icon ─── */
.app-input__icon {
  position: absolute;
  font-size: 1.25rem !important;
  color: var(--md3-outline);
  pointer-events: none;
  line-height: 1;
  transition: color var(--md3-transition-fast);
}

.app-input__icon--leading {
  left: var(--md3-space-3);
}

/* Icon turns primary on focus */
.app-input__wrapper:focus-within .app-input__icon {
  color: var(--md3-primary);
}

/* Icon turns error-colored on error */
.app-input--error .app-input__icon {
  color: var(--md3-error);
}

/* ─── Password toggle button ─── */
.app-input__toggle {
  position: absolute;
  right: var(--md3-space-2);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: var(--md3-rounded-full);
  border: none;
  background: transparent;
  cursor: pointer;
  color: var(--md3-outline);
  transition:
    background var(--md3-transition-fast),
    color var(--md3-transition-fast);
}

.app-input__toggle:hover {
  background: var(--md3-surface-container-high);
  color: var(--md3-on-surface);
}

.app-input__toggle:focus-visible {
  outline: 2px solid var(--md3-primary);
  outline-offset: 1px;
}

.app-input__toggle-icon {
  font-size: 1.125rem !important;
  line-height: 1;
}

/* ─── Error message ─── */
.app-input__error {
  display: flex;
  align-items: center;
  gap: var(--md3-space-1);
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-md);
  font-weight: var(--md3-weight-medium);
  color: var(--md3-error);
  line-height: var(--md3-label-line-height);
  padding-left: var(--md3-space-3);
}

.app-input__error-icon {
  font-size: 0.875rem !important;
  line-height: 1;
  flex-shrink: 0;
}
</style>
