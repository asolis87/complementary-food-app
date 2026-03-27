<template>
  <!-- inline variant -->
  <p v-if="variant === 'inline'" class="disclaimer-inline" role="note">
    <span aria-hidden="true">⚕️</span>
    Esta información es orientativa y no sustituye la consulta médica. Consultá siempre con tu pediatra.
  </p>

  <!-- banner variant -->
  <div v-else-if="variant === 'banner'" class="disclaimer-banner" role="note">
    <span class="banner-icon" aria-hidden="true">⚕️</span>
    <div class="banner-body">
      <strong class="banner-title">Aviso médico</strong>
      <p class="banner-text">
        Esta información es orientativa y no sustituye la consulta médica. Consultá siempre con tu pediatra ante cualquier duda sobre la alimentación de tu bebé.
      </p>
    </div>
  </div>

  <!-- modal variant — first-time acceptance -->
  <Teleport v-else-if="variant === 'modal' && showModal" to="body">
    <div class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="disclaimer-title">
      <div class="modal-card">
        <div class="modal-icon" aria-hidden="true">⚕️</div>
        <h2 id="disclaimer-title" class="modal-title">Aviso importante</h2>
        <div class="modal-body">
          <p>
            <strong>CFA es una herramienta informativa para padres.</strong> La información sobre propiedades astringentes y laxantes de los alimentos es orientativa y está basada en fuentes médicas generales.
          </p>
          <p>
            <strong>NO sustituye el consejo de tu pediatra o profesional de salud.</strong> Cada bebé es único y puede reaccionar de manera diferente a los alimentos.
          </p>
          <p>
            Al continuar, aceptás que entendés el carácter informativo de esta aplicación.
          </p>
        </div>
        <button class="modal-btn" @click="accept">
          Entendido, continuar
        </button>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const STORAGE_KEY = 'cfa_disclaimer_accepted'

const props = withDefaults(defineProps<{
  variant: 'inline' | 'banner' | 'modal'
}>(), {
  variant: 'inline',
})

const showModal = ref(false)

onMounted(() => {
  if (props.variant === 'modal') {
    const accepted = localStorage.getItem(STORAGE_KEY)
    if (!accepted) {
      showModal.value = true
    }
  }
})

function accept() {
  localStorage.setItem(STORAGE_KEY, '1')
  showModal.value = false
}
</script>

<style scoped>
/* inline */
.disclaimer-inline {
  margin: 0;
  font-size: 0.75rem;
  color: #6b7280;
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

/* banner */
.disclaimer-banner {
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 0.75rem;
  padding: 0.875rem 1rem;
}

.banner-icon {
  font-size: 1.25rem;
  flex-shrink: 0;
  margin-top: 0.1rem;
}

.banner-body {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.banner-title {
  font-size: 0.85rem;
  font-weight: 700;
  color: #166534;
}

.banner-text {
  margin: 0;
  font-size: 0.8rem;
  color: #166534;
  line-height: 1.5;
}

/* modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-card {
  background: white;
  border-radius: 1.25rem;
  padding: 2rem;
  max-width: 440px;
  width: 100%;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.modal-icon {
  font-size: 2.5rem;
  text-align: center;
}

.modal-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 800;
  color: #111827;
  text-align: center;
}

.modal-body {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.modal-body p {
  margin: 0;
  font-size: 0.875rem;
  color: #374151;
  line-height: 1.6;
}

.modal-btn {
  width: 100%;
  padding: 0.85rem;
  background: #16a34a;
  color: white;
  border: none;
  border-radius: 0.75rem;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s;
}

.modal-btn:hover {
  background: #15803d;
}
</style>
