<template>
  <div class="dashboard-page">
    <!-- Error state -->
    <ErrorBoundary v-if="hasError && !loading">
      <div class="error-view">
        <div class="error-card">
          <span class="material-symbols-outlined error-icon" aria-hidden="true">error_outline</span>
          <h2 class="error-title">No se pudo cargar el dashboard</h2>
          <p class="error-message">{{ storeError }}</p>
          <button class="retry-btn" @click="handleRetry">
            <span class="material-symbols-outlined" aria-hidden="true">refresh</span>
            Reintentar
          </button>
        </div>
      </div>
    </ErrorBoundary>

    <!-- Offline + stale data indicator -->
    <div v-if="!isOnline && !isEmpty" class="offline-stale-banner" role="status" aria-live="polite">
      <span class="material-symbols-outlined" aria-hidden="true">wifi_off</span>
      Mostrando datos guardados · Sin conexión
    </div>

    <!-- Loading state (first load, no data yet) -->
    <template v-if="loading && isEmpty">
      <div class="dashboard-skeleton">
        <!-- Header skeleton -->
        <div class="skeleton-header">
          <div class="skeleton-line skeleton-line-short" />
          <div class="skeleton-line skeleton-line-medium" />
        </div>

        <!-- Grid skeleton -->
        <div class="skeleton-grid">
          <div v-for="n in 5" :key="n" class="skeleton-card-item">
            <div class="skeleton-line skeleton-line-short" />
            <div class="skeleton-line skeleton-line-medium" />
            <div class="skeleton-line skeleton-line-long" />
          </div>
        </div>
      </div>
    </template>

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
      <div class="bento-grid">
        <!-- Col 1: Today's logs -->
        <TodayLogsCard
          class="bento-col-1"
          :meal-slots="todayMealSlots"
          :loading="loading"
          @register="handleRegister"
          @edit="handleEdit"
        />

        <!-- Col 2: Suggestions + Allergens -->
        <div class="bento-col-2">
          <SuggestedFoodsCard
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

        <!-- Col 3: Roadmap -->
        <FoodRoadmapCard
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
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import type { MealType } from '@pakulab/shared'
import { useAuthStore } from '@/shared/stores/authStore.js'
import { useProfileStore } from '@/shared/stores/profileStore.js'
import { useDashboardData, useDashboardActions } from '@/shared/composables/useDashboard.js'
import { useOnlineStatus } from '@/shared/composables/useOnlineStatus.js'
import DashboardHeader from './components/DashboardHeader.vue'
import TodayLogsCard from './components/TodayLogsCard.vue'
import SuggestedFoodsCard from './components/SuggestedFoodsCard.vue'
import AllergenAlertsCard from './components/AllergenAlertsCard.vue'
import FoodRoadmapCard from './components/FoodRoadmapCard.vue'
import BalanceInsightCard from './components/BalanceInsightCard.vue'

const router = useRouter()
const authStore = useAuthStore()
const profileStore = useProfileStore()
const { dashboardData, loading, error: storeError, hasError, isEmpty } = useDashboardData()
const { fetchDashboard, refreshDashboard } = useDashboardActions()
const { isOnline } = useOnlineStatus()

// ── Local state ──────────────────────────────────────────────────────────────
const dataLoaded = ref(false)

// ── Computed ─────────────────────────────────────────────────────────────────

const userName = computed(() => authStore.displayName)

const todayMealSlots = computed(() => {
  // For now, meal slots are part of the consolidated response.
  // The spec defines them in the TodayLog response, but we also get todayLogs directly.
  // We extract slots from the consolidated data's todayLogs.
  // Return empty array until we have the separate today endpoint data.
  return []
})

// ── Lifecycle ────────────────────────────────────────────────────────────────

onMounted(async () => {
  // Ensure profiles are loaded
  if (!profileStore.activeProfile && authStore.isAuthenticated) {
    await profileStore.fetchProfiles()
  }

  const babyProfileId = profileStore.activeProfile?.id
  if (babyProfileId) {
    await fetchDashboard(babyProfileId)
    dataLoaded.value = true
  }
})

