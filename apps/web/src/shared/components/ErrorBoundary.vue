<template>
  <slot v-if="!hasError" />

  <div v-else class="error-boundary" role="alert" aria-live="assertive">
    <div class="error-card">
      <span class="error-icon" aria-hidden="true">⚠️</span>
      <h2 class="error-title">Algo salió mal</h2>
      <p class="error-message">{{ errorMessage }}</p>
      <button class="retry-btn" @click="reset">Reintentar</button>
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
  padding: 3rem 1rem;
  min-height: 200px;
}

.error-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  text-align: center;
  background: #fff1f2;
  border: 1px solid #fecdd3;
  border-radius: 1rem;
  padding: 2rem;
  max-width: 380px;
  width: 100%;
}

.error-icon {
  font-size: 2.5rem;
}

.error-title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: #9f1239;
}

.error-message {
  margin: 0;
  font-size: 0.875rem;
  color: #be123c;
  line-height: 1.5;
}

.retry-btn {
  padding: 0.6rem 1.5rem;
  background: #e11d48;
  color: white;
  border: none;
  border-radius: 0.625rem;
  font-size: 0.875rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s;
  margin-top: 0.25rem;
}

.retry-btn:hover {
  background: #be123c;
}
</style>
