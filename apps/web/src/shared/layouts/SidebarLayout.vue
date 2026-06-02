<template>
  <div class="min-h-screen bg-background text-on-background font-sans flex">
    <!-- Desktop Sidebar (hidden on mobile) -->
    <aside class="hidden md:flex md:fixed md:inset-y-0 md:left-0 md:z-40">
      <SidebarNav :is-fixed="true" />
    </aside>

    <!-- Mobile Drawer -->
    <Transition name="fade">
      <div
        v-if="isDrawerOpen"
        class="md:hidden fixed inset-0 bg-black/50 z-40"
        data-testid="sidebar-drawer-backdrop"
        @click="closeDrawer"
      />
    </Transition>
    <Transition name="slide">
      <aside
        v-if="isDrawerOpen"
        class="md:hidden fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-surface shadow-2xl"
        data-testid="sidebar-drawer"
      >
        <SidebarNav :is-fixed="false" :on-link-click="closeDrawer" @close="closeDrawer" />
      </aside>
    </Transition>

    <!-- Main wrapper — offset by sidebar width on desktop -->
    <div class="flex-grow md:ml-64 flex flex-col min-h-screen w-full">
      <!-- Mobile Header -->
      <header
        class="md:hidden bg-surface border-b border-outline-variant w-full sticky top-0 z-30 flex justify-between items-center px-margin-mobile py-4"
      >
        <RouterLink to="/dashboard" class="flex items-center gap-2">
          <span
            class="material-symbols-outlined text-primary text-[24px]"
            style="font-variation-settings: 'FILL' 1;"
            aria-hidden="true"
          >eco</span>
          <span class="font-bold text-title-md text-on-surface">Pakulab</span>
        </RouterLink>
        <button
          class="material-symbols-outlined text-on-surface p-1"
          aria-label="Abrir menú de navegación"
          data-testid="sidebar-toggle"
          @click="openDrawer"
        >
          menu
        </button>
      </header>

      <!-- Main Content -->
      <main
        id="main-content"
        class="flex-grow w-full px-margin-mobile md:px-margin-desktop py-stack-lg max-w-container-max mx-auto flex flex-col gap-stack-lg"
      >
        <slot />
      </main>

      <!-- Footer -->
      <footer class="bg-surface border-t border-outline-variant w-full mt-auto py-6">
        <div
          class="w-full px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto flex flex-col md:flex-row justify-between items-center gap-4"
        >
          <div class="text-caption text-on-surface-variant flex items-center gap-2">
            <span class="material-symbols-outlined text-[16px]" aria-hidden="true">eco</span>
            © 2026 Pakulab. Alimentación Complementaria Segura.
          </div>
          <nav class="flex gap-6" aria-label="Links legales">
            <RouterLink
              to="/privacidad"
              class="text-caption text-on-surface-variant hover:text-primary transition-colors"
            >Centro de ayuda</RouterLink>
            <RouterLink
              to="/privacidad"
              class="text-caption text-on-surface-variant hover:text-primary transition-colors"
            >Privacidad</RouterLink>
            <RouterLink
              to="/terminos"
              class="text-caption text-on-surface-variant hover:text-primary transition-colors"
            >Términos</RouterLink>
          </nav>
        </div>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import SidebarNav from '@/shared/components/SidebarNav.vue'

const route = useRoute()
const isDrawerOpen = ref(false)

function openDrawer(): void {
  isDrawerOpen.value = true
}

function closeDrawer(): void {
  isDrawerOpen.value = false
}

// Close drawer on route change (mobile)
watch(
  () => route.path,
  () => {
    closeDrawer()
  },
)
</script>

<style scoped>
/* Drawer slide animation */
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.25s ease;
}

.slide-enter-from,
.slide-leave-to {
  transform: translateX(-100%);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
