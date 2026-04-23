<template>
  <AuthLayout variant="login">
    <div class="forgot-form">
      <template v-if="!submitted">
        <h1 class="forgot-form__title">¿Olvidaste tu contraseña?</h1>
        <p class="forgot-form__subtitle">
          Ingresa tu correo y te enviaremos un enlace para restablecerla.
        </p>

        <!-- Error banner -->
        <div v-if="authStore.error" class="error-banner" role="alert">
          <span class="material-symbols-outlined error-banner__icon" aria-hidden="true">warning</span>
          {{ authStore.error }}
        </div>

        <form novalidate @submit.prevent="handleSubmit">
          <div class="form-fields">
            <AppInput
              v-model="email"
              type="email"
              label="Correo electrónico"
              placeholder="tu@email.com"
              :error="errors.email"
              icon="mail"
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
            Enviar enlace
          </AppButton>
        </form>

        <p class="back-link">
          <RouterLink to="/auth/login">Volver al inicio de sesión</RouterLink>
        </p>
      </template>

      <!-- Success state — generic, no enumeration -->
      <template v-else>
        <div class="success-card">
          <span class="material-symbols-outlined success-icon" aria-hidden="true">mail</span>
          <h1 class="success-card__title">Revisa tu correo</h1>
          <p class="success-card__subtitle">
            Si la dirección está registrada, recibirás un enlace para restablecer tu contraseña.
          </p>
          <p class="success-card__hint">
            Revisa también tu carpeta de spam.
          </p>
          <AppButton variant="primary" size="lg" @click="goLogin">
            Volver al inicio de sesión
          </AppButton>
        </div>
      </template>
    </div>
  </AuthLayout>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/shared/stores/authStore.js'
import AuthLayout from '@/shared/components/AuthLayout.vue'
import AppButton from '@/shared/components/AppButton.vue'
import AppInput from '@/shared/components/AppInput.vue'

const authStore = useAuthStore()
const router = useRouter()

const email = ref('')
const submitted = ref(false)
const errors = reactive({ email: '' })

onMounted(() => {
  authStore.clearError()
})

function validate(): boolean {
  errors.email = ''
  let valid = true

  if (!email.value) {
    errors.email = 'El correo es obligatorio'
    valid = false
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
    errors.email = 'Ingresa un correo válido'
    valid = false
  }

  return valid
}

async function handleSubmit() {
  if (!validate()) return

  try {
    await authStore.forgotPassword(email.value)
    submitted.value = true
  } catch {
    // Error is displayed via authStore.error
  }
}

function goLogin() {
  router.push('/auth/login')
}
</script>

<style scoped>
.forgot-form {
  width: 100%;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-6);
}

.forgot-form__title {
  margin: 0;
  font-family: var(--md3-font-headline);
  font-size: var(--md3-headline-md);
  font-weight: var(--md3-weight-bold);
  color: var(--md3-on-surface);
  line-height: var(--md3-headline-line-height);
}

.forgot-form__subtitle {
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

.back-link {
  margin: 0;
  text-align: center;
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-md);
  color: var(--md3-on-surface-variant);
  line-height: var(--md3-body-line-height);
}

.back-link a {
  color: var(--md3-primary);
  font-weight: var(--md3-weight-semibold);
  text-decoration: none;
  transition: color var(--md3-transition-fast);
}

.back-link a:hover {
  color: var(--md3-primary-dim);
  text-decoration: underline;
}

.success-card {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--md3-space-4);
  padding: var(--md3-space-4) 0;
  text-align: center;
}

.success-icon {
  font-size: 4rem !important;
  color: var(--md3-primary);
  flex-shrink: 0;
}

.success-card__title {
  margin: 0;
  font-family: var(--md3-font-headline);
  font-size: var(--md3-headline-md);
  font-weight: var(--md3-weight-bold);
  color: var(--md3-on-surface);
  line-height: var(--md3-headline-line-height);
}

.success-card__subtitle {
  margin: 0;
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-md);
  color: var(--md3-on-surface-variant);
  line-height: var(--md3-body-line-height);
}

.success-card__hint {
  margin: 0;
  font-family: var(--md3-font-body);
  font-size: var(--md3-label-lg);
  color: var(--md3-outline);
  line-height: var(--md3-body-line-height);
}
</style>
