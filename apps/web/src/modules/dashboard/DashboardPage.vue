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
      :message="storeError"
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

      <!-- Bento Grid -->
      <div class="bento-grid" id="main-content">
        <!-- Col 1: Today's logs (full width on mobile, col-1 on desktop) -->
        <TodayLogsCard
          class="bento-col-1"
          :meal-slots="todayMealSlots"
          :loading="loading"
          @register="handleRegister"
          @edit="handleEdit"
        />

        <!-- Col 2: Suggestions + Allergens (stacked on mobile, col-2 on desktop) -->
        <div class="bento-col-2">
          <LazySuggestedFoodsCard
            :suggestions="dashboardData?.suggestedFoods ?? []"
            :loading="loading"
            @view-food="handleViewFood"
            @view-all="handleViewAllFoods"
          />

          <AllergenAlertsCard
            :allergens="dashboardData?.pendingAllergens ?? []"
            :loading="loading"
            @view-guide="handleViewAllergenGuide"
          />
        </div>

        <!-- Col 3: Roadmap (full width on mobile/tablet, col-3 on desktop) -->
        <LazyFoodRoadmapCard
          class="bento-col-3"
          :progress="dashboardData?.roadmapProgress ?? []"
          :loading="loading"
          @view-full-roadmap="handleViewFullRoadmap"
        />
      </div>

      <!-- Full width: Balance Insight -->
      <BalanceInsightCard
        v-if="dashboardData"
        :insight="dashboardData.weeklyBalance"
        :loading="loading"
        @view-weekly-detail="handleViewWeeklyDetail"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import type { MealType } from '@pakulab/shared'
import { useAuthStore } from '@/shared/stores/authStore.js'
import { useProfileStore } from '@/shared/stores/profileStore.js'
import { useDashboardData, useDashboardActions } from '@/shared/composables/useDashboard.js'
import { useOnlineStatus } from '@/shared/composables/useOnlineStatus.js'
import DashboardHeader from './components/DashboardHeader.vue'
import TodayLogsCard from './components/TodayLogsCard.vue'
import AllergenAlertsCard from './components/AllergenAlertsCard.vue'
import BalanceInsightCard from './components/BalanceInsightCard.vue'
import DashboardSkeleton from './components/DashboardSkeleton.vue'
import DashboardErrorBoundary from './components/DashboardErrorBoundary.vue'

// ── Lazy-loaded heavy components (improves LCP) ──────────────────────────

const LazySuggestedFoodsCard = defineAsyncComponent({
  loader: () => import('./components/SuggestedFoodsCard.vue'),
  // Show skeleton while loading the lazy component
  loadingComponent: {
    template: `<div class="dashboard-card" style="min-height: 220px;">
      <div class="skeleton-line skeleton-line-short" style="height:14px;width:40%;background:var(--md3-surface-container);border-radius:4px;margin-bottom:12px;" />
      <div style="display:flex;flex-direction:column;gap:10px;">
        <div v-for="n in 3" :key="n" style="display:flex;align-items:center;gap:10px;padding:8px 12px;background:var(--md3-surface-container);border-radius:8px;">
          <div style="width:28px;height:28px;border-radius:50%;background:var(--md3-surface-container-high);" />
          <div style="height:14px;width:65%;background:var(--md3-surface-container-high);border-radius:4px;" />
        </div>
      </div>
    </div>`,
  },
})

const LazyFoodRoadmapCard = defineAsyncComponent({
  loader: () => import('./components/FoodRoadmapCard.vue'),
  // Show skeleton while loading the lazy component
  loadingComponent: {
    template: `<div class="dashboard-card" style="min-height: 300px;">
      <div class="skeleton-line skeleton-line-short" style="height:14px;width:40%;background:var(--md3-surface-container);border-radius:4px;margin-bottom:12px;" />
      <div style="display:flex;flex-direction:column;gap:10px;">
        <div v-for="n in 5" :key="n" style="display:flex;align-items:center;gap:10px;padding:8px 12px;background:var(--md3-surface-container);border-radius:8px;">
          <div style="width:28px;height:28px;border-radius:50%;background:var(--md3-surface-container-high);" />
          <div style="flex:1;height:14px;background:var(--md3-surface-container-high);border-radius:4px;" />
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
  // For now, meal slots are part of the consolidated response.
  // The spec defines them in the TodayLog response, but we also get todayLogs directly.
  // We extract slots from the consolidated data's todayLogs.
  // Return empty array until we have the separate today endpoint data.
  return []
})

// ── Lifecycle ────────────────────────────────────────────────────────────

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
      await fetchDashboard(babyProfileId)
      dataLoaded.value = true
      announce('Dashboard cargado correctamente.')
    } catch {
      announce('Error al cargar el dashboard.')
    }
  } else {
    announce('Selecciona un perfil de bebé para ver el dashboard.')
  }
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
  void router.push({ name: 'foods' })
}

function handleViewWeeklyDetail(): void {
  void router.push({ name: 'diary' })
}
</script>

<style scoped>
/* ═══════════════════════════════════════════════════════════════════════
   DashboardPage — Bento Grid orchestrator with responsive layout.
   Mobile: 1-col stack, Tablet: 2-col, Desktop: 3-col Bento Grid.
   ═══════════════════════════════════════════════════════════════════════ */

.dashboard-page {
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-4);
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
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
  font-size: var(--md3-body-sm);
  font-weight: var(--md3-weight-medium);
  padding: var(--md3-space-2);
  border-radius: var(--md3-rounded-md);
  text-align: center;
}

/* ─── Bento Grid ───────────────────────────────────────────── */
.bento-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--md3-space-3);
}

/* Desktop: 3-column Bento Grid */
@media (min-width: 1024px) {
  .bento-grid {
    grid-template-columns: 1fr 1fr 1fr;
    gap: var(--md3-space-4);
  }

  .bento-col-1 {
    grid-column: 1;
  }

  .bento-col-2 {
    grid-column: 2;
    display: flex;
    flex-direction: column;
    gap: var(--md3-space-4);
  }

  .bento-col-3 {
    grid-column: 3;
  }
}

/* Tablet: 2-column grid */
@media (min-width: 768px) and (max-width: 1023px) {
  .bento-grid {
    grid-template-columns: 1fr 1fr;
    gap: var(--md3-space-4);
  }

  .bento-col-1 {
    grid-column: 1;
  }

  .bento-col-2 {
    grid-column: 2;
    display: flex;
    flex-direction: column;
    gap: var(--md3-space-4);
  }

  .bento-col-3 {
    grid-column: 1 / -1;
  }
}

/* ─── Card base — shared by all dashboard cards ───────────── */
:deep(.dashboard-card) {
  background: var(--md3-surface-container-lowest);
  border-radius: var(--md3-rounded-lg);
  padding: var(--md3-space-4);
  box-shadow: var(--md3-shadow-ambient);
  border: 1px solid var(--md3-outline-variant);
  transition: box-shadow var(--md3-transition-fast);
}

:deep(.dashboard-card:hover) {
  box-shadow: var(--md3-shadow-card);
}

/* ─── Responsive spacing ──────────────────────────────────── */
@media (max-width: 767px) {
  .dashboard-page {
    gap: var(--md3-space-3);
    padding: 0;
  }

  .bento-grid {
    gap: var(--md3-space-3);
  }

  :deep(.dashboard-card) {
    padding: var(--md3-space-3);
  }
}
</style>
