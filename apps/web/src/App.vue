<template>
  <!-- Auth pages render their own layout (AuthLayout) — no AppLayout chrome needed -->
  <template v-if="isAuthRoute">
    <RouterView />
  </template>

  <!-- All other pages get the full app shell: header, bottom nav, footer -->
  <AppLayout v-else>
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
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import AppLayout from '@/shared/layouts/AppLayout.vue'
import MedicalDisclaimer from '@/shared/components/MedicalDisclaimer.vue'
import ToastNotification from '@/shared/components/ToastNotification.vue'
import { useAuthStore } from '@/shared/stores/authStore.js'

const authStore = useAuthStore()
const route = useRoute()

/**
 * Auth pages own their full-screen layout (AuthLayout with illustration panel).
 * Detect them by path prefix so AppLayout chrome is not rendered on top.
 */
const isAuthRoute = computed(() => route.path.startsWith('/auth'))

// Restore session on app mount (reads the BetterAuth cookie)
onMounted(async () => {
  await authStore.checkSession()
})
</script>

<style>
/* ─── Global CSS Reset ─── */
*,
*::before,
*::after {
  box-sizing: border-box;
}

/* ─── Base: Body / Surface ─── */
body {
  background-color: var(--md3-surface);
  color: var(--md3-on-surface);
  font-family: var(--md3-font-body);
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  margin: 0;
}

/* ─── Base: Links ─── */
a {
  color: var(--md3-primary);
  text-decoration: none;
}

/* ─── Base: Material Symbols ─── */
.material-symbols-outlined {
  font-size: 1.25rem;
  vertical-align: middle;
  user-select: none;
  /* Variable font axes — outlined style, no fill by default */
  font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
}

/* ─── Visually hidden but accessible to screen readers ─── */
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
