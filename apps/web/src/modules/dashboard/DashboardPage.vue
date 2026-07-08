<template>
  <div class="dashboard-page">
    <!-- Screen reader announcements (not visible) -->
    <div
      class="sr-only"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      {{ srAnnouncement }}
    </div>

    <!-- Error state — DashboardErrorBoundary handles status codes -->
    <DashboardErrorBoundary
      v-if="hasError && !loading"
      :status-code="errorStatusCode"
      :message="storeError ?? undefined"
      :show-go-home="errorStatusCode === 401 || errorStatusCode === 403"
      @retry="handleRetry"
    />

    <!-- Offline + stale data indicator -->
    <div
      v-if="!isOnline && !isEmpty && !hasError"
      class="offline-stale-banner"
      role="status"
      aria-live="polite"
    >
      <span class="material-symbols-outlined" aria-hidden="true">wifi_off</span>
      Mostrando datos guardados · Sin conexión
    </div>

    <!-- Loading state (first load, no data yet) — uses specific skeleton -->
    <DashboardSkeleton v-if="loading && isEmpty && !hasError" />

    <!-- Dashboard content -->
    <template v-if="!isEmpty || loading">
      <!-- Header -->
      <DashboardHeader
        v-if="dashboardData"
        :user-name="userName"
        :baby-name="dashboardData.baby.name"
        :baby-age-months="dashboardData.baby.ageInMonths"
        :days-in-a-c="dashboardData.baby.daysInAC"
        :user-tier="dashboardData.userTier"
      />

      <!-- Stage Transition Banner (10-23m feature) -->
      <StageTransitionBanner
        v-if="detectedTransition && !transitionDismissed"
        :transition="detectedTransition"
        @show-texture-guide="handleShowTextureGuide"
        @dismiss="handleDismissTransition"
      />

      <!-- Bento Grid -->
      <div class="bento-grid" id="main-content">
        <!-- Col 1: Today's logs + Texture Guide + Perceptive Feeding (full width on mobile, col-1 on desktop) -->
        <div class="bento-col-1">
          <TodayLogsCard
            :meal-slots="todayMealSlots"
            :loading="loading"
            @register="handleRegister"
            @edit="handleEdit"
          />

          <div ref="textureGuideCardRef">
            <TextureGuideCard
              :baby-age-months="dashboardData?.baby?.ageInMonths ?? 0"
              :loading="loading"
            />
          </div>

          <PerceptiveFeedingCard />
        </div>

        <!-- Col 2: Suggestions (stacked on mobile, col-2 on desktop) -->
        <div class="bento-col-2">
          <LazySuggestedFoodsCard
            :suggestions="dashboardData?.suggestedFoods ?? []"
            :loading="loading"
            @view-food="handleViewFood"
            @view-all="handleViewAllFoods"
          />
        </div>

        <!-- Col 3: Roadmap + Allergens (stacked on mobile/tablet, col-3 on desktop) -->
        <div class="bento-col-3">
          <LazyFoodRoadmapCard
            :progress="dashboardData?.roadmapProgress ?? []"
            :loading="loading"
            @view-full-roadmap="handleViewFullRoadmap"
          />

          <AllergenTrackerCard
            v-if="dashboardData?.baby"
            :baby-age-months="dashboardData.baby.ageInMonths"
            :tier="authStore.tier"
            :baby-profile-id="profileStore.activeProfile?.id ?? ''"
          />

          <SnackSuggestionCard
            v-if="dashboardData?.baby"
            :baby-age-months="dashboardData.baby.ageInMonths"
            :baby-profile-id="profileStore.activeProfile?.id ?? ''"
            @view-food="handleViewFood"
          />
        </div>
      </div>

      <!-- Full width: Balance Insight -->
      <BalanceInsightCard
        v-if="dashboardData"
        :insight="dashboardData.weeklyBalance"
        :loading="loading"
        @view-weekly-detail="handleViewWeeklyDetail"
      />

      <!-- Full width: Stage Tip (CRITICAL-2 REQ-D2) -->
      <StageTipCard
        v-if="dashboardData"
        :baby-age-months="dashboardData.baby.ageInMonths"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import type { MealType, AgeStage } from '@pakulab/shared'
