<template>
  <div class="success-page">
    <div class="success-card">
      <div class="success-icon" aria-hidden="true">🎉</div>
      <h1>¡Bienvenido a Pro!</h1>
      <p class="success-msg">
        Tu suscripción está activa. Ya podés disfrutar de todas las funciones Pro.
      </p>

      <ul class="features-unlocked">
        <li>✅ Platos ilimitados</li>
        <li>✅ Hasta 3 perfiles de bebé</li>
        <li>✅ Bitácora completa</li>
        <li>✅ Menú semanal</li>
        <li>✅ Sin marca de agua</li>
      </ul>

      <div class="actions">
        <RouterLink to="/" class="btn btn-primary">Ir al inicio</RouterLink>
        <RouterLink to="/plates" class="btn btn-ghost">Mis platos</RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useBillingStore } from '@/shared/stores/billingStore.js'
import { useAuthStore } from '@/shared/stores/authStore.js'

const billingStore = useBillingStore()
const authStore = useAuthStore()

onMounted(async () => {
  // Refresh subscription status and auth session after successful checkout
  if (authStore.isAuthenticated) {
    await Promise.all([
      billingStore.fetchSubscription(),
      authStore.checkSession(),
    ])
  }
})
</script>

<style scoped>
.success-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: 1rem;
}

.success-card {
  background: white;
  border: 2px solid #16a34a;
  border-radius: 1.5rem;
  padding: 2.5rem 2rem;
  max-width: 480px;
  width: 100%;
  text-align: center;
  box-shadow: 0 8px 32px rgba(22, 163, 74, 0.12);
}

.success-icon {
  font-size: 3.5rem;
  margin-bottom: 1rem;
}

h1 {
  font-size: 1.75rem;
  font-weight: 800;
  color: #111827;
  margin-bottom: 0.75rem;
}

.success-msg {
  color: #4b5563;
  margin-bottom: 1.5rem;
  line-height: 1.6;
}

.features-unlocked {
  list-style: none;
  padding: 0;
  margin: 0 auto 2rem;
  text-align: left;
  display: inline-block;
  line-height: 2;
  color: #374151;
  font-size: 0.95rem;
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
