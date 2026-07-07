<template>
  <div class="plate-list-page">
    <!-- Header Desktop -->
    <header class="page-header">
      <div class="header-text">
        <p class="header-subtitle">Registro de alimentación</p>
        <h1 class="header-title">Mis Platos</h1>
      </div>
      <RouterLink
        to="/plate/new"
        class="create-btn-desktop"
        :class="{ disabled: atLimit }"
        :aria-disabled="atLimit"
        :title="atLimit ? 'Límite de platos alcanzado. Actualiza a Pro.' : 'Crear nuevo plato'"
      >
        <span class="material-symbols-outlined" aria-hidden="true">add</span>
        <span class="btn-text">Crear Nuevo Plato</span>
      </RouterLink>
    </header>

    <!-- Mobile Header -->
    <div class="mobile-header">
      <p class="mobile-subtitle">Registro de alimentación</p>
      <h2 class="mobile-title">Platos de esta semana</h2>
    </div>

    <!-- Medical disclaimer (REQ-AL-02) -->
    <div class="disclaimer-banner" role="note">
      <span class="material-symbols-outlined disclaimer-icon" aria-hidden="true">health_and_safety</span>
      <span>Esta información es orientativa. Consulta siempre con tu pediatra.</span>
    </div>

    <!-- Tab bar (REQ-SC1) -->
    <div class="tab-bar" role="tablist">
      <button
        data-test="tab-plates"
        :class="['tab', { 'tab-active': activeTab === 'platos' }]"
        role="tab"
        :aria-selected="activeTab === 'platos'"
        @click="switchTab('platos')"
      >
        Platos
      </button>
      <button
        data-test="tab-snacks"
        :class="['tab', { 'tab-active': activeTab === 'snacks' }]"
        role="tab"
        :aria-selected="activeTab === 'snacks'"
        @click="switchTab('snacks')"
      >
        Colaciones
      </button>
    </div>

    <!-- Platos tab content -->
    <template v-if="activeTab === 'platos'">
      <!-- Stage filter (REQ-C3, C4) -->
      <div class="filter-controls">
      <label for="stage-filter" class="filter-label">Filtrar por etapa:</label>
      <select
        id="stage-filter"
        v-model="selectedStageFilter"
        class="stage-filter"
        aria-label="Filtrar platos por etapa objetivo"
      >
        <option :value="null">Todas las etapas</option>
        <option
          v-for="stage in PLATE_STAGES"
          :key="stage"
          :value="stage"
        >
          {{ PLATE_STAGE_LABELS[stage] }}
        </option>
      </select>
    </div>

    <!-- Loading -->
    <div v-if="plateStore.loading" class="state-center" aria-live="polite">
      <div class="spinner" aria-hidden="true" />
      <p>Cargando platos...</p>
    </div>

    <!-- Error -->
    <div v-else-if="plateStore.error" class="state-center error-state" role="alert">
      <span class="material-symbols-outlined" aria-hidden="true">warning</span>
      <p>{{ plateStore.error }}</p>
      <button class="retry-btn" @click="plateStore.fetchSavedPlates()">Reintentar</button>
    </div>

    <!-- Empty state -->
    <div
      v-else-if="plateStore.savedPlates.length === 0"
      class="empty-state"
      role="status"
    >
      <span class="material-symbols-outlined empty-icon" aria-hidden="true">restaurant</span>
      <h2 class="empty-title">No tienes platos guardados</h2>
      <p class="empty-subtitle">¡Crea tu primer plato y descubre el equilibrio A/L de los alimentos de tu bebé!</p>
      <RouterLink to="/plate/new" class="create-btn">Crear mi primer plato</RouterLink>
    </div>

    <!-- Plate cards grid -->
    <ul v-else class="plate-grid" role="list" aria-label="Mis platos guardados">
      <li v-for="plate in plateStore.savedPlates" :key="plate.id" class="plate-item" role="listitem">
        <RouterLink :to="`/plates/${plate.id}`" class="plate-card">
          <!-- Desktop: Plate Hero Banner -->
          <div class="plate-hero desktop-only">
            <img
              src="/images/silicone_baby_plate.png"
              alt=""
              aria-hidden="true"
              class="plate-photo plate-photo--desktop"
            />
            <span
              class="balance-badge"
              :class="balanceBadgeClass(plate.balanceScore)"
            >
              {{ balanceLabelEs(plate.balanceScore) }}
            </span>
          </div>

          <!-- Mobile: Plate Image -->
          <div class="plate-image mobile-only">
            <img
              src="/images/silicone_baby_plate.png"
              alt=""
              aria-hidden="true"
              class="plate-photo plate-photo--mobile"
            />
          </div>

          <!-- Card Content -->
          <div class="card-content">
            <!-- Mobile: Title row with badge -->
            <div class="mobile-title-row mobile-only">
              <h3 class="card-name">{{ plate.name }}</h3>
              <span
                class="balance-badge-mobile"
                :class="balanceBadgeClass(plate.balanceScore)"
              >
                {{ balanceLabelEs(plate.balanceScore) }}
              </span>
            </div>

            <!-- Desktop: Just the title -->
            <h3 class="card-name desktop-only">{{ plate.name }}</h3>

            <!-- Meta info -->
            <p class="card-meta">
              <span class="card-date">{{ formatRelativeDate(plate.createdAt) }}</span>
              <span v-if="isToday(plate.createdAt)" class="time-separator">,</span>
              <span v-if="isToday(plate.createdAt)" class="card-time">{{ formatTime(plate.createdAt) }}</span>
            </p>

            <!-- Ingredient Chips -->
            <div class="ingredient-chips">
              <span
                v-for="(item, index) in getIngredientChips(plate).slice(0, 4)"
                :key="index"
                class="chip"
                :style="getGroupChipStyle(item.group)"
              >
                {{ item.name }}
              </span>
              <span v-if="getIngredientChips(plate).length > 4" class="chip chip-more">
                +{{ getIngredientChips(plate).length - 4 }} más
              </span>
            </div>
          </div>
        </RouterLink>
      </li>

      <!-- Pro upsell card (inside grid) -->
      <li v-if="atLimit && !authStore.isPro" class="plate-item upsell-item" role="complementary">
        <div class="upsell-card">
          <div class="upsell-icon-wrapper">
            <span class="material-symbols-outlined upsell-icon" aria-hidden="true">star</span>
          </div>
          <div class="upsell-content">
            <h3 class="upsell-title">¿Quieres guardar más platos?</h3>
            <p class="upsell-text">Únete a Pakulab Pro para platos ilimitados y análisis nutricional avanzado.</p>
          </div>
          <RouterLink to="/pricing" class="upsell-btn">Hacete Pro</RouterLink>
        </div>
      </li>

      <!-- Load more button -->
      <li v-if="plateStore.hasMore" class="load-more-item">
        <button
          class="load-more-btn"
          :disabled="plateStore.fetchMoreLoading"
          @click="plateStore.fetchMorePlates()"
        >
          <span
            v-if="plateStore.fetchMoreLoading"
            class="spinner-mini"
            aria-hidden="true"
          />
          <span
            v-else
            class="material-symbols-outlined"
            aria-hidden="true"
          >expand_more</span>
          {{
            plateStore.fetchMoreLoading
              ? 'Cargando...'
              : `Cargar más (${plateStore.savedPlates.length} de ${plateStore.totalPlates})`
          }}
        </button>
      </li>
    </ul>

    <!-- Mobile FAB: Create new plate -->
    <RouterLink
      v-if="!atLimit"
      to="/plate/new"
      class="plate-list-fab mobile-only"
      aria-label="Crear nuevo plato"
    >
      <span class="material-symbols-outlined" aria-hidden="true">add</span>
    </RouterLink>

    <!-- Mobile Upsell Banner (outside grid) -->
    <div v-if="atLimit && !authStore.isPro" class="upsell-banner mobile-only" role="complementary">
      <div class="upsell-banner-content">
          <h4 class="upsell-banner-title">¿Quieres guardar más platos?</h4>
        <p class="upsell-banner-text">Obtén almacenamiento ilimitado y análisis nutricional avanzado.</p>
        <RouterLink to="/pricing" class="upsell-banner-btn">Hacete Pro</RouterLink>
      </div>
    </div>
    </template>

    <!-- Colaciones tab content (REQ-SC1) -->
    <SnackListSection
      v-else-if="activeTab === 'snacks'"
      :baby-age-months="babyAgeMonths ?? 0"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePlateStore } from '@/shared/stores/plateStore.js'