import { getMealSlotsForAge } from '@pakulab/shared'
import { useAuthStore } from '@/shared/stores/authStore.js'
import { useProfileStore } from '@/shared/stores/profileStore.js'
import { useDashboardData, useDashboardActions } from '@/shared/composables/useDashboard.js'
import { useOnlineStatus } from '@/shared/composables/useOnlineStatus.js'
import { useStageTransition, buildLastSeenKey } from '@/shared/composables/useStageTransition.js'
import { safeSetItem } from '@/shared/utils/safeStorage.js'
import DashboardHeader from './components/DashboardHeader.vue'
import TodayLogsCard from './components/TodayLogsCard.vue'
import TextureGuideCard from './components/TextureGuideCard.vue'
import AllergenTrackerCard from './components/AllergenTrackerCard.vue'
import SnackSuggestionCard from './components/SnackSuggestionCard.vue'
import BalanceInsightCard from './components/BalanceInsightCard.vue'
import StageTipCard from './components/StageTipCard.vue'
import DashboardSkeleton from './components/DashboardSkeleton.vue'
import DashboardErrorBoundary from './components/DashboardErrorBoundary.vue'
import StageTransitionBanner from './components/StageTransitionBanner.vue'
import PerceptiveFeedingCard from './components/PerceptiveFeedingCard.vue'

// ── Lazy-loaded heavy components (improves LCP) ──────────────────────────

const LazySuggestedFoodsCard = defineAsyncComponent({
  loader: () => import('./components/SuggestedFoodsCard.vue'),
  // Show skeleton while loading the lazy component
  loadingComponent: {
    template: `<div class="dashboard-card" style="min-height: 280px;">
      <div class="skeleton-header" style="margin-bottom: var(--md3-space-4);">
        <div class="skeleton-line" style="height:14px;width:40%;background:var(--md3-surface-container);border-radius:4px;" />
      </div>
      <div style="display:flex;flex-direction:column;gap:var(--md3-space-3);">
        <div v-for="n in 3" :key="n" style="display:flex;align-items:center;gap:var(--md3-space-3);padding:var(--md3-space-3);background:var(--md3-surface-container-low);border:1px solid var(--md3-outline-variant);border-radius:var(--md3-rounded-lg);">
          <div style="width:52px;height:52px;border-radius:var(--md3-rounded-lg);background:var(--md3-surface-container);" />
          <div style="flex:1;display:flex;flex-direction:column;gap:var(--md3-space-2);">
            <div style="height:16px;width:50%;background:var(--md3-surface-container);border-radius:4px;" />
            <div style="height:14px;width:80%;background:var(--md3-surface-container);border-radius:4px;" />
          </div>
        </div>
      </div>
    </div>`,
  },
})

const LazyFoodRoadmapCard = defineAsyncComponent({
  loader: () => import('./components/FoodRoadmapCard.vue'),
  // Show skeleton while loading the lazy component
  loadingComponent: {
    template: `<div class="dashboard-card" style="min-height: 350px;">
      <div class="skeleton-header" style="margin-bottom: var(--md3-space-4);">
        <div class="skeleton-line" style="height:14px;width:40%;background:var(--md3-surface-container);border-radius:4px;" />
      </div>
      <div style="display:flex;flex-direction:column;gap:var(--md3-space-2);">
        <div v-for="n in 5" :key="n" style="display:flex;align-items:center;gap:var(--md3-space-3);padding:var(--md3-space-3);background:var(--md3-surface-container-low);border:1px solid var(--md3-outline-variant);border-radius:var(--md3-rounded-lg);">
          <div style="width:40px;height:40px;border-radius:var(--md3-rounded-md);background:var(--md3-surface-container);" />
          <div style="flex:1;display:flex;flex-direction:column;gap:var(--md3-space-1);">
            <div style="height:16px;width:30%;background:var(--md3-surface-container);border-radius:4px;" />
            <div style="height:8px;background:var(--md3-surface-container-high);border-radius:9999px;width:70%;" />
          </div>
        </div>
      </div>
    </div>`,
  },
})

