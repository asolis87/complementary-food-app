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
    {
      path: '/auth/verify-email',
      name: 'verify-email',
      component: () => import('@/modules/auth/VerifyEmailPage.vue'),
      meta: { requiresAuth: false },
    },
    {
      path: '/auth/forgot-password',
      name: 'forgot-password',
      component: () => import('@/modules/auth/ForgotPasswordPage.vue'),
      meta: { requiresAuth: false, guestOnly: true },
    },
    {
      path: '/auth/reset-password',
      name: 'reset-password',
      component: () => import('@/modules/auth/ResetPasswordPage.vue'),
      meta: { requiresAuth: false },
    },

    // === Authenticated routes (FREE tier removed — all users are PRO during trial) ===
    {
      path: '/plates',
      name: 'plates',
      component: () => import('@/modules/plates/PlateListPage.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/plates/:id',
      name: 'plate-detail',
      component: () => import('@/modules/plates/PlateDetailPage.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('@/modules/profiles/ProfilePage.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/diary',
      name: 'diary',
      component: () => import('@/modules/diary/DiaryPage.vue'),
      meta: { requiresAuth: true },
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

    // === Paywall (authenticated, locked out users) ===
    {
      path: '/paywall',
      name: 'paywall',
      component: () => import('@/modules/billing/PaywallPage.vue'),
      meta: { requiresAuth: true },
    },

    // === Onboarding (authenticated) ===
    {
      path: '/onboarding/plan',
      name: 'onboarding-plan',
      component: () => import('@/modules/billing/PlanSelectionPage.vue'),
      meta: { requiresAuth: true },
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
let sessionChecked = false

router.beforeEach(async (to) => {
  const authStore = useAuthStore()

  // 0. Restore session from cookie on first navigation (app load / refresh)
  if (!sessionChecked) {
    sessionChecked = true
    await authStore.checkSession()
  }

  // 1. Guest-only pages (login, signup) — redirect to home if already logged in
  if (to.meta.guestOnly && authStore.isAuthenticated) {
    return { name: 'home' }
  }

  // 2. Auth-required pages — redirect to login if not authenticated
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  // 3. Trial lockout — redirect to paywall if expired trial and no active subscription
  // Allowed routes when locked out: paywall, pricing, auth, home, onboarding, legal
  if (authStore.isAuthenticated && authStore.isLockedOut) {
    const allowedRoutes = ['paywall', 'pricing', 'login', 'signup', 'home', 'privacy', 'terms']
    const isOnboarding = to.path.startsWith('/onboarding')
    
    if (!allowedRoutes.includes(to.name as string) && !isOnboarding) {
      return { name: 'paywall' }
    }
  }

  // 4. Tier-gated pages — redirect to pricing if tier is insufficient
  // (Note: During trial, users are PRO, so PRO routes are accessible)
  if (to.meta.requiredTier && authStore.user) {
    const { tierAtLeast } = await import('@pakulab/shared')
    if (!tierAtLeast(authStore.user.tier, to.meta.requiredTier as 'FREE' | 'PRO')) {
      return { name: 'pricing' }
    }
  }
})
