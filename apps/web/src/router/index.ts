/**
 * Vue Router configuration.
 * Design: Routing table from design.md
 * Lazy-loaded routes for performance (REQ-NFR-01).
 */

import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/shared/stores/authStore.js'

export const router = createRouter({
  history: createWebHistory(),

  routes: [
    // === Public routes ===
    {
      path: '/',
      name: 'home',
      // Landing page — anonymous-first (REQ-AUTH-01)
      component: () => import('@/modules/home/HomePage.vue'),
      meta: { requiresAuth: false },
    },
    {
      path: '/plate/new',
      name: 'plate-builder',
      component: () => import('@/modules/plates/PlateBuilderPage.vue'),
      meta: { requiresAuth: false },
    },
    {
      path: '/foods',
      name: 'foods',
      component: () => import('@/modules/foods/FoodSearchPage.vue'),
      meta: { requiresAuth: false },
    },

    // === Auth routes ===
    {
      path: '/auth/login',
      name: 'login',
      component: () => import('@/modules/auth/LoginPage.vue'),
      meta: { requiresAuth: false, guestOnly: true },
    },
    {
      path: '/auth/signup',
      name: 'signup',
      component: () => import('@/modules/auth/SignupPage.vue'),
      meta: { requiresAuth: false, guestOnly: true },
    },

    // === Free+ routes ===
    {
      path: '/plates',
      name: 'plates',
      component: () => import('@/modules/plates/PlateListPage.vue'),
      meta: { requiresAuth: true, requiredTier: 'FREE' },
    },
    {
      path: '/plates/:id',
      name: 'plate-detail',
      component: () => import('@/modules/plates/PlateDetailPage.vue'),
      meta: { requiresAuth: true, requiredTier: 'FREE' },
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('@/modules/profiles/ProfilePage.vue'),
      meta: { requiresAuth: true, requiredTier: 'FREE' },
    },
    {
      path: '/diary',
      name: 'diary',
      component: () => import('@/modules/diary/DiaryPage.vue'),
      meta: { requiresAuth: true, requiredTier: 'FREE' },
    },

    // === Pro routes ===
    {
      path: '/menus',
      name: 'menus',
      component: () => import('@/modules/menus/MenuWeekPage.vue'),
      meta: { requiresAuth: true, requiredTier: 'PRO' },
    },

    // === Pricing (public) ===
    {
      path: '/pricing',
      name: 'pricing',
      component: () => import('@/modules/billing/PricingPage.vue'),
      meta: { requiresAuth: false },
    },

    // === Billing outcome pages (public — Stripe redirects here) ===
    {
      path: '/billing/success',
      name: 'billing-success',
      component: () => import('@/modules/billing/CheckoutSuccessPage.vue'),
      meta: { requiresAuth: false },
    },
    {
      path: '/billing/cancel',
      name: 'billing-cancel',
      component: () => import('@/modules/billing/CheckoutCancelPage.vue'),
      meta: { requiresAuth: false },
    },

    // === Legal pages (T-031) ===
    {
      path: '/privacidad',
      name: 'privacy',
      component: () => import('@/modules/legal/PrivacyPage.vue'),
      meta: { requiresAuth: false },
    },
    {
      path: '/terminos',
      name: 'terms',
      component: () => import('@/modules/legal/TermsPage.vue'),
      meta: { requiresAuth: false },
    },

    // === 404 ===
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/shared/components/NotFoundPage.vue'),
    },
  ],

  scrollBehavior(_to, _from, savedPosition) {
    if (savedPosition) return savedPosition
    return { top: 0 }
  },
})

// === Navigation Guards ===
router.beforeEach(async (to) => {
  const authStore = useAuthStore()

  // Guest-only pages (login, signup) — redirect to home if already logged in
  if (to.meta.guestOnly && authStore.isAuthenticated) {
    return { name: 'home' }
  }

  // Auth-required pages
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  // Tier-gated pages — redirect to pricing if tier is insufficient
  if (to.meta.requiredTier && authStore.user) {
    const { tierAtLeast } = await import('@cfa/shared')
    if (!tierAtLeast(authStore.user.tier, to.meta.requiredTier as 'FREE' | 'PRO')) {
      return { name: 'pricing' }
    }
  }
})