import { useAuthStore } from '@/shared/stores/authStore.js'
import { useProfileStore } from '@/shared/stores/profileStore.js'
import { PLATE_LIMITS, BALANCE_THRESHOLD, IMBALANCE_THRESHOLD } from '@pakulab/shared'
import { PLATE_STAGES, PLATE_STAGE_LABELS, getSuggestedStageForAge, getAgeMonths } from '@pakulab/shared'
import type { Plate, PlateItem, FoodGroup, PlateStage } from '@pakulab/shared'
import SnackListSection from './components/SnackListSection.vue'

const route = useRoute()
const router = useRouter()
const plateStore = usePlateStore()
const authStore = useAuthStore()
const profileStore = useProfileStore()

const plateLimit = computed(() => PLATE_LIMITS[authStore.tier])
const atLimit = computed(
  () => plateStore.savedPlates.length >= plateLimit.value,
)

// ─── Tab Management (REQ-SC1) ──────────────────────────────────────────────

/** Active tab derived from URL query: ?tab=snacks → 'snacks', otherwise 'platos' */
const activeTab = computed<'platos' | 'snacks'>(() => {
  // route.query.tab may be a string or (for a repeated ?tab=…&tab=…) an array —
  // normalize to the first value so a malformed URL still resolves a tab.
  const tab = route?.query?.tab
  const normalized = Array.isArray(tab) ? tab[0] : tab
  return normalized === 'snacks' ? 'snacks' : 'platos'
})

