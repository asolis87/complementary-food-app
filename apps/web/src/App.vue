<template>
  <AppLayout>
    <RouterView />
  </AppLayout>

  <!-- First-time medical disclaimer (T-029) -->
  <MedicalDisclaimer variant="modal" />

  <!-- Global toast notifications (T-032) -->
  <ToastNotification />

  <!-- Global aria-live region for screen reader announcements (T-030) -->
  <div
    id="aria-live-region"
    aria-live="polite"
    aria-atomic="true"
    class="sr-only"
  />
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import AppLayout from '@/shared/layouts/AppLayout.vue'
import MedicalDisclaimer from '@/shared/components/MedicalDisclaimer.vue'
import ToastNotification from '@/shared/components/ToastNotification.vue'
import { useAuthStore } from '@/shared/stores/authStore.js'

const authStore = useAuthStore()

// Restore session on app mount (reads the BetterAuth cookie)
onMounted(async () => {
  await authStore.checkSession()
})
</script>

<style>
/* Visually hidden but accessible to screen readers */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
