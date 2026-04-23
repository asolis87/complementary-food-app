<template>
  <AuthLayout variant="login">
    <div class="verify-email-form">
      <!-- Loading state -->
      <div v-if="status === 'loading'" class="status-card">
        <span class="material-symbols-outlined status-icon spinning" aria-hidden="true">progress_activity</span>
        <h1 class="status-card__title">Verificando tu correo...</h1>
        <p class="status-card__subtitle">Espera un momento</p>
      </div>

      <!-- Success state -->
      <div v-else-if="status === 'success'" class="status-card status-card--success">
        <span class="material-symbols-outlined status-icon" aria-hidden="true">mark_email_read</span>
        <h1 class="status-card__title">¡Correo verificado!</h1>
        <p class="status-card__subtitle">
          Tu correo ha sido verificado exitosamente.
          <span v-if="isRedirecting">Redirigiendo al inicio...</span>
        </p>
        <AppButton variant="primary" size="lg" @click="goHome">
          Ir al inicio ahora
        </AppButton>
      </div>

      <!-- Error state -->
      <div v-else-if="status === 'error'" class="status-card status-card--error">
        <span class="material-symbols-outlined status-icon" aria-hidden="true">error</span>
        <h1 class="status-card__title">No se pudo verificar</h1>
        <p class="status-card__subtitle">{{ errorMessage }}</p>
        <AppButton variant="primary" size="lg" @click="goLogin">
          Volver al inicio de sesión
        </AppButton>
      </div>
    </div>
  </AuthLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/shared/stores/authStore.js'
import AuthLayout from '@/shared/components/AuthLayout.vue'
import AppButton from '@/shared/components/AppButton.vue'

const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()

type Status = 'loading' | 'success' | 'error'

const status = ref<Status>('loading')
const errorMessage = ref('')
const isRedirecting = ref(false)

onMounted(async () => {
  // Check for error from BetterAuth redirect
  const error = route.query.error as string | undefined
  
  if (error) {
    errorMessage.value = error === 'invalid_token' 
      ? 'El enlace expiró o ya fue usado.'
      : 'No se pudo verificar el correo.'
    status.value = 'error'
    return
  }
  
  // BetterAuth already verified the email and auto-signed-in
  // Just need to check session and redirect
  await authStore.checkSession()
  
  if (authStore.emailVerified && authStore.isAuthenticated) {
    status.value = 'success'
    
    // Auto-redirect to home after 2 seconds
    isRedirecting.value = true
    setTimeout(() => {
      router.push('/')
    }, 2000)
  } else {
    errorMessage.value = 'No se pudo completar la verificación.'
    status.value = 'error'
  }
})

function goHome() {
  router.push('/')
}

function goLogin() {
  router.push('/auth/login')
}
</script>

<style scoped>
.verify-email-form {
  width: 100%;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--md3-space-6);
}

.status-card {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--md3-space-4);
  padding: var(--md3-space-8) var(--md3-space-4);
  text-align: center;
}

.status-icon {
  font-size: 4rem !important;
  color: var(--md3-primary);
  flex-shrink: 0;
}

.status-card__title {
  margin: 0;
  font-family: var(--md3-font-headline);
  font-size: var(--md3-headline-md);
  font-weight: var(--md3-weight-bold);
  color: var(--md3-on-surface);
  line-height: var(--md3-headline-line-height);
}

.status-card__subtitle {
  margin: 0;
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-md);
  color: var(--md3-on-surface-variant);
  line-height: var(--md3-body-line-height);
}

.status-card--success .status-icon {
  color: var(--md3-primary);
}

.status-card--error .status-icon {
  color: var(--md3-error);
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.spinning {
  animation: spin 1s linear infinite;
}
</style>