/** Switch tabs by updating URL query param (shareable, back-button friendly) */
function switchTab(tab: 'platos' | 'snacks'): void {
  // Preserve any other query params — only add/remove the `tab` key.
  const query = { ...route.query }
  if (tab === 'platos') {
    delete query.tab
  } else {
    query.tab = 'snacks'
  }
  router.replace({ query })
}

// ─── Stage Filter (REQ-C3, C4) ─────────────────────────────────────────────
/** Selected stage filter (null = "Todas") */
const selectedStageFilter = ref<PlateStage | null>(null)

/** Baby's age in months (null if no active profile) */
const babyAgeMonths = computed<number | null>(() => {
  const birthDate = profileStore.activeProfile?.birthDate
  return birthDate ? getAgeMonths(birthDate) : null
})

/** REQ-C4: Default filter to the baby's current stage */
function initializeStageFilter(): void {
  if (babyAgeMonths.value !== null) {
    selectedStageFilter.value = getSuggestedStageForAge(babyAgeMonths.value)
  } else {
    selectedStageFilter.value = null // "Todas"
  }
}

onMounted(() => {
  // Set the default filter (REQ-C4), then do a single initial fetch. The watch is
  // registered afterwards so this default assignment does not trigger a second,
  // racing fetch on mount — it only reacts to later user changes.
  initializeStageFilter()
  plateStore.fetchSavedPlates(selectedStageFilter.value ?? undefined)

  // Refetch when the user changes the stage filter.
  watch(selectedStageFilter, () => {
    plateStore.fetchSavedPlates(selectedStageFilter.value ?? undefined)
  })
})

