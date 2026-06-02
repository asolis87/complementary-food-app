<template>
  <div class="roadmap-detail-page">
    <!-- Back to Dashboard Navigation -->
    <header class="page-header">
      <RouterLink to="/dashboard" class="back-link">
        <span class="material-symbols-outlined" aria-hidden="true">arrow_back</span>
        Volver al Dashboard
      </RouterLink>
      <h1 class="page-title">
        Roadmap de
        <span class="baby-name">{{ babyName || 'tu bebé' }}</span>
      </h1>
      <p class="page-subtitle">Desglose completo de su progreso y variedad de alimentos introducidos.</p>
    </header>

    <!-- Loading State -->
    <div v-if="loading || storeLoading" class="loading-state">
      <span class="material-symbols-outlined spin-icon" aria-hidden="true">progress_activity</span>
      <p>Cargando roadmap de alimentos...</p>
    </div>

    <template v-else>
      <!-- Stats Overview Row -->
      <section class="stats-row" aria-label="Resumen de estadísticas">
        <!-- Card 1: Total progress -->
        <div class="stat-card stat-card--progress">
          <div class="stat-circle">
            <span class="stat-number">{{ stats.percentage }}%</span>
            <span class="stat-circle-label">Completado</span>
          </div>
          <div class="stat-details">
            <h3 class="stat-title">Avance Total</h3>
            <p class="stat-subtitle">
              <strong>{{ stats.tried }}</strong> de {{ stats.total }} alimentos probados
            </p>
          </div>
        </div>

        <!-- Card 2: Tried foods -->
        <div class="stat-card">
          <span class="material-symbols-outlined stat-icon stat-icon--tried" aria-hidden="true">
            check_circle
          </span>
          <div class="stat-details">
            <span class="stat-value">{{ stats.tried }}</span>
            <h3 class="stat-title">Alimentos Aceptados</h3>
            <p class="stat-subtitle">Introducidos con éxito</p>
          </div>
        </div>

        <!-- Card 3: Rejected foods -->
        <div class="stat-card">
          <span class="material-symbols-outlined stat-icon stat-icon--rejected" aria-hidden="true">
            cancel
          </span>
          <div class="stat-details">
            <span class="stat-value">{{ stats.rejected }}</span>
            <h3 class="stat-title">Alimentos Rechazados</h3>
            <p class="stat-subtitle">Requieren re-introducción</p>
          </div>
        </div>

        <!-- Card 4: Pending foods -->
        <div class="stat-card">
          <span class="material-symbols-outlined stat-icon stat-icon--pending" aria-hidden="true">
            pending_actions
          </span>
          <div class="stat-details">
            <span class="stat-value">{{ stats.pending }}</span>
            <h3 class="stat-title">Alimentos Pendientes</h3>
            <p class="stat-subtitle">Por probar próximamente</p>
          </div>
        </div>
      </section>

      <!-- Filter Controls -->
      <section class="filters-section" aria-label="Filtros de alimentos">
        <div class="filter-tabs">
          <button
            class="filter-tab"
            :class="{ 'filter-tab--active': activeFilter === 'all' }"
            @click="activeFilter = 'all'"
            aria-label="Ver todos los alimentos"
          >
            Todos
            <span class="filter-count">{{ stats.total }}</span>
          </button>
          <button
            class="filter-tab"
            :class="{ 'filter-tab--active': activeFilter === 'tried' }"
            @click="activeFilter = 'tried'"
            aria-label="Ver alimentos probados"
          >
            Probados
            <span class="filter-count filter-count--tried">{{ stats.tried }}</span>
          </button>
          <button
            class="filter-tab"
            :class="{ 'filter-tab--active': activeFilter === 'rejected' }"
            @click="activeFilter = 'rejected'"
            aria-label="Ver alimentos rechazados"
          >
            Rechazados
            <span class="filter-count filter-count--rejected">{{ stats.rejected }}</span>
          </button>
          <button
            class="filter-tab"
            :class="{ 'filter-tab--active': activeFilter === 'pending' }"
            @click="activeFilter = 'pending'"
            aria-label="Ver alimentos pendientes"
          >
            Pendientes
            <span class="filter-count filter-count--pending">{{ stats.pending }}</span>
          </button>
        </div>
      </section>

      <!-- Empty State if filter yields no matches at all -->
      <div v-if="isEmptyFilterResult" class="empty-filter-state">
        <span class="material-symbols-outlined empty-icon" aria-hidden="true">search_off</span>
        <h3>Sin coincidencias</h3>
        <p>No hay alimentos en esta lista para el filtro seleccionado.</p>
        <button class="clear-filter-btn" @click="activeFilter = 'all'">
          Mostrar Todos
        </button>
      </div>

      <!-- Roadmap Categories -->
      <div v-else class="categories-list">
        <section
          v-for="group in roadmapProgress"
          v-show="hasFoods(group)"
          :key="group.group"
          class="category-section"
          :aria-label="`Categoría ${group.labelEs}`"
        >
          <!-- Category Header -->
          <div class="category-header">
            <div class="category-title-group">
              <div class="category-icon-wrapper">
                <FoodIcon
                  :food="{ id: group.group, name: group.labelEs, group: group.group as FoodGroup, alClassification: 'NEUTRAL', alScore: 0, isAllergen: false, ageMonths: 0, needsValidation: false, createdAt: '', updatedAt: '' }"
                  :size="26"
                  weight="bold"
                />
              </div>
              <h2 class="category-name">{{ group.labelEs }}</h2>
            </div>
            
            <div class="category-progress-details">
              <span class="category-fraction">
                <strong>{{ getGroupFilteredCount(group) }}</strong>
                <span class="fraction-total">/ {{ group.totalCount }}</span>
              </span>
              <span class="category-percentage">{{ getGroupFilteredPercentage(group) }}%</span>
            </div>
          </div>

          <!-- Category Progress Bar -->
          <div
            class="category-progress-bar"
            role="progressbar"
            :aria-valuenow="getGroupFilteredPercentage(group)"
            aria-valuemin="0"
            aria-valuemax="100"
            :aria-label="`Progreso en ${group.labelEs}`"
          >
            <div
              class="progress-fill"
              :style="{ width: getGroupFilteredPercentage(group) + '%' }"
            />
          </div>

          <!-- Foods Grid -->
          <div class="foods-grid" role="list">
            <div
              v-for="food in filteredFoods(group.foods)"
              :key="food.foodId"
              class="food-card"
              :class="`food-card--${food.status}`"
              role="listitem"
            >
              <div class="food-info-left">
                <div class="food-icon-wrapper">
                  <FoodIcon
                    :food="{ id: food.foodId, name: food.name, group: group.group as FoodGroup, alClassification: 'NEUTRAL', alScore: 0, isAllergen: false, ageMonths: 0, needsValidation: false, createdAt: '', updatedAt: '' }"
                    :size="18"
                    weight="bold"
                  />
                </div>
                <span class="food-name">{{ food.name }}</span>
              </div>
              <span class="food-status-badge">
                <span class="material-symbols-outlined status-badge-icon" aria-hidden="true">
                  {{ foodStatusIcon(food.status) }}
                </span>
                <span class="status-badge-text">{{ foodStatusLabel(food.status) }}</span>
              </span>
            </div>
          </div>
        </section>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { FoodGroup, RoadmapProgress, RoadmapFood } from '@pakulab/shared'
