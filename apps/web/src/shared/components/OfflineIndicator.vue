<template>
  <Transition name="offline-banner">
    <div v-if="!isOnline || isSyncing" class="offline-banner" role="status" aria-live="polite">
      <span class="material-symbols-outlined offline-icon" aria-hidden="true">
        {{ isSyncing ? 'sync' : 'wifi_off' }}
      </span>
      <span class="offline-text">{{ bannerText }}</span>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useOnlineStatus } from '@/shared/composables/useOnlineStatus.js'

const props = defineProps<{
  isSyncing?: boolean
}>()

const { isOnline } = useOnlineStatus()

const bannerText = computed(() => {
  if (props.isSyncing) return 'Sincronizando...'
  return 'Sin conexión — podés seguir armando platos'
})
</script>

<style scoped>
.offline-banner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--md3-space-2);
  background: var(--md3-tertiary-container);
  color: var(--md3-on-tertiary-container);
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-sm);
  font-weight: var(--md3-weight-medium);
  padding: var(--md3-space-2) var(--md3-space-4);
  text-align: center;
  position: sticky;
  top: 0;
  z-index: 200;
  /* No border — background shift handles visual separation */
}

.offline-icon {
  font-size: 1rem;
  font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20;
  flex-shrink: 0;
  /* Sync icon gets a rotation animation */
  animation: v-bind("isSyncing ? 'spin 1.2s linear infinite' : 'none'");
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}

/* Slide down / up transition */
.offline-banner-enter-active,
.offline-banner-leave-active {
  transition: max-height 0.25s ease, opacity 0.25s ease;
  overflow: hidden;
  max-height: 3rem;
}

.offline-banner-enter-from,
.offline-banner-leave-to {
  max-height: 0;
  opacity: 0;
}
</style>
