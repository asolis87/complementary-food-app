<template>
  <AuthLayout variant="login">
    <div class="reset-form">
      <!-- Loading state -->
      <div v-if="status === 'loading'" class="status-card">
        <span class="material-symbols-outlined status-icon spinning" aria-hidden="true">progress_activity</span>
        <h1 class="status-card__title">Procesando...</h1>
        <p class="status-card__subtitle">Espera un momento</p>
      </div>

      <!-- Token missing state -->
      <div v-else-if="status === 'missing'" class="status-card status-card--error">
        <span class="material-symbols-outlined status-icon" aria-hidden="true">error</span>
        <h1 class="status-card__title">Enlace inválido</h1>
        <p class="status-card__subtitle">
          Este enlace de restablecimiento no es válido. Solicita uno nuevo desde la página de recuperación.
        </p>
        <AppButton variant="primary" size="lg" @click="goForgotPassword">
          Solicitar nuevo enlace
        </AppButton>
      </div>

      <!-- Reset form -->
      <template v-else-if="status === 'ready'">
        <h1 class="reset-form__title">Nueva contraseña</h1>
        <p class="reset-form__subtitle">Ingresa tu nueva contraseña.</p>

        <!-- Error banner -->
        <div v-if="authStore.error" class="error-banner" role="alert">
          <span class="material-symbols-outlined error-banner__icon" aria-hidden="true">warning</span>
          {{ authStore.error }}
        </div>

        <form novalidate @submit.prevent="handleSubmit">
          <div class="form-fields">
            <AppInput
              v-model="password"
              type="password"
              label="Nueva contraseña"
              placeholder="Mínimo 8 caracteres"
              :error="errors.password"
              icon="lock"
              required
              :disabled="authStore.loading"
            />

            <AppInput
              v-model="confirmPassword"
              type="password"
              label="Confirmar contraseña"
              placeholder="Repite tu nueva contraseña"
              :error="errors.confirmPassword"
              icon="lock_reset"
              required
              :disabled="authStore.loading"
            />
          </div>

          <AppButton
            type="submit"
            variant="primary"
            :full-width="true"
            :loading="authStore.loading"
            size="lg"
          >
            Restablecer contraseña
          </AppButton>
        </form>
      </template>

      <!-- Success state -->
      <div v-else-if="status === 'success'" class="status-card status-card--success">
        <span class="material-symbols-outlined status-icon" aria-hidden="true">lock_reset</span>
        <h1 class="status-card__title">¡Contraseña actualizada!</h1>
        <p class="status-card__subtitle">
          Tu contraseña ha sido restablecida. Ahora puedes iniciar sesión.
        </p>
        <AppButton variant="primary" size="lg" @click="goLogin">
          Iniciar sesión
        </AppButton>
      </div>

      <!-- Error state -->
      <div v-else-if="status === 'error'" class="status-card status-card--error">
        <span class="material-symbols-outlined status-icon" aria-hidden="true">error</span>
        <h1 class="status-card__title">No se pudo restablecer</h1>
        <p class="status-card__subtitle">{{ errorMessage }}</p>
        <AppButton variant="primary" size="lg" @click="goForgotPassword">
          Solicitar nuevo enlace
        </AppButton>
      </div>
    </div>
  </AuthLayout>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/shared/stores/authStore.js'
import AuthLayout from '@/shared/components/AuthLayout.vue'
import AppButton from '@/shared/components/AppButton.vue'
import AppInput from '@/shared/components/AppInput.vue'

const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()

type Status = 'loading' | 'missing' | 'ready' | 'success' | 'error'

const status = ref<Status>('loading')
const errorMessage = ref('')
const password = ref('')
const confirmPassword = ref('')
const errors = reactive({ password: '', confirmPassword: '' })

onMounted(() => {
  authStore.clearError()
  const token = route.query.token as string | undefined

  if (!token) {
    errorMessage.value = 'El enlace de restablecimiento no contiene un token válido.'
    status.value = 'missing'
    return
  }

  // Store token for form submission
  password.value = ''
  confirmPassword.value = ''
  status.value = 'ready'
})

function validate(): boolean {
  errors.password = ''
  errors.confirmPassword = ''
  let valid = true

  if (!password.value) {
    errors.password = 'La contraseña es obligatoria'
    valid = false
  } else if (password.value.length < 8) {
    errors.password = 'La contraseña debe tener al menos 8 caracteres'
    valid = false
  }

  if (!confirmPassword.value) {
    errors.confirmPassword = 'Confirma tu contraseña'
    valid = false
  } else if (confirmPassword.value !== password.value) {
    errors.confirmPassword = 'Las contraseñas no coinciden'
    valid = false
  }

  return valid
}

async function handleSubmit() {
  if (!validate()) return

  const token = route.query.token as string

  try {
    await authStore.resetPassword(token, password.value)
    status.value = 'success'
  } catch {
    errorMessage.value = authStore.error || 'El enlace puede haber expirado o ya fue usado.'
    status.value = 'error'
  }
}

function goLogin() {
  router.push('/auth/login')
}

function goForgotPassword() {
  router.push('/auth/forgot-password')
}
</script>

<style scoped>
.reset-form {
  width: 100%;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-6);
}

.reset-form__title {
  margin: 0;
  font-family: var(--md3-font-headline);
  font-size: var(--md3-headline-md);
  font-weight: var(--md3-weight-bold);
  color: var(--md3-on-surface);
  line-height: var(--md3-headline-line-height);
}

.reset-form__subtitle {
  margin: 0;
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-md);
  color: var(--md3-on-surface-variant);
  line-height: var(--md3-body-line-height);
}

.error-banner {
  display: flex;
  align-items: center;
  gap: var(--md3-space-2);
  padding: var(--md3-space-3) var(--md3-space-4);
  background: var(--md3-on-error);
  border: 1px solid var(--md3-error-container);
  border-radius: var(--md3-rounded-md);
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-md);
  color: var(--md3-error);
  line-height: var(--md3-body-line-height);
}

.error-banner__icon {
  font-size: 1.125rem !important;
  flex-shrink: 0;
}

.form-fields {
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-4);
  margin-bottom: var(--md3-space-4);
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
