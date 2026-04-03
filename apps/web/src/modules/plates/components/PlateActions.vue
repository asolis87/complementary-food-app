<template>
  <!-- Desktop action row (hidden on mobile) -->
  <div class="plate-actions plate-actions--desktop">
    <!-- Save -->
    <div class="action-wrap">
      <button
        class="action-btn btn-save"
        :disabled="!canSave || !hasItems || saving"
        :title="saveTooltip"
        :aria-label="saveTooltip"
        @click="emit('save')"
      >
        <span v-if="saving" class="btn-spinner" aria-hidden="true" />
        <span v-else class="material-symbols-outlined btn-icon" aria-hidden="true">save</span>
        {{ saving ? 'Guardando...' : 'Guardar Plato' }}
      </button>
      <p v-if="!canSave" class="action-hint">
        <span class="material-symbols-outlined hint-icon" aria-hidden="true">info</span>
        {{ saveHint }}
      </p>
    </div>

    <!-- Export -->
    <button
      class="action-btn btn-export"
      :disabled="!hasItems || exporting"
      title="Exportar como imagen"
      aria-label="Exportar plato como imagen"
      @click="emit('export')"
    >
      <span v-if="exporting" class="btn-spinner btn-spinner--dark" aria-hidden="true" />
      <span v-else class="material-symbols-outlined btn-icon" aria-hidden="true">photo_camera</span>
      {{ exporting ? 'Exportando...' : 'Exportar' }}
    </button>

    <!-- Share -->
    <button
      class="action-btn btn-share"
      :disabled="!hasItems"
      title="Compartir plato"
      aria-label="Compartir plato"
      @click="emit('share')"
    >
      <span class="material-symbols-outlined btn-icon" aria-hidden="true">share</span>
      Compartir
    </button>

    <!-- Clear -->
    <button
      class="action-btn btn-clear"
      :disabled="!hasItems"
      title="Limpiar todos los alimentos"
      aria-label="Limpiar todos los alimentos del plato"
      @click="emit('clear')"
    >
      <span class="material-symbols-outlined btn-icon" aria-hidden="true">delete</span>
      Limpiar
    </button>
  </div>

  <!-- Mobile FAB (hidden on desktop) -->
  <div class="plate-fab">
    <button
      class="fab-btn"
      :disabled="!canSave || !hasItems || saving"
      :title="saveTooltip"
      :aria-label="saveTooltip"
      @click="emit('save')"
    >
      <span v-if="saving" class="btn-spinner fab-spinner" aria-hidden="true" />
      <span
        v-else
        class="material-symbols-outlined fab-icon"
        aria-hidden="true"
        style="font-variation-settings: 'wght' 700"
      >check</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '@/shared/stores/authStore.js'
import { usePlateStore } from '@/shared/stores/plateStore.js'
import { PLATE_LIMITS } from '@pakulab/shared'

const props = defineProps<{
  canSave: boolean
  hasItems: boolean
  saving?: boolean
  exporting?: boolean
}>()

const emit = defineEmits<{
  save: []
  export: []
  clear: []
  share: []
}>()

const authStore = useAuthStore()
const plateStore = usePlateStore()

const saveTooltip = computed(() => {
  if (!props.hasItems) return 'Agregá alimentos al plato primero'
  if (!authStore.isAuthenticated) return 'Iniciá sesión para guardar platos'
  const limit = PLATE_LIMITS[authStore.tier]
  if (plateStore.savedPlates.length >= limit) {
    return `Límite de ${limit} platos alcanzado. Actualizá a Pro para más.`
  }
  return 'Guardar plato'
})

const saveHint = computed(() => {
  if (!authStore.isAuthenticated) return 'Registrate gratis para guardar tus platos'
  const limit = PLATE_LIMITS[authStore.tier]
  if (plateStore.savedPlates.length >= limit)
    return `Límite de platos alcanzado (${limit}/${limit})`
  return ''
})
</script>

<style scoped>
/* ─── Desktop action row ─── */
.plate-actions--desktop {
  display: none;
}

@media (min-width: 768px) {
  .plate-actions--desktop {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    align-items: flex-start;
    justify-content: flex-end;
  }
}

.action-wrap {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.65rem var(--md3-space-3);
  border-radius: var(--md3-rounded-full);
  border: none;
  cursor: pointer;
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-lg);
  font-weight: var(--md3-weight-semibold);
  transition: opacity var(--md3-transition-fast), background var(--md3-transition-fast);
  white-space: nowrap;
}

.action-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.btn-icon {
  font-size: 1.1rem;
}

/* Primary CTA — save */
.btn-save {
  background: var(--md3-gradient-cta);
  color: var(--md3-on-primary);
  box-shadow: var(--md3-shadow-card);
}

.btn-save:not(:disabled):hover {
  opacity: 0.9;
}

/* Secondary — export */
.btn-export {
  background: var(--md3-secondary);
  color: var(--md3-on-secondary);
}

.btn-export:not(:disabled):hover {
  background: var(--md3-secondary-dim);
}

/* Ghost — share */
.btn-share {
  background: var(--md3-surface-container-low);
  color: var(--md3-on-surface);
}

.btn-share:not(:disabled):hover {
  background: var(--md3-surface-container);
}

/* Destructive ghost — clear */
.btn-clear {
  background: var(--md3-surface-container-low);
  color: var(--md3-error);
}

.btn-clear:not(:disabled):hover {
  background: var(--md3-error-container);
  color: var(--md3-on-error-container);
}

/* Hint text */
.action-hint {
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  margin: 0;
  font-family: var(--md3-font-body);
  font-size: var(--md3-label-sm);
  color: var(--md3-tertiary);
}

.hint-icon {
  font-size: 0.9rem;
}

/* Spinner */
.btn-spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid color-mix(in srgb, var(--md3-on-primary) 30%, transparent);
  border-top-color: var(--md3-on-primary);
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  flex-shrink: 0;
}

.btn-spinner--dark {
  border-color: color-mix(in srgb, var(--md3-on-secondary) 25%, transparent);
  border-top-color: var(--md3-on-secondary);
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* ─── Mobile FAB ─── */
.plate-fab {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  /* Account for iPhone notch/home bar */
  padding-bottom: env(safe-area-inset-bottom);
  z-index: 40;
  display: flex;
}

@media (min-width: 768px) {
  .plate-fab {
    display: none;
  }
}

.fab-btn {
  width: 4rem;
  height: 4rem;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  background: var(--md3-gradient-cta);
  color: var(--md3-on-primary);
  box-shadow: 0 8px 24px -4px rgba(0, 105, 75, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform var(--md3-transition-fast), opacity var(--md3-transition-fast);
}

.fab-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.fab-btn:not(:disabled):active {
  transform: scale(0.95);
}

.fab-icon {
  font-size: 1.875rem; /* ~3xl equivalent */
}

.fab-spinner {
  width: 20px;
  height: 20px;
  border-width: 2.5px;
}
</style>
