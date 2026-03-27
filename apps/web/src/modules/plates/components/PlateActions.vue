<template>
  <div class="plate-actions">
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
        <span v-else aria-hidden="true">💾</span>
        {{ saving ? 'Guardando...' : 'Guardar Plato' }}
      </button>
      <p v-if="!canSave" class="action-hint">{{ saveHint }}</p>
    </div>

    <!-- Export -->
    <button
      class="action-btn btn-export"
      :disabled="!hasItems || exporting"
      title="Exportar como imagen"
      aria-label="Exportar plato como imagen"
      @click="emit('export')"
    >
      <span v-if="exporting" class="btn-spinner" aria-hidden="true" />
      <span v-else aria-hidden="true">📷</span>
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
      <span aria-hidden="true">🔗</span>
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
      <span aria-hidden="true">🗑️</span>
      Limpiar
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '@/shared/stores/authStore.js'
import { usePlateStore } from '@/shared/stores/plateStore.js'
import { PLATE_LIMITS } from '@cfa/shared'

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
.plate-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: flex-start;
}

.action-wrap {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.6rem 1rem;
  border-radius: 0.75rem;
  border: none;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 600;
  transition: all 0.15s;
  white-space: nowrap;
}

.action-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.btn-save {
  background: #10b981;
  color: white;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.35);
}

.btn-save:not(:disabled):hover {
  background: #059669;
}

.btn-export {
  background: #6366f1;
  color: white;
}

.btn-export:not(:disabled):hover {
  background: #4f46e5;
}

.btn-share {
  background: #f3f4f6;
  color: #374151;
}

.btn-share:not(:disabled):hover {
  background: #e5e7eb;
}

.btn-clear {
  background: #fff1f2;
  color: #f43f5e;
  border: 1px solid #fecdd3;
}

.btn-clear:not(:disabled):hover {
  background: #ffe4e6;
}

.action-hint {
  margin: 0;
  font-size: 0.7rem;
  color: #f59e0b;
}

.btn-spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
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