import { useDashboardStore } from '@/shared/stores/dashboardStore.js'
import { useProfileStore } from '@/shared/stores/profileStore.js'
import FoodIcon from '@/shared/components/FoodIcon.vue'

const dashboardStore = useDashboardStore()
const profileStore = useProfileStore()

const loading = ref(false)
const activeFilter = ref<'all' | 'tried' | 'rejected' | 'pending'>('all')

const storeLoading = computed(() => dashboardStore.loading)
const babyName = computed(() => dashboardStore.dashboardData?.baby?.name || profileStore.activeProfile?.name)
const roadmapProgress = computed(() => dashboardStore.dashboardData?.roadmapProgress ?? [])

onMounted(async () => {
  if (!profileStore.activeProfile && !profilesLoadedOnce.value) {
    profilesLoadedOnce.value = true
    await profileStore.fetchProfiles()
  }

  const babyProfileId = profileStore.activeProfile?.id
  if (babyProfileId && !dashboardStore.dashboardData) {
    loading.value = true
    try {
      await dashboardStore.fetchDashboard(babyProfileId)
    } catch (err) {
      console.error('Error al cargar datos del roadmap:', err)
    } finally {
      loading.value = false
    }
  }
})

// Prevent multiple fetches of profiles on tab switching
const profilesLoadedOnce = ref(false)

