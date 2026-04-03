/**
 * UI state store — modals, notifications, loading states.
 */

import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUiStore = defineStore('ui', () => {
  const isOnline = ref(navigator.onLine)
  const showUpgradeModal = ref(false)
  const upgradeReason = ref<string>('')
  const toasts = ref<Array<{ id: string; message: string; type: 'success' | 'error' | 'warning' | 'info' }>>([])

  // Track online/offline status
  window.addEventListener('online', () => { isOnline.value = true })
  window.addEventListener('offline', () => { isOnline.value = false })

  function showUpgradePrompt(reason: string) {
    upgradeReason.value = reason
    showUpgradeModal.value = true
  }

  function addToast(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') {
    const id = Date.now().toString()
    toasts.value.push({ id, message, type })
    setTimeout(() => {
      toasts.value = toasts.value.filter((t) => t.id !== id)
    }, 4000)
  }

  return {
    isOnline,
    showUpgradeModal,
    upgradeReason,
    toasts,
    showUpgradePrompt,
    addToast,
  }
})
