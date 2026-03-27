<template>
  <div class="cancel-page">
    <div class="cancel-card">
      <div class="cancel-icon" aria-hidden="true">😌</div>
      <h1>No te preocupes</h1>
      <p class="cancel-msg">
        Podés suscribirte cuando quieras. Tus datos y platos están seguros.
      </p>
      <p class="cancel-submsg">
        Seguís teniendo acceso al plan gratuito con todas sus funciones.
      </p>

      <div class="actions">
        <RouterLink to="/pricing" class="btn btn-primary">Ver planes</RouterLink>
        <RouterLink to="/" class="btn btn-ghost">Volver al inicio</RouterLink>
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
  padding: 1rem;
}

.cancel-card {
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 1.5rem;
  padding: 2.5rem 2rem;
  max-width: 440px;
  width: 100%;
  text-align: center;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
}

.cancel-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

h1 {
  font-size: 1.75rem;
  font-weight: 800;
  color: #111827;
  margin-bottom: 0.75rem;
}

.cancel-msg {
  color: #4b5563;
  margin-bottom: 0.5rem;
  line-height: 1.6;
}

.cancel-submsg {
  color: #9ca3af;
  font-size: 0.875rem;
  margin-bottom: 2rem;
}

.actions {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
  flex-wrap: wrap;
}

.btn {
  padding: 0.625rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  text-decoration: none;
  font-size: 0.9rem;
  cursor: pointer;
  border: none;
}

.btn-primary {
  background: #16a34a;
  color: white;
}

.btn-ghost {
  background: transparent;
  color: #374151;
  border: 2px solid #e5e7eb;
}
</style>