function formatRelativeDate(iso: string): string {
  const date = new Date(iso)
  const now = new Date()
  const diffTime = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Hoy'
  if (diffDays === 1) return 'Ayer'
  if (diffDays < 7) return `Hace ${diffDays} días`
  if (diffDays < 14) return 'Hace 1 semana'
  if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semanas`
  
  return date.toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
  })
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function isToday(iso: string): boolean {
  const date = new Date(iso)
  const now = new Date()
  return date.toDateString() === now.toDateString()
}

function balanceBadgeClass(score: number): string {
  const abs = Math.abs(score)
  if (abs <= BALANCE_THRESHOLD) return 'badge-balanced'
  if (abs <= IMBALANCE_THRESHOLD) return score > 0 ? 'badge-astringent' : 'badge-laxative'
  return score > 0 ? 'badge-very-astringent' : 'badge-very-laxative'
}

function balanceLabelEs(score: number): string {
  const abs = Math.abs(score)
  if (abs <= BALANCE_THRESHOLD) return 'Equilibrado'
  if (abs <= IMBALANCE_THRESHOLD) return score > 0 ? 'Astringente' : 'Laxante'
  return score > 0 ? 'Muy astringente' : 'Muy laxante'
}

/** Get food items with their group info for colored chips */
function getIngredientChips(plate: Plate): Array<{ name: string; group: FoodGroup }> {
  return plate.items?.map((item: PlateItem) => ({
    name: item.food?.name ?? 'Alimento desconocido',
    group: item.food?.group ?? item.groupAssignment,
  })) ?? []
}

/** Get CSS custom property for food group chip styling */
function getGroupChipStyle(group: FoodGroup): Record<string, string> {
  const containerTokens: Record<FoodGroup, string> = {
    FRUIT: 'var(--md3-group-fruit)',
    VEGETABLE: 'var(--md3-group-vegetable)',
    PROTEIN: 'var(--md3-group-protein)',
    CEREAL_TUBER: 'var(--md3-group-cereal)',
    HEALTHY_FAT: 'var(--md3-group-fat)',
  }
  const onTokens: Record<FoodGroup, string> = {
    FRUIT: 'var(--md3-group-fruit-on)',
    VEGETABLE: 'var(--md3-group-vegetable-on)',
    PROTEIN: 'var(--md3-group-protein-on)',
    CEREAL_TUBER: 'var(--md3-group-cereal-on)',
    HEALTHY_FAT: 'var(--md3-group-fat-on)',
  }
  return {
    '--chip-bg': containerTokens[group],
    '--chip-color': onTokens[group],
  }
}
</script>

<style scoped>
/* ═══════════════════════════════════════════════════════════════
   PLATE LIST PAGE - Mobile First, Responsive to Desktop
   Matches Stitch designs for both mobile and desktop
   ═══════════════════════════════════════════════════════════════ */

.plate-list-page {
  padding: var(--md3-space-4);
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-4);
}

@media (max-width: 430px) {
  .plate-list-page {
    padding: var(--md3-space-2);
  }
}

/* ─── Utilities ─── */
.desktop-only {
  display: none !important;
}

.mobile-only {
  display: flex;
}

@media (min-width: 768px) {
  .desktop-only {
    display: flex !important;
  }
  .desktop-only.block {
    display: block !important;
  }
  /* Fix: h3.card-name must remain block-level on desktop (UX-7).
     The base .desktop-only rule uses !important so the override needs
     !important too to win the cascade. */
  .card-name.desktop-only {
    display: block !important;
  }
  .mobile-only {
    display: none !important;
  }
}

/* ─── Header (Desktop) ─── */
.page-header {
  display: none;
}

@media (min-width: 768px) {
  .page-header {
    display: flex;
    flex-direction: row;
    align-items: flex-end;
    justify-content: space-between;
    gap: var(--md3-space-4);
    margin-bottom: var(--md3-space-6);
  }
}

.header-text {
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-1);
}

.header-title {
  margin: 0;
  font-family: var(--md3-font-headline);
  font-size: 3rem;
  font-weight: 800;
  color: var(--md3-primary);
  letter-spacing: -0.02em;
  line-height: 1.1;
}

.header-subtitle {
  margin: 0;
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-md);
  color: var(--md3-on-surface-variant);
  opacity: 0.8;
}

.create-btn-desktop {
  display: inline-flex;
  align-items: center;
  gap: var(--md3-space-2);
  padding: var(--md3-space-3) var(--md3-space-6);
  background: var(--md3-primary);
  color: var(--md3-on-primary);
  border-radius: var(--md3-rounded-full);
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-lg);
  font-weight: var(--md3-weight-semibold);
  text-decoration: none;
  box-shadow: var(--md3-shadow-card);
  transition: all var(--md3-transition-fast);
  white-space: nowrap;
}

.create-btn-desktop:hover {
  background: var(--md3-primary-dim);
  box-shadow: var(--md3-shadow-elevated);
  transform: translateY(-1px);
}

.create-btn-desktop.disabled {
  opacity: 0.45;
  pointer-events: none;
}

.create-btn-desktop .material-symbols-outlined {
  font-size: 1.25rem;
}

/* ─── Mobile Header ─── */
.mobile-header {
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-1);
  margin-bottom: var(--md3-space-2);
}

.mobile-subtitle {
  margin: 0;
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-sm);
  color: var(--md3-on-surface-variant);
  font-weight: var(--md3-weight-medium);
}

.mobile-title {
  margin: 0;
  font-family: var(--md3-font-headline);
  font-size: 1.75rem;
  font-weight: 800;
  color: var(--md3-on-surface);
  line-height: 1.2;
  letter-spacing: -0.01em;
}

@media (min-width: 768px) {
  .mobile-header {
    display: none;
  }
}

/* ─── Disclaimer ─── */
.disclaimer-banner {
  display: flex;
  gap: var(--md3-space-2);
  align-items: center;
  background: var(--md3-primary-container);
  border-radius: var(--md3-rounded-sm);
  padding: 0.75rem var(--md3-space-3);
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-sm);
  color: var(--md3-on-primary-container);
}

.disclaimer-icon {
  font-size: 1.25rem;
  color: var(--md3-primary);
  flex-shrink: 0;
}

@media (min-width: 768px) {
  .disclaimer-banner {
    margin-bottom: var(--md3-space-4);
  }
}

/* ─── Stage Filter (REQ-C3, C4) ─── */
.filter-controls {
  display: flex;
  align-items: center;
  gap: var(--md3-space-2);
  margin-top: var(--md3-space-3);
  margin-bottom: var(--md3-space-2);
}

.filter-label {
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-sm);
  font-weight: var(--md3-weight-semibold);
  color: var(--md3-on-surface-variant);
  flex-shrink: 0;
}

.stage-filter {
  flex: 1;
  max-width: 16rem;
  padding: 0.5rem var(--md3-space-2);
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-sm);
  color: var(--md3-on-surface);
  background: var(--md3-surface-container-low);
  border: 1px solid var(--md3-outline-variant);
  border-radius: var(--md3-rounded-sm);
  cursor: pointer;
  transition:
    border-color var(--md3-transition-fast),
    background var(--md3-transition-fast);
}

.stage-filter:hover {
  border-color: var(--md3-primary);
  background: var(--md3-surface-container);
}

.stage-filter:focus {
  outline: 2px solid var(--md3-primary);
  outline-offset: 1px;
  border-color: var(--md3-primary);
}

@media (min-width: 768px) {
  .filter-controls {
    margin-bottom: var(--md3-space-4);
  }
}

/* ─── States ─── */
.state-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 3rem 0;
  font-family: var(--md3-font-body);
  color: var(--md3-on-surface-variant);
}

.error-state {
  color: var(--md3-error);
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--md3-outline-variant);
  border-top-color: var(--md3-primary);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.retry-btn {
  padding: 0.5rem 1.25rem;
  background: var(--md3-surface-container);
  border: none;
  border-radius: var(--md3-rounded-sm);
  cursor: pointer;
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-lg);
  color: var(--md3-on-surface);
  transition: background var(--md3-transition-fast);
}

.retry-btn:hover {
  background: var(--md3-surface-container-high);
}

/* ─── Empty State ─── */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 3rem 1rem;
  text-align: center;
  background: var(--md3-surface-container-low);
  border-radius: var(--md3-rounded-lg);
  border: 2px dashed var(--md3-outline-variant);
}

.empty-icon {
  font-size: 3.5rem;
  color: var(--md3-primary);
}

.empty-title {
  margin: 0;
  font-family: var(--md3-font-headline);
  font-size: var(--md3-headline-sm);
  font-weight: var(--md3-weight-bold);
  color: var(--md3-on-surface);
}

.empty-subtitle {
  margin: 0;
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-md);
  color: var(--md3-on-surface-variant);
  max-width: 300px;
}

.create-btn {
  display: inline-flex;
  align-items: center;
  padding: 0.7rem 1.5rem;
  background: var(--md3-primary);
  color: var(--md3-on-primary);
  border-radius: var(--md3-rounded-full);
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-lg);
  font-weight: var(--md3-weight-semibold);
  text-decoration: none;
  margin-top: 0.5rem;
  box-shadow: var(--md3-shadow-card);
  transition: background var(--md3-transition-fast);
}

.create-btn:hover {
  background: var(--md3-primary-dim);
}

/* ─── Plate Grid ─── */
.plate-grid {
  list-style: none;
  margin: 0;
  padding: 0;
  padding-bottom: calc(8rem + env(safe-area-inset-bottom, 0px));
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-3);
}

@media (min-width: 768px) {
  .plate-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--md3-space-6);
  }
}

@media (min-width: 1024px) {
  .plate-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.plate-item {
  margin: 0;
}

/* ─── Plate Card ─── */
.plate-card {
  display: flex;
  align-items: center;
  gap: var(--md3-space-3);
  padding: var(--md3-space-3);
  background: var(--md3-surface-container-lowest);
  border-radius: var(--md3-rounded-md);
  box-shadow: 0 8px 30px rgb(0, 0, 0, 0.04);
  text-decoration: none;
  transition: transform var(--md3-transition-fast);
  position: relative;
  overflow: hidden;
}

.plate-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--md3-shadow-card);
}

.plate-card:active {
  transform: scale(0.98);
}

@media (min-width: 768px) {
  .plate-card {
    flex-direction: column;
    align-items: stretch;
    padding: 0;
    gap: 0;
  }
}

/* ─── Mobile: Plate Image ─── */
.plate-image {
  flex-shrink: 0;
}

/* ─── Desktop: Plate Hero Banner ─── */
.plate-hero {
  position: relative;
  width: 100%;
  height: 180px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--md3-primary-container) 55%, var(--md3-surface-container-lowest)) 0%,
    color-mix(in srgb, var(--md3-primary-container) 25%, var(--md3-surface-container-lowest)) 100%
  );
  overflow: hidden;
}

.plate-hero::after {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(
    circle at 30% 30%,
    rgba(255, 255, 255, 0.4) 0%,
    transparent 60%
  );
  pointer-events: none;
}

.plate-photo {
  display: block;
  object-fit: cover;
  border-radius: 50%;
  background: var(--md3-surface-container-low);
}

.plate-photo--mobile {
  width: 80px;
  height: 80px;
}

.plate-photo--desktop {
  width: 140px;
  height: 140px;
  border: 4px solid var(--md3-surface-container-lowest);
  box-shadow: 0 12px 32px -8px rgba(0, 105, 75, 0.25);
  position: relative;
  z-index: 1;
  transition: transform var(--md3-transition-fast);
}

.plate-card:hover .plate-photo--desktop {
  transform: scale(1.04);
}

/* ─── Balance Badge ─── */
.balance-badge {
  position: absolute;
  top: var(--md3-space-3);
  right: var(--md3-space-3);
  z-index: 2;
  padding: 0.375rem var(--md3-space-3);
  border-radius: var(--md3-rounded-full);
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-sm);
  font-weight: var(--md3-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.02em;
  box-shadow: 0 2px 8px -2px rgba(0, 0, 0, 0.15);
}

.balance-badge-mobile {
  padding: 0.125rem var(--md3-space-2);
  border-radius: var(--md3-rounded-full);
  font-family: var(--md3-font-label);
  font-size: 12px;
  font-weight: var(--md3-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.02em;
  white-space: nowrap;
}

.badge-balanced {
  background: var(--md3-primary-container);
  color: var(--md3-on-primary-container);
}

.badge-astringent {
  background: var(--md3-error-container);
  color: var(--md3-on-error-container);
  opacity: 0.8;
}

.badge-laxative {
  background: var(--md3-secondary-container);
  color: var(--md3-on-secondary-container);
}

.badge-very-astringent {
  background: var(--md3-error-container);
  color: var(--md3-on-error-container);
}

.badge-very-laxative {
  background: var(--md3-secondary-container);
  color: var(--md3-on-secondary-container);
}

/* ─── Card Content ─── */
.card-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-1);
}

@media (min-width: 768px) {
  .card-content {
    gap: var(--md3-space-2);
    width: 100%;
    padding: var(--md3-space-5) var(--md3-space-6) var(--md3-space-6);
  }
}

/* Mobile title row */
.mobile-title-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--md3-space-2);
}

.card-name {
  margin: 0;
  font-family: var(--md3-font-headline);
  font-size: var(--md3-body-lg);
  font-weight: var(--md3-weight-bold);
  color: var(--md3-on-surface);
  line-height: 1.2;
}

@media (min-width: 768px) {
  .card-name {
    font-size: 1.25rem;
    line-height: 1.3;
  }
}

.card-meta {
  margin: 0;
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-sm);
  color: var(--md3-on-surface-variant);
  display: flex;
  gap: 0.25rem;
  align-items: center;
}

.card-date {
  color: var(--md3-on-surface-variant);
}

.time-separator,
.card-time {
  color: var(--md3-on-surface-variant);
}

/* ─── Ingredient Chips ─── */
.ingredient-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
  margin-top: var(--md3-space-1);
}

@media (min-width: 768px) {
  .ingredient-chips {
    margin-top: var(--md3-space-2);
  }
}

.chip {
  padding: 0.25rem 0.75rem;
  background: var(--chip-bg, var(--md3-surface-container-high));
  color: var(--chip-color, var(--md3-on-surface-variant));
  border-radius: var(--md3-rounded-full);
  font-family: var(--md3-font-label);
  font-size: 12px;
  font-weight: var(--md3-weight-semibold);
  white-space: normal;
  word-break: break-word;
}

@media (min-width: 768px) {
  .chip {
    padding: 0.375rem var(--md3-space-3);
    font-size: var(--md3-label-sm);
  }
}

.chip-more {
  background: var(--md3-surface-container);
  color: var(--md3-on-surface-variant);
}

/* ─── Desktop Upsell Card ─── */
.upsell-item {
  display: none;
}

@media (min-width: 768px) {
  .upsell-item {
    display: block;
  }
}

.upsell-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--md3-space-6);
  background: rgba(0, 105, 75, 0.05);
  border: 2px dashed rgba(0, 105, 75, 0.3);
  border-radius: var(--md3-rounded-md);
  text-align: center;
  gap: var(--md3-space-3);
  height: 100%;
  min-height: 280px;
}

.upsell-icon-wrapper {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: var(--md3-primary-container);
  display: flex;
  align-items: center;
  justify-content: center;
}

.upsell-icon {
  font-size: 2rem;
  color: var(--md3-primary);
  font-variation-settings: 'FILL' 1;
}

.upsell-content {
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-1);
}

.upsell-title {
  margin: 0;
  font-family: var(--md3-font-headline);
  font-size: var(--md3-headline-sm);
  font-weight: var(--md3-weight-bold);
  color: var(--md3-on-surface);
}

.upsell-text {
  margin: 0;
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-sm);
  color: var(--md3-on-surface-variant);
  max-width: 200px;
}

.upsell-btn {
  margin-top: var(--md3-space-2);
  padding: 0.75rem var(--md3-space-6);
  border: 2px solid var(--md3-primary);
  color: var(--md3-primary);
  background: transparent;
  border-radius: var(--md3-rounded-full);
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-lg);
  font-weight: var(--md3-weight-bold);
  text-decoration: none;
  transition: all var(--md3-transition-fast);
}

.upsell-btn:hover {
  background: var(--md3-primary);
  color: var(--md3-on-primary);
}

/* ─── Mobile Upsell Banner ─── */
.upsell-banner {
  margin-top: var(--md3-space-4);
  background: var(--md3-primary);
  border-radius: var(--md3-rounded-md);
  padding: var(--md3-space-6);
  position: relative;
  overflow: hidden;
  box-shadow: var(--md3-shadow-elevated);
}

.upsell-banner::before {
  content: '';
  position: absolute;
  bottom: -32px;
  right: -32px;
  width: 128px;
  height: 128px;
  background: rgba(140, 254, 206, 0.2);
  border-radius: 50%;
  filter: blur(20px);
}

.upsell-banner-content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-1);
}

.upsell-banner-title {
  margin: 0;
  font-family: var(--md3-font-headline);
  font-size: var(--md3-headline-sm);
  font-weight: var(--md3-weight-bold);
  color: white;
}

.upsell-banner-text {
  margin: 0;
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-sm);
  color: rgba(199, 255, 227, 0.9);
}

.upsell-banner-btn {
  margin-top: var(--md3-space-3);
  display: inline-flex;
  align-self: flex-start;
  padding: 0.625rem var(--md3-space-6);
  background: white;
  color: var(--md3-primary);
  border-radius: var(--md3-rounded-full);
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-lg);
  font-weight: var(--md3-weight-bold);
  text-decoration: none;
  transition: all var(--md3-transition-fast);
}

.upsell-banner-btn:hover {
  transform: scale(1.02);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

@media (min-width: 768px) {
  .upsell-banner {
    display: none;
  }
}

/* ─── Load More ─── */
.load-more-item {
  display: flex;
  justify-content: center;
  padding: var(--md3-space-4) 0;
  grid-column: 1 / -1;
}

.load-more-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--md3-space-2);
  padding: 0.75rem var(--md3-space-6);
  background: var(--md3-surface-container);
  color: var(--md3-on-surface-variant);
  border: 1px solid var(--md3-outline-variant);
  border-radius: var(--md3-rounded-full);
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-lg);
  font-weight: var(--md3-weight-semibold);
  cursor: pointer;
  transition: all var(--md3-transition-fast);
}

.load-more-btn:hover:not(:disabled) {
  background: var(--md3-surface-container-high);
  color: var(--md3-on-surface);
  border-color: var(--md3-outline);
}

.load-more-btn:active:not(:disabled) {
  transform: scale(0.97);
}

.load-more-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.load-more-btn .material-symbols-outlined {
  font-size: 1.25rem;
}

.spinner-mini {
  width: 18px;
  height: 18px;
  border: 2px solid var(--md3-outline-variant);
  border-top-color: var(--md3-primary);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

/* ─── Mobile FAB ─── */
.plate-list-fab {
  position: fixed;
  bottom: calc(8rem + env(safe-area-inset-bottom, 0px));
  right: 1.5rem;
  z-index: 110;
  width: 3.5rem;
  height: 3.5rem;
  border-radius: 50%;
  background: var(--md3-gradient-cta, var(--md3-primary));
  color: var(--md3-on-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 24px -4px rgba(0, 105, 75, 0.3);
  text-decoration: none;
  transition: transform var(--md3-transition-fast), box-shadow var(--md3-transition-fast);
}

.plate-list-fab:hover {
  transform: scale(1.05);
  box-shadow: 0 12px 32px -4px rgba(0, 105, 75, 0.4);
}

.plate-list-fab .material-symbols-outlined {
  font-size: 1.5rem;
}

/* ─── Tab Bar (REQ-SC1) ───────────────────────────────────────── */

.tab-bar {
  display: flex;
  gap: var(--md3-space-2);
  border-bottom: 1px solid var(--md3-outline-variant);
  margin-bottom: var(--md3-space-4);
}

.tab {
  padding: var(--md3-space-3) var(--md3-space-4);
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-lg);
  font-weight: var(--md3-weight-medium);
  color: var(--md3-on-surface-variant);
  cursor: pointer;
  transition: all var(--md3-transition-fast);
  position: relative;
  margin-bottom: -1px; /* Overlap the border-bottom of tab-bar */
}

.tab:hover {
  color: var(--md3-on-surface);
  background: var(--md3-surface-container);
}

.tab-active {
  color: var(--md3-primary);
  border-bottom-color: var(--md3-primary);
  font-weight: var(--md3-weight-semibold);
}

.tab-active:hover {
  background: transparent;
}

@media (min-width: 768px) {
  .tab-bar {
    margin-bottom: var(--md3-space-5);
  }
}
</style>
