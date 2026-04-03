<template>
  <!-- inline variant -->
  <p v-if="variant === 'inline'" class="disclaimer-inline" role="note">
    <span class="material-symbols-outlined inline-icon" aria-hidden="true">health_and_safety</span>
    Esta información es orientativa y no sustituye la consulta médica. Consultá siempre con tu pediatra.
  </p>

  <!-- banner variant -->
  <div v-else-if="variant === 'banner'" class="disclaimer-banner" role="note">
    <span class="material-symbols-outlined banner-icon" aria-hidden="true">health_and_safety</span>
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
        <div class="modal-icon-wrap" aria-hidden="true">
          <span class="material-symbols-outlined modal-icon">health_and_safety</span>
        </div>
        <h2 id="disclaimer-title" class="modal-title">Aviso importante</h2>
        <div class="modal-body">
          <p>
            <strong>Pakulab es una herramienta informativa para padres.</strong> La información sobre propiedades astringentes y laxantes de los alimentos es orientativa y está basada en fuentes médicas generales.
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

const STORAGE_KEY = 'pakulab_disclaimer_accepted'

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
/* ── inline ─────────────────────────────────────── */
.disclaimer-inline {
  margin: 0;
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-sm);
  color: var(--md3-on-surface-variant);
  display: flex;
  align-items: center;
  gap: var(--md3-space-1);
}

.inline-icon {
  font-size: 1rem;
  color: var(--md3-primary);
  flex-shrink: 0;
}

/* ── banner ──────────────────────────────────────── */
.disclaimer-banner {
  display: flex;
  gap: var(--md3-space-3);
  align-items: flex-start;
  background: var(--md3-surface-container-low);
  border-radius: var(--md3-rounded-md);
  padding: var(--md3-space-3) var(--md3-space-4);
  box-shadow: var(--md3-shadow-soft);
}

.banner-icon {
  font-size: 1.375rem;
  color: var(--md3-primary);
  flex-shrink: 0;
  margin-top: 0.1rem;
}

.banner-body {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.banner-title {
  font-family: var(--md3-font-headline);
  font-size: var(--md3-body-md);
  font-weight: var(--md3-weight-bold);
  color: var(--md3-on-surface);
}

.banner-text {
  margin: 0;
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-sm);
  color: var(--md3-on-surface-variant);
  line-height: var(--md3-body-line-height);
}

/* ── modal ───────────────────────────────────────── */
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

.modal-btn:hover {
  background: var(--md3-gradient-cta-hover);
}
</style>
