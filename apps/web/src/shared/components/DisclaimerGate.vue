<template>
  <Teleport v-if="authStore.mustShowDisclaimer" to="body">
    <div class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="disclaimer-gate-title">
      <div class="modal-card">
        <div class="modal-icon-wrap" aria-hidden="true">
          <span class="material-symbols-outlined modal-icon">health_and_safety</span>
        </div>
        <h2 id="disclaimer-gate-title" class="modal-title">Aviso importante</h2>
        <div class="modal-body">
          <p>
            <strong>Pakulab es una herramienta informativa para padres.</strong> La información sobre propiedades astringentes y laxantes de los alimentos es orientativa y está basada en fuentes médicas generales.
          </p>
          <p>
            <strong>NO sustituye el consejo de tu pediatra o profesional de salud.</strong> Cada bebé es único y puede reaccionar de manera diferente a los alimentos.
          </p>
          <p>
            Al continuar, aceptas que entiendes el carácter informativo de esta aplicación.
          </p>
        </div>
        <p v-if="errorMessage" class="modal-error" role="alert">{{ errorMessage }}</p>
        <button
          class="modal-btn"
          :disabled="loading"
          @click="onAccept"
        >
          {{ loading ? 'Procesando…' : 'Acepto' }}
        </button>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/shared/stores/authStore.js'

const authStore = useAuthStore()
const loading = ref(false)
const errorMessage = ref<string | null>(null)

async function onAccept() {
  if (loading.value) return
  loading.value = true
  errorMessage.value = null
  try {
    await authStore.acceptDisclaimer()
  } catch (err) {
    errorMessage.value = err instanceof Error
      ? err.message
      : 'No pudimos registrar tu aceptación. Intenta de nuevo.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: var(--md3-space-3);
}

.modal-card {
  background: var(--md3-surface-container-lowest);
  border-radius: var(--md3-rounded-lg);
  padding: var(--md3-space-6);
  max-width: 440px;
  width: 100%;
  box-shadow: var(--md3-shadow-ambient);
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-3);
}

.modal-icon-wrap {
  display: flex;
  justify-content: center;
}

.modal-icon {
  font-size: 3rem;
  color: var(--md3-primary);
}

.modal-title {
  margin: 0;
  font-family: var(--md3-font-headline);
  font-size: var(--md3-headline-sm);
  font-weight: var(--md3-weight-bold);
  color: var(--md3-on-surface);
  text-align: center;
  letter-spacing: var(--md3-headline-tracking);
}

.modal-body {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.modal-body p {
  margin: 0;
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-md);
  color: var(--md3-on-surface-variant);
  line-height: var(--md3-body-line-height);
}

.modal-error {
  margin: 0;
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-sm);
  color: var(--md3-error);
  text-align: center;
}

.modal-btn {
  width: 100%;
  padding: 0.9rem var(--md3-space-6);
  background: var(--md3-gradient-cta);
  color: var(--md3-on-primary);
  border: none;
  border-radius: var(--md3-rounded-full);
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-lg);
  font-weight: var(--md3-weight-bold);
  cursor: pointer;
  transition: background var(--md3-transition-fast);
}

.modal-btn:hover:not(:disabled) {
  background: var(--md3-gradient-cta-hover);
}

.modal-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
