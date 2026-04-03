<template>
  <Teleport to="body">
    <div class="toast-container" aria-live="polite" aria-atomic="false">
      <TransitionGroup name="toast" tag="div" class="toast-list">
        <div
          v-for="toast in uiStore.toasts"
          :key="toast.id"
          class="toast"
          :class="`toast-${toast.type}`"
          role="status"
        >
          <span class="material-symbols-outlined toast-icon" aria-hidden="true">
            {{ toastIcon(toast.type) }}
          </span>
          <span class="toast-message">{{ toast.message }}</span>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { useUiStore } from '@/shared/stores/uiStore.js'

const uiStore = useUiStore()

function toastIcon(type: 'success' | 'error' | 'warning' | 'info'): string {
  switch (type) {
    case 'success': return 'check_circle'
    case 'error':   return 'error'
    case 'warning': return 'warning'
    case 'info':    return 'info'
  }
}
</script>

<style scoped>
.toast-container {
  position: fixed;
  bottom: 6rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 500;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--md3-space-2);
  pointer-events: none;
}

.toast-list {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--md3-space-2);
}

.toast {
  display: inline-flex;
  align-items: center;
  gap: var(--md3-space-2);
  padding: 0.7rem 1.25rem;
  border-radius: var(--md3-rounded-full);
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-md);
  font-weight: var(--md3-weight-semibold);
  box-shadow: var(--md3-shadow-ambient);
  white-space: nowrap;
  pointer-events: all;
  /* No border — MD3 container colors handle visual hierarchy */
}

/* ── Variant: Success ── */
.toast-success {
  background: var(--md3-primary-container);
  color: var(--md3-on-primary-container);
}

/* ── Variant: Error ── */
.toast-error {
  background: var(--md3-error-container);
  color: var(--md3-on-error-container);
}

/* ── Variant: Warning ── */
.toast-warning {
  background: var(--md3-tertiary-container);
  color: var(--md3-on-tertiary-container);
}

/* ── Variant: Info ── */
.toast-info {
  background: var(--md3-surface-container-lowest);
  color: var(--md3-on-surface);
}

.toast-icon {
  font-size: 1.1rem;
  font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 20;
  flex-shrink: 0;
}

/* ── Transitions (preserved) ── */
.toast-enter-active,
.toast-leave-active {
  transition: all 0.25s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateY(12px) scale(0.95);
}

.toast-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.95);
}
</style>
