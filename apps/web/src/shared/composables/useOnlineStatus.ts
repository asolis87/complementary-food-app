/**
 * useOnlineStatus — reactive wrapper around `navigator.onLine`.
 * Listens to the browser `online` / `offline` events and exposes
 * a reactive boolean that components can bind to.
 *
 * Usage:
 *   const { isOnline } = useOnlineStatus()
 *
 * Design: AD7 — offline-first plate builder.
 */

import { ref, onMounted, onUnmounted } from 'vue'

export function useOnlineStatus() {
  const isOnline = ref(typeof navigator !== 'undefined' ? navigator.onLine : true)

  function handleOnline() {
    isOnline.value = true
  }

  function handleOffline() {
    isOnline.value = false
  }

  onMounted(() => {
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
  })

  onUnmounted(() => {
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
  })

  return { isOnline }
}