// ── Event handlers ───────────────────────────────────────────────────────────

function handleRetry(): void {
  const babyProfileId = profileStore.activeProfile?.id
  if (babyProfileId) {
    void refreshDashboard(babyProfileId)
  }
}

function handleRegister(mealType: MealType): void {
  // Navigate to diary with pre-selected meal type
  // This opens the existing QuickLogModal / AddMealModal pattern
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
  // Open a modal or navigate to a guide page
  // For now, navigate to the foods page filtered by allergen
  void router.push({ name: 'foods', query: { allergen: allergenKey } })
}

function handleViewFullRoadmap(): void {
  void router.push({ name: 'foods' })
}

function handleViewWeeklyDetail(): void {
  // Navigate to diary for weekly detail view
  void router.push({ name: 'diary' })
}
</script>

<style scoped>
.dashboard-page {
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-4);
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

/* ─── Error view ───────────────────────────────────────────── */
.error-view {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--md3-space-12) var(--md3-space-3);
  min-height: 200px;
}

.error-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--md3-space-3);
  text-align: center;
  background: var(--md3-surface-container-lowest);
  border-radius: var(--md3-rounded-lg);
  padding: var(--md3-space-8) var(--md3-space-6);
  max-width: 380px;
  width: 100%;
  box-shadow: var(--md3-shadow-ambient);
}

.error-icon {
  font-size: 3.5rem;
  color: var(--md3-error);
  font-variation-settings: 'FILL' 0, 'wght' 300;
}

.error-title {
  margin: 0;
  font-family: var(--md3-font-headline);
  font-size: var(--md3-headline-sm);
  font-weight: var(--md3-weight-semibold);
  color: var(--md3-on-surface);
}

.error-message {
  margin: 0;
  color: var(--md3-on-surface-variant);
}

.retry-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--md3-space-2);
  padding: 0.75rem 1.75rem;
  background: var(--md3-gradient-cta);
  color: var(--md3-on-primary);
  border: none;
  border-radius: var(--md3-rounded-full);
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-lg);
  font-weight: var(--md3-weight-semibold);
  cursor: pointer;
  transition: background var(--md3-transition-fast);
  margin-top: var(--md3-space-1);
}

.retry-btn:hover {
  background: var(--md3-gradient-cta-hover);
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
  gap: var(--md3-space-4);
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

/* ─── Dashboard skeleton (first load) ─────────────────────── */
.dashboard-skeleton {
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-4);
}

.skeleton-header {
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-2);
  padding: var(--md3-space-3) 0;
}

.skeleton-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--md3-space-3);
}

@media (min-width: 768px) {
  .skeleton-grid {
    grid-template-columns: 1fr 1fr;
  }
}

@media (min-width: 1024px) {
  .skeleton-grid {
    grid-template-columns: 1fr 1fr 1fr;
  }
}

.skeleton-card-item {
  background: var(--md3-surface-container-low);
  border-radius: var(--md3-rounded-lg);
  padding: var(--md3-space-4);
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-2);
}

.skeleton-line {
  height: 14px;
  border-radius: var(--md3-rounded-sm);
  background: linear-gradient(
    90deg,
    var(--md3-surface-container) 25%,
    var(--md3-surface-container-high) 50%,
    var(--md3-surface-container) 75%
  );
  background-size: 800px 100%;
  animation: shimmer 1.4s infinite linear;
}

.skeleton-line-short { width: 40%; }
.skeleton-line-medium { width: 65%; }
.skeleton-line-long { width: 90%; }

@keyframes shimmer {
  0% { background-position: -400px 0; }
  100% { background-position: 400px 0; }
}

/* ─── Responsive spacing ──────────────────────────────────── */
@media (max-width: 767px) {
  .dashboard-page {
    gap: var(--md3-space-3);
  }
}
</style>