// ── Stores & composables ─────────────────────────────────────────────────

const router = useRouter()
const authStore = useAuthStore()
const profileStore = useProfileStore()
const { dashboardData, loading, error: storeError, hasError, isEmpty } = useDashboardData()
const { fetchDashboard, refreshDashboard } = useDashboardActions()
const { isOnline } = useOnlineStatus()

// ── Local state ──────────────────────────────────────────────────────────

const dataLoaded = ref(false)
const stageTransitionEvaluated = ref(false)
const detectedTransition = ref<AgeStage | null>(null)
const transitionDismissed = ref(false)
const textureGuideCardRef = ref<HTMLElement | null>(null)

// ── Screen reader announcements ──────────────────────────────────────────

const srAnnouncement = ref('')

function announce(message: string): void {
  srAnnouncement.value = message
}

// Watch loading state for screen reader
watch(
  () => loading.value,
  (isLoading) => {
    if (isLoading) {
      announce('Cargando dashboard...')
    }
  },
)

// Watch error state for screen reader
watch(
  () => hasError.value,
  (hasErr) => {
    if (hasErr) {
      announce(`Error al cargar el dashboard. ${storeError.value ?? ''}`)
    }
  },
)

// Watch for route changes - refresh data when returning from diary
watch(
  () => router.currentRoute.value.name,
  (newRoute, oldRoute) => {
    // If returning from diary, refresh dashboard data
    if (oldRoute === 'diary' && newRoute === 'dashboard') {
      const babyProfileId = profileStore.activeProfile?.id
      if (babyProfileId) {
        void refreshDashboard(babyProfileId)
      }
    }
  },
)

// ── Computed ─────────────────────────────────────────────────────────────

const userName = computed(() => authStore.displayName)

/** Derive HTTP status code from error message pattern */
const errorStatusCode = computed(() => {
  const err = storeError.value
  if (!err) return 0

  if (err.includes('401') || err.includes('Unauthorized') || err.includes('no autorizado')) return 401
  if (err.includes('403') || err.includes('Forbidden') || err.includes('permiso')) return 403
  if (err.includes('404') || err.includes('not found') || err.includes('encontrado')) return 404
  if (err.includes('500') || err.includes('Internal') || err.includes('servidor')) return 500

  return 0
})

const todayMealSlots = computed(() => {
  // Age-aware meal slots (10-23m feature): single source of truth via getMealSlotsForAge.
  // Returns 3 slots for <10m, 4 for 10-12m, 5 for ≥13m.
  const ageMonths = dashboardData.value?.baby?.ageInMonths ?? 0
  const logs = dashboardData.value?.todayLogs ?? []

  return getMealSlotsForAge(ageMonths).map((def) => {
    // Find logs for this meal type
    const mealLogs = logs.filter(log => log.mealType === def.mealType)
    const isRegistered = mealLogs.length > 0

    return {
      mealType: def.mealType,
      label: def.label,
      icon: def.icon,
      isRegistered,
      registeredTime: isRegistered ? mealLogs[0]?.time : null,
      foodCount: mealLogs.length,
    }
  })
})

// ── Stage Transition Detection (10-23m feature) ─────────────────────────
// Dismiss handler (closure to access dismiss function from composable).
// Declared BEFORE the watcher because `{ immediate: true }` runs the callback
// synchronously during setup, and the callback may assign this variable.
let dismissHandler: (() => void) | null = null

// FIX: lastSeen writer — persist age AFTER evaluation, so crossing can be detected
watch(
  () => ({
    age: dashboardData.value?.baby?.ageInMonths,
    babyId: dashboardData.value?.baby?.id,
  }),
  ({ age: currentAge, babyId }) => {
    if (stageTransitionEvaluated.value) return // Only evaluate once
    if (!currentAge || currentAge <= 0) return // Wait for real age
    if (!babyId) return // Wait for baby ID

    // Evaluate transition (reads OLD lastSeen from localStorage, per-baby)
    const { transition, dismissed, dismiss } = useStageTransition(currentAge, babyId)
    detectedTransition.value = transition.value ?? null
    transitionDismissed.value = dismissed.value ?? false

    // CRITICAL: Write current age AFTER reading transition (order matters)
    const lastSeenKey = buildLastSeenKey(babyId)
    safeSetItem(localStorage, lastSeenKey, String(currentAge))

    stageTransitionEvaluated.value = true

    // Store dismiss function for event handler
    if (detectedTransition.value) {
      dismissHandler = () => {
        dismiss(detectedTransition.value!)
        transitionDismissed.value = true
      }
    }
  },
  { immediate: true }
)

