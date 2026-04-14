<template>
  <AuthLayout variant="signup">
    <div class="signup-form">
      <h1 class="signup-form__title">Crea tu cuenta gratis</h1>
      <p class="signup-form__subtitle">Guarda tus platos y realiza seguimiento de tu bebé</p>

      <!-- Error banner -->
      <div v-if="authStore.error" class="error-banner" role="alert">
        <span class="material-symbols-outlined error-banner__icon" aria-hidden="true">warning</span>
        {{ authStore.error }}
      </div>

      <form novalidate @submit.prevent="handleSubmit">
        <div class="form-fields">
          <AppInput
            v-model="name"
            type="text"
            label="Tu nombre"
            placeholder="Ana García"
            :error="errors.name"
            icon="person"
            required
            :disabled="authStore.loading"
          />

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

          <AppInput
            v-model="password"
            type="password"
            label="Contraseña"
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
            placeholder="Repite tu contraseña"
            :error="errors.confirmPassword"
            icon="lock_reset"
            required
            :disabled="authStore.loading"
          />
        </div>

        <!-- Terms acceptance -->
        <label class="terms-check">
          <input
            type="checkbox"
            v-model="acceptedTerms"
            class="terms-check__checkbox"
            required
          />
          <span class="terms-check__label">
            Acepto los
            <router-link to="/terminos" target="_blank" class="terms-check__link">términos de uso</router-link>
            y la
            <router-link to="/privacidad" target="_blank" class="terms-check__link">política de privacidad</router-link>
          </span>
        </label>

        <div class="form-actions">
          <AppButton
            type="submit"
            variant="primary"
            :full-width="true"
            :loading="authStore.loading"
            :disabled="!acceptedTerms"
            size="lg"
          >
            Crear Cuenta
          </AppButton>
        </div>
      </form>

      <div class="divider">
        <span class="divider__text">o regístrate con</span>
      </div>

      <button
        class="google-signup-btn"
        type="button"
        :disabled="authStore.loading"
        @click="handleGoogleSignup"
      >
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        Continuar con Google
      </button>

      <p class="login-link">
        ¿Ya tienes cuenta?
        <router-link to="/auth/login">Inicia sesión</router-link>
      </p>
    </div>
  </AuthLayout>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/shared/stores/authStore.js'
import AuthLayout from '@/shared/components/AuthLayout.vue'
import AppButton from '@/shared/components/AppButton.vue'
import AppInput from '@/shared/components/AppInput.vue'

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

// ─── Form state ───────────────────────────────────────────────────────────
const name = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const acceptedTerms = ref(false)
const errors = reactive({
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
})

onMounted(() => {
  authStore.clearError()
})

// ─── Validation ────────────────────────────────────────────────────────────
function validate(): boolean {
  errors.name = ''
  errors.email = ''
  errors.password = ''
  errors.confirmPassword = ''
  let valid = true

  if (!name.value.trim()) {
    errors.name = 'El nombre es obligatorio'
    valid = false
  }

  if (!email.value) {
    errors.email = 'El correo es obligatorio'
    valid = false
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
    errors.email = 'Ingresa un correo válido'
    valid = false
  }

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

// ─── Handlers ──────────────────────────────────────────────────────────────
async function handleSubmit() {
  if (!validate()) return
  try {
    await authStore.signUp(email.value, password.value, name.value.trim())
    // Redirect to plan selection onboarding, preserving the redirect param
    const redirect = route.query.redirect as string | undefined
    await router.push(redirect ? `/onboarding/plan?redirect=${encodeURIComponent(redirect)}` : '/onboarding/plan')
  } catch {
    // Error is displayed via authStore.error
  }
}

function handleGoogleSignup() {
  authStore.signInWithGoogle()
}
</script>

<style scoped>
/* ─── Form container ─── */
.signup-form {
  width: 100%;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-4);
}

/* ─── Heading ─── */
.signup-form__title {
  margin: 0;
  font-family: var(--md3-font-headline);
  font-size: var(--md3-headline-md);
  font-weight: var(--md3-weight-bold);
  color: var(--md3-on-surface);
  line-height: var(--md3-headline-line-height);
  letter-spacing: var(--md3-headline-tracking);
}

.signup-form__subtitle {
  margin: 0;
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-md);
  color: var(--md3-on-surface-variant);
  line-height: var(--md3-body-line-height);
}

/* ─── Error banner ─── */
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

/* ─── Form fields ─── */
.form-fields {
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-3);
}

/* ─── Terms checkbox ─── */
.terms-check {
  display: flex;
  align-items: flex-start;
  gap: var(--md3-space-2);
  cursor: pointer;
  margin-top: var(--md3-space-2);
}

.terms-check__checkbox {
  width: 18px;
  height: 18px;
  margin-top: 2px;
  accent-color: var(--md3-secondary);
  cursor: pointer;
  flex-shrink: 0;
}

.terms-check__label {
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-lg);
  font-weight: var(--md3-weight-medium);
  color: var(--md3-on-surface-variant);
  line-height: var(--md3-label-line-height);
  user-select: none;
}

.terms-check__link {
  color: var(--md3-secondary);
  font-weight: var(--md3-weight-semibold);
  text-decoration: none;
  transition: color var(--md3-transition-fast);
}

.terms-check__link:hover {
  color: var(--md3-secondary-dim);
  text-decoration: underline;
}

/* ─── Form actions ─── */
.form-actions {
  margin-top: var(--md3-space-3);
}

/* ─── Divider ─── */
.divider {
  display: flex;
  align-items: center;
  gap: var(--md3-space-3);
  color: var(--md3-outline-variant);
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--md3-outline-variant);
}

.divider__text {
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-md);
  font-weight: var(--md3-weight-medium);
  color: var(--md3-outline);
  white-space: nowrap;
}

/* ─── Google signup button ─── */
.google-signup-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--md3-space-2);
  padding: var(--md3-space-3) var(--md3-space-4);
  min-height: 48px;
  border-radius: var(--md3-rounded-full);
  border: 1px solid var(--md3-outline-variant);
  background: var(--md3-surface-container-lowest);
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-lg);
  font-weight: var(--md3-weight-semibold);
  color: var(--md3-on-surface);
  cursor: pointer;
  transition: background var(--md3-transition-fast), box-shadow var(--md3-transition-fast);
}

.google-signup-btn:hover {
  background: var(--md3-surface-container);
  box-shadow: var(--md3-shadow-card);
}

.google-signup-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ─── Login link ─── */
.login-link {
  margin: 0;
  text-align: center;
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-md);
  color: var(--md3-on-surface-variant);
  line-height: var(--md3-body-line-height);
}

.login-link a {
  color: var(--md3-secondary);
  font-weight: var(--md3-weight-semibold);
  text-decoration: none;
  transition: color var(--md3-transition-fast);
}

.login-link a:hover {
  color: var(--md3-secondary-dim);
  text-decoration: underline;
}
</style>