// ── Statistics Calculations ──────────────────────────────────────────────
const stats = computed(() => {
  let tried = 0
  let total = 0
  let rejected = 0
  let pending = 0

  roadmapProgress.value.forEach((group) => {
    tried += group.triedCount
    total += group.totalCount
    group.foods.forEach((food) => {
      if (food.status === 'rejected') rejected++
      else if (food.status === 'pending') pending++
    })
  })

  // Recalculate pending to balance mathematical total
  pending = Math.max(0, total - tried - rejected)
  const percentage = total > 0 ? Math.round((tried / total) * 100) : 0

  return { tried, total, rejected, pending, percentage }
})

// ── Filter Helpers ────────────────────────────────────────────────────────
function filteredFoods(foods: RoadmapFood[]): RoadmapFood[] {
  if (activeFilter.value === 'all') return foods
  return foods.filter((f) => f.status === activeFilter.value)
}

function hasFoods(group: RoadmapProgress): boolean {
  return filteredFoods(group.foods).length > 0
}

const isEmptyFilterResult = computed(() => {
  if (roadmapProgress.value.length === 0) return true
  return !roadmapProgress.value.some((group) => hasFoods(group))
})

// ── Group Level Progress with Filters ──────────────────────────────────────
function getGroupFilteredCount(group: RoadmapProgress): number {
  if (activeFilter.value === 'all') return group.triedCount
  if (activeFilter.value === 'tried') return group.triedCount
  return filteredFoods(group.foods).length
}

function getGroupFilteredPercentage(group: RoadmapProgress): number {
  if (group.totalCount === 0) return 0
  
  // Show tried percentage when filtering all/tried, otherwise show filter subset ratio
  if (activeFilter.value === 'all' || activeFilter.value === 'tried') {
    return group.percentage
  }
  const filteredCount = filteredFoods(group.foods).length
  return Math.round((filteredCount / group.totalCount) * 100)
}

// ── Status Styling Helpers ────────────────────────────────────────────────
function foodStatusIcon(status: RoadmapFood['status']): string {
  switch (status) {
    case 'tried': return 'check'
    case 'rejected': return 'close'
    default: return 'hourglass_empty'
  }
}

function foodStatusLabel(status: RoadmapFood['status']): string {
  switch (status) {
    case 'tried': return 'Probado'
    case 'rejected': return 'Rechazado'
    default: return 'Pendiente'
  }
}
</script>

<style scoped>
.roadmap-detail-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--md3-space-4);
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-5);
}

/* ── Page Header ────────────────────────────────────────── */
.page-header {
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-2);
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: var(--md3-space-1);
  color: var(--md3-primary);
  text-decoration: none;
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-lg);
  font-weight: var(--md3-weight-semibold);
  transition: opacity var(--md3-transition-fast);
  margin-bottom: var(--md3-space-2);
  align-self: flex-start;
}

.back-link:hover {
  opacity: 0.8;
}

.page-title {
  margin: 0;
  font-family: var(--md3-font-headline);
  font-size: var(--md3-headline-md);
  color: var(--md3-on-surface);
}

.baby-name {
  color: var(--md3-primary);
}

.page-subtitle {
  margin: 0;
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-md);
  color: var(--md3-on-surface-variant);
}

/* ── Loading State ──────────────────────────────────────── */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--md3-space-12) 0;
  gap: var(--md3-space-3);
  font-family: var(--md3-font-body);
  color: var(--md3-on-surface-variant);
}

.spin-icon {
  font-size: 2.5rem !important;
  color: var(--md3-primary);
  animation: spin 1.2s infinite linear;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* ── Stats Row ──────────────────────────────────────────── */
.stats-row {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--md3-space-3);
}

