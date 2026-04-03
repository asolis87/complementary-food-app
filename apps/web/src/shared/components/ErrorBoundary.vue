<template>
  <slot v-if="!hasError" />

  <div v-else class="error-boundary" role="alert" aria-live="assertive">
    <div class="error-card">
      <span class="material-symbols-outlined error-icon" aria-hidden="true">error_outline</span>
      <h2 class="error-title">Algo salió mal</h2>
      <p class="error-message">{{ errorMessage }}</p>
      <button class="retry-btn" @click="reset">
        <span class="material-symbols-outlined" aria-hidden="true">refresh</span>
        Reintentar
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onErrorCaptured } from 'vue'

const hasError = ref(false)
const errorMessage = ref('Intentá de nuevo o recargá la página.')

onErrorCaptured((err: unknown) => {
  hasError.value = true
  if (err instanceof Error) {
    errorMessage.value = err.message
  }
  // Return false to stop propagation
  return false
})

function reset() {
  hasError.value = false
  errorMessage.value = 'Intentá de nuevo o recargá la página.'
}
</script>

<style scoped>
.error-boundary {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--md3-space-12) var(--md3-space-3);
  min-height: 200px;
  background: var(--md3-surface);
}

.error-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--md3-space-3);
  text-align: center;
  background: var(--md3-surface-container-lowest);
  border-radius: var(--md3-rounded-lg);
  padding: var(--md3-space-8) var(--md3-space-6);
  max-width: 380px;
  width: 100%;
  box-shadow: var(--md3-shadow-ambient);
}

.error-icon {
  font-size: 3.5rem;
  color: var(--md3-error);
  font-variation-settings: 'FILL' 0, 'wght' 300;
}

.error-title {
  margin: 0;
  font-family: var(--md3-font-headline);
  font-size: var(--md3-headline-sm);
  font-weight: var(--md3-weight-semibold);
  letter-spacing: var(--md3-headline-tracking);
  line-height: var(--md3-headline-line-height);
  color: var(--md3-on-surface);
}

.error-message {
  margin: 0;
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-md);
  line-height: var(--md3-body-line-height);
  color: var(--md3-on-surface-variant);
}

.retry-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--md3-space-2);
  padding: 0.75rem 1.75rem;
  background: var(--md3-gradient-cta);
  color: var(--md3-on-primary);
  border: none;
  border-radius: var(--md3-rounded-full);
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-lg);
  font-weight: var(--md3-weight-semibold);
  letter-spacing: var(--md3-label-tracking);
  cursor: pointer;
  transition: background var(--md3-transition-fast), box-shadow var(--md3-transition-fast);
  margin-top: var(--md3-space-1);
}

.retry-btn:hover {
  background: var(--md3-gradient-cta-hover);
  box-shadow: var(--md3-shadow-card);
}

.retry-btn .material-symbols-outlined {
  font-size: 1.125rem;
  font-variation-settings: 'FILL' 0, 'wght' 400;
}
</style>
