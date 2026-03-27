<template>
  <div class="auth-page">
    <div class="auth-card">
      <!-- Logo / Title -->
      <div class="auth-header">
        <span class="auth-logo" aria-hidden="true">🥦</span>
        <h1 class="auth-title">Crear cuenta gratis</h1>
        <p class="auth-subtitle">Guardá tus platos y realizá seguimiento de tu bebé</p>
      </div>

      <!-- Error banner -->
      <div v-if="authStore.error" class="error-banner" role="alert">
        <span aria-hidden="true">⚠️</span>
        {{ authStore.error }}
      </div>

      <!-- Signup form -->
      <form class="auth-form" novalidate @submit.prevent="handleSubmit">
        <!-- Name -->
        <div class="form-group">
          <label for="name" class="form-label">Tu nombre</label>
          <input
            id="name"
            v-model="name"
            type="text"
            class="form-input"
            :class="{ 'input-error': errors.name }"
            placeholder="Ana García"
            autocomplete="name"
            required
            :disabled="authStore.loading"
          />
          <span v-if="errors.name" class="field-error" role="alert">{{ errors.name }}</span>
        </div>

        <!-- Email -->
        <div class="form-group">
          <label for="email" class="form-label">Correo electrónico</label>
          <input
            id="email"
            v-model="email"
            type="email"
            class="form-input"
            :class="{ 'input-error': errors.email }"
            placeholder="tu@correo.com"
            autocomplete="email"
            required
            :disabled="authStore.loading"
          />
          <span v-if="errors.email" class="field-error" role="alert">{{ errors.email }}</span>
        </div>

        <!-- Password -->
        <div class="form-group">
          <label for="password" class="form-label">Contraseña</label>
          <div class="input-wrapper">
            <input
              id="password"
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              class="form-input"
              :class="{ 'input-error': errors.password }"
              placeholder="Mínimo 8 caracteres"
              autocomplete="new-password"
              required
              :disabled="authStore.loading"
            />
            <button
              type="button"
              class="toggle-pwd"
              :aria-label="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'"
              @click="showPassword = !showPassword"
            >
              {{ showPassword ? '🙈' : '👁️' }}
            </button>
          </div>
          <span v-if="errors.password" class="field-error" role="alert">{{ errors.password }}</span>
        </div>

        <!-- Confirm Password -->
        <div class="form-group">
          <label for="confirmPassword" class="form-label">Confirmar contraseña</label>
          <div class="input-wrapper">
            <input
              id="confirmPassword"
              v-model="confirmPassword"
              :type="showPassword ? 'text' : 'password'"
              class="form-input"
              :class="{ 'input-error': errors.confirmPassword }"
              placeholder="Repetí tu contraseña"
              autocomplete="new-password"
              required
              :disabled="authStore.loading"
            />
          </div>
          <span v-if="errors.confirmPassword" class="field-error" role="alert">{{ errors.confirmPassword }}</span>
        </div>

        <!-- Submit -->
        <button
          type="submit"
          class="btn btn-primary btn-full"
          :disabled="authStore.loading"
        >
          <span v-if="authStore.loading" class="spinner-sm" aria-hidden="true" />
          {{ authStore.loading ? 'Creando cuenta...' : 'Crear cuenta gratis' }}
        </button>
      </form>

      <!-- Login link -->
      <p class="auth-link">
        ¿Ya tenés cuenta?
        <RouterLink to="/auth/login">Iniciá sesión</RouterLink>
      </p>

      <!-- Terms notice -->
      <p class="terms-note">
        Al registrarte aceptás nuestros términos de uso. Tu información está protegida.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/shared/stores/authStore.js'

const authStore = useAuthStore()
const router = useRouter()

// ─── Form state ───────────────────────────────────────────────────────────
const name = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
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

// ─── Handler ──────────────────────────────────────────────────────────────
async function handleSubmit() {
  if (!validate()) return
  try {
    await authStore.signUp(email.value, password.value, name.value.trim())
    await router.push('/')
  } catch {
    // Error is displayed via authStore.error
  }
}
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: #f9fafb;
}

.auth-card {
  width: 100%;
  max-width: 420px;
  background: white;
  border-radius: 1.5rem;
  padding: 2rem 1.75rem;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.auth-header {
  text-align: center;
}

.auth-logo {
  font-size: 2.5rem;
}

.auth-title {
  margin: 0.5rem 0 0.25rem;
  font-size: 1.4rem;
  font-weight: 700;
  color: #111827;
}

.auth-subtitle {
  margin: 0;
  font-size: 0.875rem;
  color: #6b7280;
}

/* Error */
.error-banner {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 0.75rem;
  font-size: 0.875rem;
  color: #b91c1c;
}

/* Form */
.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.form-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
}

.input-wrapper {
  position: relative;
  display: flex;
}

.form-input {
  width: 100%;
  padding: 0.65rem 1rem;
  border: 1.5px solid #e5e7eb;
  border-radius: 0.75rem;
  font-size: 1rem;
  color: #111827;
  outline: none;
  transition: border-color 0.15s;
  box-sizing: border-box;
}

.form-input:focus {
  border-color: #10b981;
}

.form-input.input-error {
  border-color: #ef4444;
}

.form-input:disabled {
  background: #f9fafb;
  color: #9ca3af;
}

.toggle-pwd {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.1rem;
  padding: 0.25rem;
  line-height: 1;
}

.field-error {
  font-size: 0.75rem;
  color: #ef4444;
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 0.75rem;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all 0.15s;
  text-decoration: none;
}

.btn-full {
  width: 100%;
}

.btn-primary {
  background: #10b981;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #059669;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Spinner */
.spinner-sm {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Link */
.auth-link {
  text-align: center;
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
}

.auth-link a {
  color: #10b981;
  font-weight: 600;
  text-decoration: none;
}

.auth-link a:hover {
  text-decoration: underline;
}

.terms-note {
  text-align: center;
  font-size: 0.75rem;
  color: #9ca3af;
  margin: 0;
  line-height: 1.5;
}
</style>
