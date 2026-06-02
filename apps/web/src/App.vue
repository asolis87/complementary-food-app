<template>
  <!-- Auth pages render their own layout (AuthLayout) — no AppLayout chrome needed -->
  <template v-if="isAuthRoute">
    <RouterView />
  </template>

  <!-- Authenticated routes get the sidebar layout (dashboard redesign) -->
  <SidebarLayout v-else-if="isAuthenticatedRoute">
    <RouterView />
  </SidebarLayout>

  <!-- All other pages get the full app shell: header, bottom nav, footer -->
  <AppLayout v-else>
    <RouterView />
  </AppLayout>

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
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppLayout from '@/shared/layouts/AppLayout.vue'
import SidebarLayout from '@/shared/layouts/SidebarLayout.vue'
import ToastNotification from '@/shared/components/ToastNotification.vue'

const route = useRoute()

/**
 * Auth pages own their full-screen layout (AuthLayout with illustration panel).
 * Detect them by path prefix so AppLayout chrome is not rendered on top.
 */
const isAuthRoute = computed(() => route.path.startsWith('/auth'))

/**
 * Authenticated routes use the sidebar layout (dashboard redesign).
 * Detected by meta.requiresAuth = true on the route.
 */
const isAuthenticatedRoute = computed(() =>
  route.matched.some((record) => record.meta.requiresAuth === true),
)

// Session restoration is handled by the router beforeEach guard
// (runs before any navigation, including initial app load)
</script>

<style>
/* ─── Global CSS Reset ─── */
*,
*::before,
*::after {
  box-sizing: border-box;
}

/* ─── Base: HTML ─── */
html {
  overflow-x: clip;
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