// ── Real-time refresh: polling + visibility/focus handlers ────────────────

const POLL_INTERVAL_MS = 30_000 // 30 seconds
let pollTimer: ReturnType<typeof setInterval> | null = null

/** Refresh dashboard if tab is visible and we have an active profile */
function refreshIfVisible(): void {
  if (document.visibilityState !== 'visible') return
  const babyProfileId = profileStore.activeProfile?.id
  if (babyProfileId) {
    void refreshDashboard(babyProfileId)
  }
}

/** Start polling — called on mount and when tab becomes visible */
function startPolling(): void {
  if (pollTimer !== null) return // already running
  pollTimer = setInterval(refreshIfVisible, POLL_INTERVAL_MS)
}

/** Stop polling — called when tab is hidden or component unmounts */
function stopPolling(): void {
  if (pollTimer !== null) {
    clearInterval(pollTimer)
    pollTimer = null
  }
}

function handleVisibilityChange(): void {
  if (document.visibilityState === 'visible') {
    // Tab became visible — refresh immediately + restart polling
    refreshIfVisible()
    startPolling()
  } else {
    // Tab hidden — stop polling to save resources
    stopPolling()
  }
}

function handleWindowFocus(): void {
  refreshIfVisible()
}

// ── Lifecycle ───────────────────────────────────────────────────────────

onMounted(async () => {
  // Announce loading
  announce('Cargando dashboard...')

  // Ensure profiles are loaded
  if (!profileStore.activeProfile && authStore.isAuthenticated) {
    await profileStore.fetchProfiles()
  }

  const babyProfileId = profileStore.activeProfile?.id
  if (babyProfileId) {
    try {
      // Always re-fetch on mount. SWR shows the cached data instantly while
      // the network call repopulates in the background, so any mutation that
      // forgot to invalidate() still gets reflected on return.
      await fetchDashboard(babyProfileId)

      dataLoaded.value = true
      announce('Dashboard cargado correctamente.')
    } catch {
      announce('Error al cargar el dashboard.')
    }
  } else {
    announce('Selecciona un perfil de bebé para ver el dashboard.')
  }

  // Start real-time refresh listeners
  document.addEventListener('visibilitychange', handleVisibilityChange)
  window.addEventListener('focus', handleWindowFocus)
  startPolling()
})

onUnmounted(() => {
  stopPolling()
  document.removeEventListener('visibilitychange', handleVisibilityChange)
  window.removeEventListener('focus', handleWindowFocus)
})

// ── Event handlers ───────────────────────────────────────────────────────

function handleRetry(): void {
  const babyProfileId = profileStore.activeProfile?.id
  if (babyProfileId) {
    void refreshDashboard(babyProfileId)
  }
}

function handleRegister(mealType: MealType): void {
  // Navigate to diary with pre-selected meal type
  void router.push({ name: 'diary', query: { mealType: mealType as string } })
}

function handleEdit(mealType: MealType): void {
  // Navigate to diary for editing
  void router.push({ name: 'diary', query: { mealType: mealType as string } })
}

function handleViewFood(foodId: string): void {
  void router.push({ name: 'foods', query: { foodId } })
}

function handleViewAllFoods(): void {
  void router.push({ name: 'foods' })
}

function handleViewAllergenGuide(allergenKey: string): void {
  void router.push({ name: 'foods', query: { allergen: allergenKey } })
}

function handleViewFullRoadmap(): void {
  void router.push({ name: 'roadmap-detail' })
}

function handleViewWeeklyDetail(): void {
  void router.push({ name: 'diary' })
}

