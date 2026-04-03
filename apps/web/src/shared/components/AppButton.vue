<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :aria-busy="loading"
    class="app-btn"
    :class="[
      `app-btn--${variant}`,
      `app-btn--${size}`,
      { 'app-btn--full': fullWidth, 'app-btn--loading': loading },
    ]"
    v-bind="$attrs"
    @click="emit('click', $event)"
  >
    <!-- Loading spinner -->
    <span v-if="loading" class="app-btn__spinner" aria-hidden="true" />

    <!-- Leading icon -->
    <span
      v-else-if="icon"
      class="material-symbols-outlined app-btn__icon"
      aria-hidden="true"
    >{{ icon }}</span>

    <!-- Label slot -->
    <span class="app-btn__label">
      <slot />
    </span>
  </button>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    /** Visual style of the button */
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
    /** Height size */
    size?: 'sm' | 'md' | 'lg'
    /** Stretches button to 100% width of its container */
    fullWidth?: boolean
    /** Shows a spinner and disables interaction */
    loading?: boolean
    /** Disables the button */
    disabled?: boolean
    /** Material Symbols Outlined icon name (no leading/trailing space) */
    icon?: string
    /** HTML button type attribute */
    type?: 'button' | 'submit' | 'reset'
  }>(),
  {
    variant: 'primary',
    size: 'md',
    fullWidth: false,
    loading: false,
    disabled: false,
    icon: undefined,
    type: 'button',
  },
)

const emit = defineEmits<{
  (e: 'click', event: MouseEvent): void
}>()
</script>

<style scoped>
/* ─── Base ─── */
.app-btn {
  /* Layout */
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--md3-space-2);

  /* Shape — pill */
  border-radius: var(--md3-rounded-full);
  border: 2px solid transparent;

  /* Typography */
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-lg);
  font-weight: var(--md3-weight-semibold);
  letter-spacing: var(--md3-label-tracking);
  white-space: nowrap;
  text-decoration: none;

  /* Interaction */
  cursor: pointer;
  user-select: none;
  transition:
    background var(--md3-transition-fast),
    color var(--md3-transition-fast),
    border-color var(--md3-transition-fast),
    opacity var(--md3-transition-fast),
    box-shadow var(--md3-transition-fast);

  /* Prevent text wrapping inside button */
  line-height: 1;
}

/* ─── Full width ─── */
.app-btn--full {
  width: 100%;
}

/* ─── Sizes ─── */
.app-btn--sm {
  height: 36px;
  padding: 0 var(--md3-space-3);
  font-size: var(--md3-label-md);
}

.app-btn--md {
  height: 44px;
  padding: 0 var(--md3-space-4);
}

.app-btn--lg {
  height: 52px;
  padding: 0 var(--md3-space-6);
  font-size: var(--md3-body-md);
}

/* ─── Variants ─── */

/* Primary */
.app-btn--primary {
  background: var(--md3-primary);
  color: var(--md3-on-primary);
  border-color: transparent;
  box-shadow: var(--md3-shadow-card);
}

.app-btn--primary:hover:not(:disabled) {
  background: var(--md3-primary-dim);
  box-shadow: var(--md3-shadow-elevated);
}

.app-btn--primary:active:not(:disabled) {
  background: var(--md3-primary-dim);
  box-shadow: var(--md3-shadow-soft);
  opacity: 0.9;
}

/* Secondary */
.app-btn--secondary {
  background: var(--md3-secondary-container);
  color: var(--md3-on-secondary-container);
  border-color: transparent;
}

.app-btn--secondary:hover:not(:disabled) {
  background: var(--md3-secondary);
  color: var(--md3-on-secondary);
}

.app-btn--secondary:active:not(:disabled) {
  opacity: 0.9;
}

/* Outline */
.app-btn--outline {
  background: transparent;
  color: var(--md3-primary);
  border-color: var(--md3-primary);
}

.app-btn--outline:hover:not(:disabled) {
  background: var(--md3-primary-container);
  color: var(--md3-on-primary-container);
  border-color: var(--md3-primary-container);
}

.app-btn--outline:active:not(:disabled) {
  opacity: 0.9;
}

/* Ghost */
.app-btn--ghost {
  background: transparent;
  color: var(--md3-primary);
  border-color: transparent;
}

.app-btn--ghost:hover:not(:disabled) {
  background: var(--md3-surface-container-low);
  color: var(--md3-on-primary-container);
}

.app-btn--ghost:active:not(:disabled) {
  background: var(--md3-surface-container);
}

/* Danger */
.app-btn--danger {
  background: var(--md3-error);
  color: var(--md3-on-error);
  border-color: transparent;
  box-shadow: var(--md3-shadow-card);
}

.app-btn--danger:hover:not(:disabled) {
  opacity: 0.88;
  box-shadow: var(--md3-shadow-elevated);
}

.app-btn--danger:active:not(:disabled) {
  opacity: 0.8;
}

/* ─── Disabled & Loading ─── */
.app-btn:disabled,
.app-btn--loading {
  cursor: not-allowed;
  opacity: 0.5;
  box-shadow: none;
}

/* Disabled state — no pointer events */
.app-btn:disabled {
  pointer-events: none;
}

/* ─── Icon ─── */
.app-btn__icon {
  /* Inherit size from button size modifier */
  font-size: 1.125rem !important;
  line-height: 1;
  flex-shrink: 0;
}

.app-btn--sm .app-btn__icon { font-size: 1rem !important; }
.app-btn--lg .app-btn__icon { font-size: 1.25rem !important; }

/* ─── Spinner ─── */
@keyframes app-btn-spin {
  to { transform: rotate(360deg); }
}

.app-btn__spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  flex-shrink: 0;
  animation: app-btn-spin 0.7s linear infinite;

  /* Color adapts to variant via currentColor trick */
  border: 2px solid currentColor;
  border-top-color: transparent;
  opacity: 0.8;
}

.app-btn--sm .app-btn__spinner { width: 14px; height: 14px; }
.app-btn--lg .app-btn__spinner { width: 18px; height: 18px; }
</style>