@media (min-width: 600px) {
  .stats-row {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .stats-row {
    grid-template-columns: repeat(4, 1fr);
  }
}

.stat-card {
  background: var(--md3-surface-container-lowest);
  border: 1px solid var(--md3-outline-variant);
  border-radius: var(--md3-rounded-xl);
  padding: var(--md3-space-4);
  display: flex;
  align-items: center;
  gap: var(--md3-space-3);
  box-shadow: var(--md3-shadow-soft);
}

.stat-card--progress {
  background: var(--md3-gradient-balance-green);
  border-color: var(--md3-primary-container);
}

.stat-circle {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: var(--md3-primary-container);
  color: var(--md3-on-primary-container);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: 2px solid var(--md3-primary);
}

.stat-number {
  font-family: var(--md3-font-headline);
  font-size: var(--md3-title-md);
  font-weight: var(--md3-weight-bold);
  line-height: 1;
}

.stat-circle-label {
  font-size: 0.55rem;
  font-family: var(--md3-font-label);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-top: 1px;
}

.stat-icon {
  font-size: 2.25rem !important;
  flex-shrink: 0;
  padding: var(--md3-space-2);
  border-radius: var(--md3-rounded-lg);
}

.stat-icon--tried {
  color: var(--md3-primary);
  background: var(--md3-primary-container);
}

.stat-icon--rejected {
  color: var(--md3-error);
  background: var(--md3-error-container);
}

.stat-icon--pending {
  color: var(--md3-on-surface-variant);
  background: var(--md3-surface-container-high);
}

.stat-value {
  display: block;
  font-family: var(--md3-font-headline);
  font-size: var(--md3-headline-sm);
  font-weight: var(--md3-weight-bold);
  color: var(--md3-on-surface);
  line-height: 1.1;
}

.stat-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stat-title {
  margin: 0;
  font-family: var(--md3-font-headline);
  font-size: var(--md3-title-md);
  font-weight: var(--md3-weight-semibold);
  color: var(--md3-on-surface);
}

.stat-subtitle {
  margin: 0;
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-sm);
  color: var(--md3-on-surface-variant);
}

/* ── Filters Section ────────────────────────────────────── */
.filters-section {
  display: flex;
  justify-content: center;
  border-bottom: 1px solid var(--md3-outline-variant);
  padding-bottom: var(--md3-space-4);
  margin-top: var(--md3-space-2);
}

.filter-tabs {
  display: inline-flex;
  background: var(--md3-surface-container-low);
  padding: 4px;
  border-radius: var(--md3-rounded-lg);
  border: 1px solid var(--md3-outline-variant);
  overflow-x: auto;
  max-width: 100%;
}

.filter-tab {
  display: flex;
  align-items: center;
  gap: var(--md3-space-2);
  padding: 8px 16px;
  border: none;
  background: transparent;
  border-radius: var(--md3-rounded-md);
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-lg);
  font-weight: var(--md3-weight-semibold);
  color: var(--md3-on-surface-variant);
  cursor: pointer;
  white-space: nowrap;
  transition: all var(--md3-transition-fast);
}

.filter-tab:hover {
  background: var(--md3-surface-container-high);
}

.filter-tab--active {
  background: var(--md3-surface-container-lowest);
  color: var(--md3-primary);
  box-shadow: var(--md3-shadow-soft);
}

.filter-count {
  font-size: var(--md3-body-sm);
  padding: 2px 6px;
  background: var(--md3-surface-container-high);
  border-radius: var(--md3-rounded-full);
  color: var(--md3-on-surface-variant);
}

.filter-tab--active .filter-count {
  background: var(--md3-primary-container);
  color: var(--md3-on-primary-container);
}

.filter-tab--active .filter-count--rejected {
  background: var(--md3-error-container);
  color: var(--md3-on-error-container);
}

.filter-tab--active .filter-count--pending {
  background: var(--md3-surface-container-highest);
  color: var(--md3-on-surface-variant);
}

/* ── Categories List ────────────────────────────────────── */
.categories-list {
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-6);
}

.category-section {
  background: var(--md3-surface-container-lowest);
  border: 1px solid var(--md3-outline-variant);
  border-radius: var(--md3-rounded-xl);
  padding: var(--md3-space-4);
  box-shadow: var(--md3-shadow-soft);
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-4);
}

.category-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--md3-space-2);
}

.category-title-group {
  display: flex;
  align-items: center;
  gap: var(--md3-space-3);
}

