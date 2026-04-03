<template>
  <div class="not-found">
    <div class="not-found-card">
      <span class="material-symbols-outlined not-found-icon" aria-hidden="true">search_off</span>
      <p class="not-found-number" aria-label="Error 404">404</p>
      <h1 class="not-found-title">Página no encontrada</h1>
      <p class="not-found-description">
        La página que buscás no existe o fue movida a otro lugar.
      </p>
      <RouterLink to="/" class="home-btn">
        <span class="material-symbols-outlined" aria-hidden="true">home</span>
        Volver al inicio
      </RouterLink>
    </div>
  </div>
</template>

<style scoped>
.not-found {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--md3-space-12) var(--md3-space-3);
  min-height: 60vh;
  background: var(--md3-surface);
}

.not-found-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--md3-space-3);
  text-align: center;
  background: var(--md3-surface-container-lowest);
  border-radius: var(--md3-rounded-lg);
  padding: var(--md3-space-8) var(--md3-space-6);
  max-width: 420px;
  width: 100%;
  box-shadow: var(--md3-shadow-ambient);
}

.not-found-icon {
  font-size: 4rem;
  color: var(--md3-on-surface-variant);
  font-variation-settings: 'FILL' 0, 'wght' 300;
}

.not-found-number {
  margin: 0;
  font-family: var(--md3-font-headline);
  font-size: var(--md3-display-md);
  font-weight: var(--md3-weight-bold);
  letter-spacing: var(--md3-display-tracking);
  line-height: var(--md3-display-line-height);
  color: var(--md3-outline-variant);
}

.not-found-title {
  margin: 0;
  font-family: var(--md3-font-headline);
  font-size: var(--md3-headline-sm);
  font-weight: var(--md3-weight-semibold);
  letter-spacing: var(--md3-headline-tracking);
  line-height: var(--md3-headline-line-height);
  color: var(--md3-on-surface);
}

.not-found-description {
  margin: 0;
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-md);
  line-height: var(--md3-body-line-height);
  color: var(--md3-on-surface-variant);
}

.home-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--md3-space-2);
  padding: 0.75rem 1.75rem;
  background: var(--md3-gradient-cta);
  color: var(--md3-on-primary);
  border-radius: var(--md3-rounded-full);
  text-decoration: none;
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-lg);
  font-weight: var(--md3-weight-semibold);
  letter-spacing: var(--md3-label-tracking);
  margin-top: var(--md3-space-1);
  transition: background var(--md3-transition-fast), box-shadow var(--md3-transition-fast);
}

.home-btn:hover {
  background: var(--md3-gradient-cta-hover);
  box-shadow: var(--md3-shadow-card);
}

.home-btn .material-symbols-outlined {
  font-size: 1.125rem;
  font-variation-settings: 'FILL' 0, 'wght' 400;
}
</style>
