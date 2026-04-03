<template>
  <AuthLayout variant="login">
    <div class="login-form">
      <h1 class="login-form__title">¡Bienvenido de vuelta!</h1>
      <p class="login-form__subtitle">Iniciá sesión para ver tus platos guardados</p>

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

          <AppInput
            v-model="password"
            type="password"
            label="Contraseña"
            placeholder="Tu contraseña"
            :error="errors.password"
            icon="lock"
            required
            :disabled="authStore.loading"
          />
        </div>

        <div class="form-options">
          <label class="remember-me">
            <input type="checkbox" v-model="rememberMe" class="remember-me__checkbox" />
            <span class="remember-me__label">Recordarme</span>
          </label>
          <router-link to="/auth/forgot-password" class="forgot-link">¿Olvidaste tu contraseña?</router-link>
        </div>

        <AppButton
          type="submit"
          variant="primary"
          :full-width="true"
          :loading="authStore.loading"
          size="lg"
        >
          Iniciar Sesión
        </AppButton>
      </form>

      <div class="divider">
        <span class="divider__text">o continuá con</span>
      </div>

      <div class="alt-actions">
        <button
          class="google-icon-btn"
          type="button"
          aria-label="Continuar con Google"
          :disabled="authStore.loading"
          @click="handleGoogleLogin"
        >
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
        </button>

        <AppButton
          variant="ghost"
          :full-width="true"
          icon="visibility"
          :loading="isAnonymousLoading"
          :disabled="authStore.loading"
          @click="handleAnonymous"
        >
          Probar sin cuenta
        </AppButton>
      </div>

      <p class="signup-link">
        ¿No tenés cuenta?
        <router-link to="/auth/signup">Registrate gratis</router-link>
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
const email = ref('')
const password = ref('')
const rememberMe = ref(false)
const isAnonymousLoading = ref(false)
const errors = reactive({ email: '', password: '' })

onMounted(() => {
  authStore.clearError()
})

// ─── Validation ────────────────────────────────────────────────────────────
function validate(): boolean {
  errors.email = ''
  errors.password = ''
  let valid = true

  if (!email.value) {
    errors.email = 'El correo es obligatorio'
    valid = false
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
    errors.email = 'Ingresá un correo válido'
    valid = false
  }

  if (!password.value) {
    errors.password = 'La contraseña es obligatoria'
    valid = false
  } else if (password.value.length < 8) {
    errors.password = 'La contraseña debe tener al menos 8 caracteres'
    valid = false
  }

  return valid
}

// ─── Handlers ─────────────────────────────────────────────────────────────
async function handleSubmit() {
  if (!validate()) return
  try {
    await authStore.signIn(email.value, password.value)
    const redirect = (route.query.redirect as string) ?? '/'
    await router.push(redirect)
  } catch {
    // Error is displayed via authStore.error
  }
}

async function handleGoogleLogin() {
  // Google sign-in — to be implemented when OAuth provider is configured
  // authStore.signInWithGoogle()
}

async function handleAnonymous() {
  isAnonymousLoading.value = true
  try {
    await authStore.signInAnonymous()
    await router.push('/')
  } catch (err) {
    // Error displayed via authStore.error
    console.error('[LoginPage] Anonymous login failed:', err)
    console.error('[LoginPage] authStore.error:', authStore.error)
    // Re-throw para que el usuario vea el error en el banner
    throw err
  } finally {
    isAnonymousLoading.value = false
  }
}
</script>

<style scoped>
/* ─── Form container ─── */
.login-form {
  width: 100%;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-6);
}

/* ─── Heading ─── */
.login-form__title {
  margin: 0;
  font-family: var(--md3-font-headline);
  font-size: var(--md3-headline-md);
  font-weight: var(--md3-weight-bold);
  color: var(--md3-on-surface);
  line-height: var(--md3-headline-line-height);
  letter-spacing: var(--md3-headline-tracking);
}

.login-form__subtitle {
  margin: calc(-1 * var(--md3-space-3)) 0 0;
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
  gap: var(--md3-space-4);
}

/* ─── Form options (remember me + forgot) ─── */
.form-options {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--md3-space-3);
  flex-wrap: wrap;
  margin-top: var(--md3-space-4);
  margin-bottom: var(--md3-space-3);
}

.remember-me {
  display: flex;
  align-items: center;
  gap: var(--md3-space-2);
  cursor: pointer;
}

.remember-me__checkbox {
  width: 18px;
  height: 18px;
  accent-color: var(--md3-primary);
  cursor: pointer;
}

.remember-me__label {
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-lg);
  font-weight: var(--md3-weight-medium);
  color: var(--md3-on-surface-variant);
  user-select: none;
}

.forgot-link {
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-lg);
  font-weight: var(--md3-weight-semibold);
  color: var(--md3-primary);
  text-decoration: none;
  transition: color var(--md3-transition-fast);
}

.forgot-link:hover {
  color: var(--md3-primary-dim);
  text-decoration: underline;
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

/* ─── Alt actions (Google + anonymous) ─── */
.alt-actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--md3-space-3);
}

/* ─── Google icon button ─── */
.google-icon-btn {
  width: 48px;
  height: 48px;
  border-radius: var(--md3-rounded-full);
  border: 1px solid var(--md3-outline-variant);
  background: var(--md3-surface-container-lowest);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background var(--md3-transition-fast), box-shadow var(--md3-transition-fast);
}

.google-icon-btn:hover {
  background: var(--md3-surface-container);
  box-shadow: var(--md3-shadow-card);
}

.google-icon-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ─── Signup link ─── */
.signup-link {
  margin: 0;
  text-align: center;
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-md);
  color: var(--md3-on-surface-variant);
  line-height: var(--md3-body-line-height);
}

.signup-link a {
  color: var(--md3-primary);
  font-weight: var(--md3-weight-semibold);
  text-decoration: none;
  transition: color var(--md3-transition-fast);
}

.signup-link a:hover {
  color: var(--md3-primary-dim);
  text-decoration: underline;
}
</style>
