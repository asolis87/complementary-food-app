<template>
  <Transition name="offline-banner">
    <div v-if="!isOnline || isSyncing" class="offline-banner" role="status" aria-live="polite">
      <span class="offline-icon" aria-hidden="true">{{ isSyncing ? '🔄' : '📵' }}</span>
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
  gap: 0.5rem;
  background: #1f2937;
  color: #f9fafb;
  font-size: 0.8rem;
  font-weight: 500;
  padding: 0.4rem 1rem;
  text-align: center;
  position: sticky;
  top: 0;
  z-index: 200;
}

.offline-icon {
  font-size: 1rem;
  flex-shrink: 0;
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