.category-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
}

.category-name {
  margin: 0;
  font-family: var(--md3-font-headline);
  font-size: var(--md3-headline-sm);
  color: var(--md3-on-surface);
}

.category-progress-details {
  display: flex;
  align-items: center;
  gap: var(--md3-space-3);
}

.category-fraction {
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-lg);
  color: var(--md3-on-surface-variant);
}

.category-fraction strong {
  color: var(--md3-primary);
  font-size: var(--md3-title-md);
}

.fraction-total {
  opacity: 0.8;
}

.category-percentage {
  font-family: var(--md3-font-headline);
  font-size: var(--md3-title-lg);
  font-weight: var(--md3-weight-bold);
  color: var(--md3-primary);
  background: var(--md3-primary-container);
  padding: 4px 10px;
  border-radius: var(--md3-rounded-lg);
}

.category-progress-bar {
  width: 100%;
  height: 10px;
  background: var(--md3-surface-container-low);
  border-radius: var(--md3-rounded-full);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--md3-primary);
  border-radius: var(--md3-rounded-full);
  transition: width 0.4s ease;
}

/* ── Foods Grid ─────────────────────────────────────────── */
.foods-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--md3-space-2);
}

@media (min-width: 480px) {
  .foods-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 768px) {
  .foods-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (min-width: 1024px) {
  .foods-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

.food-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--md3-space-3);
  border-radius: var(--md3-rounded-lg);
  border: 1px solid var(--md3-outline-variant);
  transition: all var(--md3-transition-fast);
}

.food-info-left {
  display: flex;
  align-items: center;
  gap: var(--md3-space-2);
  min-width: 0;
}

.food-icon-wrapper {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.food-name {
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-md);
  font-weight: var(--md3-weight-medium);
  color: var(--md3-on-surface);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.food-status-badge {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 2px 6px;
  border-radius: var(--md3-rounded-sm);
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-sm);
  font-weight: var(--md3-weight-semibold);
}

.status-badge-icon {
  font-size: 0.9rem !important;
}

/* Tried Food */
.food-card--tried {
  background: var(--md3-primary-container);
  border-color: var(--md3-primary);
}

.food-card--tried .food-name {
  color: var(--md3-on-primary-container);
  font-weight: var(--md3-weight-bold);
}

.food-card--tried .food-status-badge {
  color: var(--md3-primary);
}

/* Rejected Food */
.food-card--rejected {
  background: var(--md3-error-container);
  border-color: var(--md3-error);
}

.food-card--rejected .food-name {
  color: var(--md3-on-error-container);
  font-weight: var(--md3-weight-bold);
}

.food-card--rejected .food-status-badge {
  color: var(--md3-error);
}

/* Pending Food */
.food-card--pending {
  background: var(--md3-surface-container-low);
  border-color: var(--md3-outline-variant);
  opacity: 0.85;
}

.food-card--pending .food-name {
  color: var(--md3-on-surface-variant);
}

.food-card--pending .food-status-badge {
  color: var(--md3-on-surface-variant);
  opacity: 0.7;
}

/* ── Empty Filter State ─────────────────────────────────── */
.empty-filter-state {
  text-align: center;
  padding: var(--md3-space-12) 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--md3-space-3);
  background: var(--md3-surface-container-lowest);
  border: 1px dashed var(--md3-outline-variant);
  border-radius: var(--md3-rounded-xl);
}

.empty-filter-state .empty-icon {
  font-size: 3rem !important;
  color: var(--md3-outline);
}

.empty-filter-state h3 {
  margin: 0;
  font-family: var(--md3-font-headline);
  font-size: var(--md3-title-lg);
  color: var(--md3-on-surface);
}

.empty-filter-state p {
  margin: 0;
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-md);
  color: var(--md3-on-surface-variant);
}

.clear-filter-btn {
  margin-top: var(--md3-space-2);
  padding: 8px 16px;
  background: var(--md3-primary);
  color: var(--md3-on-primary);
  border: none;
  border-radius: var(--md3-rounded-full);
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-lg);
  font-weight: var(--md3-weight-semibold);
  cursor: pointer;
  transition: opacity var(--md3-transition-fast);
}

.clear-filter-btn:hover {
  opacity: 0.9;
}
</style>
