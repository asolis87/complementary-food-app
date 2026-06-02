<template>
  <nav
    :class="[
      'flex flex-col',
      isFixed ? 'w-64 h-full bg-surface border-r border-outline-variant' : 'w-72 h-full bg-surface',
    ]"
    data-testid="sidebar-nav"
    aria-label="Navegación principal"
  >
    <!-- Brand -->
    <div class="p-6">
      <RouterLink
        to="/dashboard"
        class="flex items-center gap-2 mb-8"
        data-testid="sidebar-brand"
      >
        <span
          class="material-symbols-outlined text-primary text-[28px]"
          style="font-variation-settings: 'FILL' 1;"
          aria-hidden="true"
        >eco</span>
        <span class="font-bold text-title-md text-on-surface">Pakulab</span>
      </RouterLink>

      <!-- Nav Links -->
      <div class="flex flex-col gap-2">
        <RouterLink
          v-for="link in visibleLinks"
          :key="link.to"
          :to="link.to"
          class="flex items-center gap-3 px-4 py-3 rounded-lg font-label-md transition-colors duration-200"
          :class="[
            isActive(link.to)
              ? 'bg-primary/10 text-primary font-bold'
              : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface',
          ]"
          :data-testid="`sidebar-nav-link-${link.testid}`"
          @click="handleLinkClick"
        >
          <span class="material-symbols-outlined text-[20px]" aria-hidden="true">
            {{ link.icon }}
          </span>
          {{ link.label }}
        </RouterLink>
      </div>
    </div>

    <!-- Spacer pushes profile + logout to bottom -->
    <div class="mt-auto" />

    <!-- User Profile -->
    <div v-if="authStore.isAuthenticated" class="p-6 border-t border-outline-variant">
      <div class="flex items-center gap-3 mb-4" data-testid="sidebar-user-profile">
        <div
          class="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center text-on-primary-fixed font-bold"
          aria-hidden="true"
        >
          {{ userInitial }}
        </div>
        <div class="flex flex-col overflow-hidden">
          <span class="text-on-surface font-label-md truncate">{{ displayName }}</span>
          <span class="flex items-center gap-1 mt-0.5">
            <span
              v-if="isPro"
              class="bg-secondary-container text-on-secondary-container px-1.5 py-0 rounded-sm font-bold text-[9px]"
            >Pro</span>
            <span
              v-else-if="isTrialExpired"
              class="bg-error-container text-on-error-container px-1.5 py-0 rounded-sm font-bold text-[9px]"
            >Expirado</span>
            <span
              v-else-if="isTrialing && trialDaysLeft > 0"
              class="bg-secondary-container text-on-secondary-container px-1.5 py-0 rounded-sm font-bold text-[9px]"
            >Prueba · {{ trialDaysLeft }}d</span>
            <span class="text-[11px] text-on-surface-variant ml-1">Plan Activo</span>
          </span>
        </div>
      </div>
      <button
        class="flex items-center gap-3 px-4 py-2 text-on-surface-variant hover:text-error w-full rounded-lg font-label-md transition-colors"
        data-testid="sidebar-signout-button"
        @click="handleSignOut"
      >
        <span class="material-symbols-outlined text-[20px]" aria-hidden="true">logout</span>
        Salir
      </button>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/shared/stores/authStore.js'

interface Props {
  /** When true, renders as a fixed sidebar (desktop). When false, renders as drawer. */
  isFixed?: boolean
  /** Emitted when a nav link is clicked (for closing drawer on mobile). */
  onLinkClick?: () => void
}

const props = withDefaults(defineProps<Props>(), {
  isFixed: true,
  onLinkClick: () => {},
})

const emit = defineEmits<{
  close: []
}>()

const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()

const displayName = computed(() => authStore.displayName)
const isPro = computed(() => authStore.isPro)
const isTrialing = computed(() => authStore.isTrialing)
const isTrialExpired = computed(() => authStore.isTrialExpired)
const trialDaysLeft = computed(() => authStore.trialDaysLeft)

const userInitial = computed(() => {
  const name = displayName.value || '?'
  return name.charAt(0).toUpperCase()
})

interface NavLink {
  to: string
  label: string
  icon: string
  testid: string
  requiresAuth?: boolean
  requiresPro?: boolean
}

const allLinks: NavLink[] = [
  { to: '/dashboard', label: 'Inicio', icon: 'home', testid: 'inicio' },
  { to: '/foods', label: 'Alimentos', icon: 'restaurant', testid: 'alimentos' },
  { to: '/plates', label: 'Mis platos', icon: 'ramen_dining', testid: 'platos', requiresAuth: true },
  { to: '/menus', label: 'Menús', icon: 'menu_book', testid: 'menus', requiresAuth: true, requiresPro: true },
  { to: '/diary', label: 'Bitácora', icon: 'book', testid: 'diary', requiresAuth: true },
]

const visibleLinks = computed(() => {
  return allLinks.filter((link) => {
    if (link.requiresAuth && !authStore.isAuthenticated) return false
    if (link.requiresPro && !authStore.isPro) return false
    return true
  })
})

function isActive(to: string): boolean {
  if (to === '/dashboard') return route.path === '/dashboard'
  return route.path.startsWith(to)
}

function handleLinkClick(): void {
  emit('close')
  props.onLinkClick()
}

async function handleSignOut(): Promise<void> {
  await authStore.signOut()
  emit('close')
  await router.push({ name: 'login' })
}
</script>
