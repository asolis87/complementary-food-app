<template>
  <div class="dashboard-error" role="alert" aria-live="assertive">
    <div class="error-card">
      <!-- Error icon -->
      <span class="material-symbols-outlined error-icon" aria-hidden="true">
        {{ errorIcon }}
      </span>

      <!-- Error title -->
      <h2 class="error-title">{{ errorTitle }}</h2>

      <!-- Error message -->
      <p class="error-message">{{ errorMessage }}</p>

      <!-- Suggestion text -->
      <p v-if="errorSuggestion" class="error-suggestion">
        {{ errorSuggestion }}
      </p>

      <!-- Action buttons -->
      <div class="error-actions">
        <button
          class="retry-btn"
          :disabled="retrying"
          @click="handleRetry"
        >
          <span
            v-if="retrying"
            class="spinner"
            aria-hidden="true"
          />
          <span v-else class="material-symbols-outlined" aria-hidden="true">refresh</span>
          {{ retrying ? 'Reintentando...' : 'Reintentar' }}
        </button>

        <button
          v-if="showGoHomeButton"
          class="home-btn"
          @click="handleGoHome"
        >
          <span class="material-symbols-outlined" aria-hidden="true">home</span>
          Volver al inicio
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

const props = withDefaults(
  defineProps<{
    /** HTTP status code (or 0 for network errors) */
    statusCode?: number
    /** Human-readable error message */
    message?: string
    /** If true, show "Volver al inicio" button */
    showGoHome?: boolean
  }>(),
  {
    statusCode: 0,
    message: undefined,
    showGoHome: false,
  },
)

const emit = defineEmits<{
  retry: []
}>()

const router = useRouter()
const retrying = ref(false)

// ── Error icon by status code ──────────────────────────────────────────

const errorIcon = computed(() => {
  switch (props.statusCode) {
    case 401:
      return 'lock'
    case 403:
      return 'block'
    case 404:
      return 'search_off'
    case 500:
    case 502:
    case 503:
      return 'cloud_off'
    default:
      return 'error_outline'
  }
})

// ── Error title by status code ─────────────────────────────────────────

const errorTitle = computed(() => {
  switch (props.statusCode) {
    case 401:
      return 'Sesión expirada'
    case 403:
      return 'Acceso restringido'
    case 404:
      return 'Perfil no encontrado'
    case 500:
    case 502:
    case 503:
      return 'Error del servidor'
    default:
      return 'No se pudo cargar el dashboard'
  }
})

// ── Error message — uses prop or sensible default ──────────────────────

const errorMessage = computed(() => {
  if (props.message) return props.message

  switch (props.statusCode) {
    case 401:
      return 'Tu sesión ha expirado. Inicia sesión nuevamente para ver tu dashboard.'
    case 403:
      return 'No tienes permiso para ver este perfil. Verifica que el perfil te pertenezca o actualiza tu plan.'
    case 404:
      return 'El perfil del bebé no se encontró. Puede haber sido eliminado o movido.'
    default:
      return 'Ocurrió un error inesperado al cargar los datos. Intenta de nuevo o recarga la página.'
  }
})

// ── Suggestion text ────────────────────────────────────────────────────

const errorSuggestion = computed(() => {
  switch (props.statusCode) {
    case 401:
      return undefined
    case 403:
      return 'Si creés que esto es un error, contactá a soporte.'
    case 404:
      return undefined
    case 500:
      return 'Estamos trabajando para solucionarlo. Intentá nuevamente en unos minutos.'
    default:
      return 'Verificá tu conexión e intentá nuevamente.'
  }
})

// ── Show "go home" ─────────────────────────────────────────────────────

const showGoHomeButton = computed(() => {
  return props.showGoHome || props.statusCode === 401 || props.statusCode === 403
})

// ── Handlers ───────────────────────────────────────────────────────────

async function handleRetry() {
  retrying.value = true
  emit('retry')
  // Reset after a short delay (the parent handles the actual retry)
  setTimeout(() => {
    retrying.value = false
  }, 2000)
}

function handleGoHome() {
  void router.push({ name: 'home' })
}
</script>

<style scoped>
.dashboard-error {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--md3-space-12) var(--md3-space-3);
  min-height: 300px;
}

@media (min-width: 768px) {
  .dashboard-error {
    min-height: 400px;
  }
}

.error-card {
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

.error-icon {
  font-size: 3.5rem;
  color: var(--md3-error);
  font-variation-settings: 'FILL' 0, 'wght' 300;
}

.error-title {
  margin: 0;
  font-family: var(--md3-font-headline);
  font-size: var(--md3-headline-sm);
  font-weight: var(--md3-weight-semibold);
  letter-spacing: var(--md3-headline-tracking);
  line-height: var(--md3-headline-line-height);
  color: var(--md3-on-surface);
}

.error-message {
  margin: 0;
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-md);
  line-height: var(--md3-body-line-height);
  color: var(--md3-on-surface-variant);
  max-width: 340px;
}

.error-suggestion {
  margin: 0;
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-sm);
  color: var(--md3-outline);
  max-width: 320px;
}

.error-actions {
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-3);
  margin-top: var(--md3-space-2);
  width: 100%;
}

/* ─── Retry button ───────────────────────────────────────────── */
.retry-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--md3-space-2);
  padding: 0.75rem 1.75rem;
  background: var(--md3-gradient-cta);
  color: var(--md3-on-primary);
  border: none;
  border-radius: var(--md3-rounded-full);
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-lg);
  font-weight: var(--md3-weight-semibold);
  letter-spacing: var(--md3-label-tracking);
  cursor: pointer;
  transition: background var(--md3-transition-fast), box-shadow var(--md3-transition-fast);
  width: 100%;
}

.retry-btn:hover:not(:disabled) {
  background: var(--md3-gradient-cta-hover);
  box-shadow: var(--md3-shadow-card);
}

.retry-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* ─── Home button ────────────────────────────────────────────── */
.home-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--md3-space-2);
  padding: 0.65rem 1.25rem;
  background: var(--md3-surface-container);
  color: var(--md3-on-surface-variant);
  border: 1px solid var(--md3-outline-variant);
  border-radius: var(--md3-rounded-full);
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-md);
  font-weight: var(--md3-weight-medium);
  cursor: pointer;
  transition: background var(--md3-transition-fast);
  width: 100%;
}

.home-btn:hover {
  background: var(--md3-surface-container-high);
}

/* ─── Spinner ────────────────────────────────────────────────── */
.spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
