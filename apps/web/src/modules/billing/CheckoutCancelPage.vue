<template>
  <div class="cancel-page">
    <div class="cancel-card">
      <div class="cancel-icon-wrap" aria-hidden="true">
        <span class="material-symbols-outlined cancel-icon">sentiment_calm</span>
      </div>

      <h1>Pago cancelado</h1>
      <p class="cancel-msg">
        Podés suscribirte cuando quieras. Tus datos y platos están seguros.
      </p>
      <p class="cancel-submsg">
        Seguís teniendo acceso al plan gratuito con todas sus funciones.
      </p>

      <div class="actions">
        <RouterLink to="/pricing" class="btn btn-primary">
          <span class="material-symbols-outlined btn-icon" aria-hidden="true">workspace_premium</span>
          Ver planes
        </RouterLink>
        <RouterLink to="/" class="btn btn-ghost">
          <span class="material-symbols-outlined btn-icon" aria-hidden="true">arrow_back</span>
          Volver al inicio
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// No logic needed — simple redirect page
</script>

<style scoped>
.cancel-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: var(--md3-space-3);
}

.cancel-card {
  background: var(--md3-surface-container-lowest);
  border: 1.5px solid var(--md3-outline-variant);
  border-radius: var(--md3-rounded-lg);
  padding: var(--md3-space-8) var(--md3-space-6);
  max-width: 440px;
  width: 100%;
  text-align: center;
  box-shadow: var(--md3-shadow-card);
}

.cancel-icon-wrap {
  width: 72px;
  height: 72px;
  border-radius: var(--md3-rounded-full);
  background: var(--md3-secondary-container);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--md3-space-4);
}

.cancel-icon {
  font-size: 2.5rem !important;
  color: var(--md3-secondary);
}

h1 {
  font-family: var(--md3-font-headline);
  font-size: var(--md3-headline-md);
  font-weight: var(--md3-weight-bold);
  color: var(--md3-on-surface);
  margin-bottom: var(--md3-space-2);
  letter-spacing: var(--md3-headline-tracking);
  line-height: var(--md3-headline-line-height);
}

.cancel-msg {
  color: var(--md3-on-surface-variant);
  margin-bottom: var(--md3-space-2);
  line-height: var(--md3-body-line-height);
  font-size: var(--md3-body-lg);
}

.cancel-submsg {
  color: var(--md3-outline);
  font-size: var(--md3-body-md);
  margin-bottom: var(--md3-space-6);
  line-height: var(--md3-body-line-height);
}

.actions {
  display: flex;
  gap: var(--md3-space-2);
  justify-content: center;
  flex-wrap: wrap;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: var(--md3-space-1);
  padding: 0.625rem var(--md3-space-4);
  border-radius: var(--md3-rounded-full);
  font-family: var(--md3-font-label);
  font-weight: var(--md3-weight-semibold);
  font-size: var(--md3-label-lg);
  text-decoration: none;
  cursor: pointer;
  border: none;
  transition:
    background var(--md3-transition-fast),
    box-shadow var(--md3-transition-fast);
  letter-spacing: var(--md3-label-tracking);
}

.btn-icon {
  font-size: 1rem !important;
}

.btn-primary {
  background: var(--md3-gradient-cta);
  color: var(--md3-on-primary);
  box-shadow: var(--md3-shadow-card);
}

.btn-primary:hover {
  background: var(--md3-gradient-cta-hover);
  box-shadow: var(--md3-shadow-elevated);
}

.btn-ghost {
  background: transparent;
  color: var(--md3-on-surface);
  border: 1.5px solid var(--md3-outline-variant);
}

.btn-ghost:hover {
  background: var(--md3-surface-container-low);
}
</style>