function handleShowTextureGuide(): void {
  // Scroll to TextureGuideCard
  if (textureGuideCardRef.value) {
    textureGuideCardRef.value.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

function handleDismissTransition(): void {
  if (dismissHandler) {
    dismissHandler()
  }
}
</script>

<style scoped>
/* ═══════════════════════════════════════════════════════════════════════
   DashboardPage — Nurture & Growth redesign
   Bento Grid orchestrator with responsive layout.
   Mobile: 1-col stack, Tablet: 2-col, Desktop: 3-col Bento Grid.
   ═══════════════════════════════════════════════════════════════════════ */

.dashboard-page {
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-5);
  max-width: 1440px;
  margin: 0 auto;
  width: 100%;
  padding: 0 var(--md3-space-4);
  box-sizing: border-box;
  overflow-x: hidden;
}

/* ─── Screen reader only ────────────────────────────────────── */
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

/* ─── Offline stale data banner ────────────────────────────── */
.offline-stale-banner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--md3-space-2);
  background: var(--md3-tertiary-container);
  color: var(--md3-on-tertiary-container);
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-md);
  font-weight: var(--md3-weight-medium);
  padding: var(--md3-space-3) var(--md3-space-4);
  border-radius: var(--md3-rounded-lg);
  text-align: center;
}

/* ─── Bento Grid ───────────────────────────────────────────── */
.bento-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--md3-space-5);
  min-width: 0;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

/* Stack child components with gap on all breakpoints. */
.bento-col-1,
.bento-col-2,
.bento-col-3 {
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-4);
  min-width: 0;
}

/* Mobile: Explicit 1-column layout */
@media (max-width: 767px) {
  .bento-grid {
    grid-template-columns: 1fr;
    width: 100%;
    max-width: 100%;
  }
  
  .bento-col-1,
  .bento-col-2,
  .bento-col-3 {
    grid-column: auto;
    width: 100% !important;
    max-width: 100% !important;
    min-width: 0 !important;
    box-sizing: border-box;
  }
  
  .bento-col-2 {
    gap: var(--md3-space-4);
  }
}

/* Desktop: 3-column Bento Grid */
@media (min-width: 1024px) {
  .bento-grid {
    grid-template-columns: 1.25fr 1.25fr 0.9fr;
    gap: var(--md3-space-4);
  }

  .bento-col-1 { grid-column: 1; }
  .bento-col-2 { grid-column: 2; }
  .bento-col-3 { grid-column: 3; }
}

/* Tablet: 2-column grid */
@media (min-width: 768px) and (max-width: 1023px) {
  .bento-grid {
    grid-template-columns: 1fr 1fr;
    gap: var(--md3-space-5);
  }

  .bento-col-1 { grid-column: 1; }
  .bento-col-2 { grid-column: 2; }
  .bento-col-3 { grid-column: 1 / -1; }
}

/* ─── Card base — shared by all dashboard cards ───────────── */
:deep(.dashboard-card) {
  background: var(--md3-surface-container-lowest);
  border-radius: var(--md3-rounded-xl);
  padding: var(--md3-space-5);
  box-shadow: var(--md3-shadow-ambient);
  border: 1px solid var(--md3-outline-variant);
  transition: box-shadow var(--md3-transition-fast);
  min-width: 0;
  max-width: 100%;
  box-sizing: border-box;
  width: 100%;
}

/* Mobile: Force cards to fit within viewport */
@media (max-width: 767px) {
  :deep(.dashboard-card),
  :deep(.bento-col-1),
  :deep(.bento-col-2),
  :deep(.bento-col-3) {
    width: 100% !important;
    max-width: 100% !important;
  }
}

:deep(.dashboard-card:hover) {
  box-shadow: var(--md3-shadow-card);
}

/* ─── Responsive spacing ──────────────────────────────────── */
@media (max-width: 767px) {
  .dashboard-page {
    gap: var(--md3-space-4);
  }

  .bento-grid {
    gap: var(--md3-space-4);
  }

  :deep(.dashboard-card) {
    padding: var(--md3-space-4);
  }
}
</style>
