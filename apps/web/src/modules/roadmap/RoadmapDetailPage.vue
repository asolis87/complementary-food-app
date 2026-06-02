<template>
  <div class="construction-page">
    <div class="construction-card">
      <span class="material-symbols-outlined construction-icon">construction</span>
      <h1 class="construction-title">Detalle del Roadmap</h1>
      <p class="construction-text">
        Esta sección se encuentra actualmente en construcción. Pronto podrás ver un desglose completo del progreso alimentario de tu bebé aquí.
      </p>
      <RouterLink to="/dashboard" class="back-btn">
        <span class="material-symbols-outlined">arrow_back</span>
        Volver al Inicio
      </RouterLink>
    </div>
  </div>
</template>

<script setup lang="ts">
// Simple placeholder page for roadmap detail
</script>

<style scoped>
.construction-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: var(--md3-space-4);
  text-align: center;
}

.construction-card {
  max-width: 480px;
  padding: var(--md3-space-6);
  background: var(--md3-surface-container-lowest);
  border: 1px solid var(--md3-outline-variant);
  border-radius: var(--md3-rounded-xl);
  box-shadow: var(--md3-shadow-ambient);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--md3-space-4);
}

.construction-icon {
  font-size: 3rem !important;
  color: var(--md3-primary);
}

.construction-title {
  font-family: var(--md3-font-headline);
  font-size: var(--md3-headline-sm);
  color: var(--md3-on-surface);
  margin: 0;
}

.construction-text {
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-md);
  color: var(--md3-on-surface-variant);
  margin: 0;
  line-height: var(--md3-body-line-height);
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--md3-space-2);
  padding: 10px 20px;
  background: var(--md3-primary);
  color: var(--md3-on-primary);
  border-radius: 9999px;
  font-family: var(--md3-font-label);
  font-weight: 600;
  text-decoration: none;
  transition: opacity 0.2s ease;
}

.back-btn:hover {
  opacity: 0.9;
}
</style>
