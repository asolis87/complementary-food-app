<template>
  <AuthLayout variant="signup">
    <div class="signup-form">
      <h1 class="signup-form__title">Creá tu cuenta gratis</h1>
      <p class="signup-form__subtitle">Guardá tus platos y realizá seguimiento de tu bebé</p>

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
            placeholder="Repetí tu contraseña"
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
        <span class="divider__text">o registrate con</span>
      </div>

      <AppButton
        variant="outline"
        :full-width="true"
        icon="language"
        :disabled="authStore.loading"
        @click="handleGoogleSignup"
      >
        Continuar con Google
      </AppButton>

      <p class="login-link">
        ¿Ya tenés cuenta?
        <router-link to="/auth/login">Iniciá sesión</router-link>
      </p>
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

  if (!confirmPassword.value) {
    errors.confirmPassword = 'Confirmá tu contraseña'
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
    await router.push('/')
  } catch {
    // Error is displayed via authStore.error
  }
}

async function handleGoogleSignup() {
  // Google sign-up — to be implemented when OAuth provider is configured
  // authStore.signInWithGoogle()
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
