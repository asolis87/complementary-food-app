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
        :title="atLimit ? 'Límite de platos alcanzado. Actualizá a Pro.' : 'Crear nuevo plato'"
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
      <span>Esta información es orientativa. Consultá siempre con tu pediatra.</span>
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
      <h2 class="empty-title">No tenés platos guardados</h2>
      <p class="empty-subtitle">¡Creá tu primer plato y descubrí el equilibrio A/L de los alimentos de tu bebé!</p>
      <RouterLink to="/plate/new" class="create-btn">Crear mi primer plato</RouterLink>
    </div>

    <!-- Plate cards grid -->
    <ul v-else class="plate-grid" role="list" aria-label="Mis platos guardados">
      <li v-for="plate in plateStore.savedPlates" :key="plate.id" class="plate-item" role="listitem">
        <RouterLink :to="`/plates/${plate.id}`" class="plate-card">
          <!-- Desktop: Plate Visual -->
          <div class="plate-visual desktop-only">
            <div class="plate-circle">
              <div class="plate-inner"></div>
            </div>
          </div>

          <!-- Mobile: Plate Image -->
          <div class="plate-image mobile-only">
            <div class="image-placeholder">
              <span class="material-symbols-outlined">restaurant</span>
            </div>
          </div>

          <!-- Balance Badge - Desktop -->
          <span
            class="balance-badge desktop-only"
            :class="balanceBadgeClass(plate.balanceScore)"
          >
            {{ balanceLabelEs(plate.balanceScore) }}
          </span>

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
            <h3 class="upsell-title">¿Querés guardar más platos?</h3>
            <p class="upsell-text">Únete a Pakulab Pro para platos ilimitados y análisis nutricional avanzado.</p>
          </div>
          <RouterLink to="/pricing" class="upsell-btn">Hacete Pro</RouterLink>
        </div>
      </li>
    </ul>

    <!-- Mobile Upsell Banner (outside grid) -->
    <div v-if="atLimit && !authStore.isPro" class="upsell-banner mobile-only" role="complementary">
      <div class="upsell-banner-content">
        <h4 class="upsell-banner-title">¿Querés guardar más platos?</h4>
        <p class="upsell-banner-text">Obtén almacenamiento ilimitado y análisis nutricional avanzado.</p>
        <RouterLink to="/pricing" class="upsell-banner-btn">Hacete Pro</RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { usePlateStore } from '@/shared/stores/plateStore.js'
import { useAuthStore } from '@/shared/stores/authStore.js'
import { PLATE_LIMITS, BALANCE_THRESHOLD, IMBALANCE_THRESHOLD } from '@pakulab/shared'
import type { Plate, PlateItem, FoodGroup } from '@pakulab/shared'

const plateStore = usePlateStore()
const authStore = useAuthStore()

const plateLimit = computed(() => PLATE_LIMITS[authStore.tier])
const atLimit = computed(
  () => plateStore.savedPlates.length >= plateLimit.value,
)

onMounted(() => {
  plateStore.fetchSavedPlates()
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
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--md3-space-4);
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-4);
}

/* ─── Utilities ─── */
.desktop-only {
  display: none;
}

.mobile-only {
  display: flex;
}

@media (min-width: 768px) {
  .desktop-only {
    display: flex;
  }
  .desktop-only.block {
    display: block;
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
    align-items: flex-start;
    padding: var(--md3-space-6);
    gap: var(--md3-space-4);
  }
}

/* ─── Mobile: Plate Image ─── */
.plate-image {
  flex-shrink: 0;
}

.image-placeholder {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: var(--md3-surface-container);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.image-placeholder .material-symbols-outlined {
  font-size: 2rem;
  color: var(--md3-outline);
}

/* ─── Desktop: Plate Visual ─── */
.plate-visual {
  width: 100%;
  display: flex;
  justify-content: flex-start;
}

.plate-circle {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: var(--md3-surface-container-low);
  border: 4px solid var(--md3-surface-container);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.plate-inner {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: white;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* ─── Balance Badge ─── */
.balance-badge {
  position: absolute;
  top: var(--md3-space-6);
  right: var(--md3-space-6);
  padding: 0.375rem var(--md3-space-3);
  border-radius: var(--md3-rounded-full);
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-sm);
  font-weight: var(--md3-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.balance-badge-mobile {
  padding: 0.125rem var(--md3-space-2);
  border-radius: var(--md3-rounded-full);
  font-family: var(--md3-font-label);
  font-size: 10px;
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
  font-size: 11px;
  font-weight: var(--md3-weight-semibold);
  white-space: nowrap;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
}

@media (min-width: 768px) {
  .chip {
    padding: 0.375rem var(--md3-space-3);
    font-size: var(--md3-label-sm);
    max-width: 140px;
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
</style>
