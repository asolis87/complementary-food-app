<template>
  <div class="food-search-page">
    <header class="page-header">
      <h1 class="page-title">Catálogo de Alimentos</h1>
      <p class="page-subtitle">
        {{ store.totalCount || store.foods.length }} alimentos disponibles para alimentación complementaria
      </p>
    </header>

    <!-- Filters -->
    <section class="filters" aria-label="Filtros del catálogo">
      <!-- Search -->
      <div class="search-wrapper">
        <span class="search-icon" aria-hidden="true">🔍</span>
        <input
          v-model="searchQuery"
          type="search"
          class="search-input"
          placeholder="Buscar alimento..."
          aria-label="Buscar alimento por nombre"
          autocomplete="off"
          @input="onSearchInput"
        />
        <button v-if="searchQuery" class="clear-btn" aria-label="Limpiar búsqueda" @click="clearSearch">
          ×
        </button>
      </div>

      <div class="filter-row">
        <!-- Group filter -->
        <select
          v-model="selectedGroup"
          class="filter-select"
          aria-label="Filtrar por grupo alimentario"
          @change="applyFilters"
        >
          <option :value="null">Todos los grupos</option>
          <option v-for="(label, key) in FOOD_GROUP_LABELS" :key="key" :value="key">
            {{ label }}
          </option>
        </select>

        <!-- A/L filter -->
        <select
          v-model="selectedAL"
          class="filter-select"
          aria-label="Filtrar por clasificación A/L"
          @change="applyFilters"
        >
          <option :value="null">A/L: Todos</option>
          <option v-for="(label, key) in AL_CLASSIFICATION_LABELS" :key="key" :value="key">
            {{ label }}
          </option>
        </select>

        <!-- Age filter -->
        <select
          v-model="selectedAge"
          class="filter-select"
          aria-label="Filtrar por edad mínima"
          @change="applyFilters"
        >
          <option :value="null">Todas las edades</option>
          <option v-for="m in AGE_OPTIONS" :key="m" :value="m">≥ {{ m }} meses</option>
        </select>

        <!-- Reset filters -->
        <button
          v-if="hasActiveFilters"
          class="reset-btn"
          aria-label="Limpiar todos los filtros"
          @click="resetFilters"
        >
          Limpiar filtros
        </button>
      </div>
    </section>

    <!-- Offline banner -->
    <div v-if="store.isUsingCache" class="cache-banner" role="status">
      📦 Mostrando datos guardados (sin conexión)
    </div>

    <!-- Error state -->
    <div v-if="store.error && store.foods.length === 0" class="error-state" role="alert">
      <span class="error-icon">⚠️</span>
      <p>{{ store.error }}</p>
      <button class="retry-btn" @click="load">Reintentar</button>
    </div>

    <!-- Loading skeleton -->
    <div v-else-if="store.loading && store.foods.length === 0" class="skeleton-grid" aria-busy="true" aria-label="Cargando alimentos...">
      <div v-for="n in 12" :key="n" class="skeleton-card" />
    </div>

    <!-- Empty filtered results -->
    <div
      v-else-if="!store.loading && store.filteredFoods.length === 0 && store.foods.length > 0"
      class="empty-state"
      role="status"
    >
      <p>Sin resultados para los filtros actuales.</p>
      <button class="reset-btn" @click="resetFilters">Ver todos</button>
    </div>

    <!-- Food grid -->
    <section v-else class="food-grid" aria-label="Lista de alimentos">
      <article
        v-for="food in store.filteredFoods"
        :key="food.id"
        class="food-card"
        :class="{ 'food-card--needs-validation': food.needsValidation }"
      >
        <!-- Header row: badge + name + allergen flag -->
        <div class="card-header">
          <span class="al-badge" :class="alBadgeClass(food.alClassification)" :title="AL_CLASSIFICATION_LABELS[food.alClassification]">
            {{ alBadgeLabel(food.alClassification) }}
          </span>
          <span class="food-name">{{ food.name }}</span>
          <span v-if="food.isAllergen" class="allergen-chip" title="Alérgeno potencial">⚠️</span>
        </div>

        <!-- Meta row: group tag + age -->
        <div class="card-meta">
          <span class="group-chip">{{ FOOD_GROUP_LABELS[food.group] }}</span>
          <span class="age-chip">≥ {{ food.ageMonths }}m</span>
          <span v-if="food.needsValidation" class="validation-chip" title="Pendiente validación nutricional">🔬</span>
        </div>

        <!-- Description -->
        <p v-if="food.description" class="food-description">{{ food.description }}</p>
      </article>
    </section>

    <!-- Load more -->
    <div v-if="store.hasMore && !store.loading" class="load-more-wrapper">
      <button class="load-more-btn" @click="loadMore">Cargar más alimentos</button>
    </div>
    <div v-if="store.loading && store.foods.length > 0" class="loading-more" aria-live="polite">
      Cargando más...
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { FoodGroup, ALClassification } from '@cfa/shared'
import { FOOD_GROUP_LABELS, AL_CLASSIFICATION_LABELS } from '@cfa/shared'
import { useFoodStore } from '@/shared/stores/foodStore.js'

const store = useFoodStore()

// ── Local filter state (drives the store setFilter calls) ──────────────────
const searchQuery = ref(store.filters.search)
const selectedGroup = ref<FoodGroup | null>(store.filters.group)
const selectedAL = ref<ALClassification | null>(store.filters.alClassification)
const selectedAge = ref<number | null>(store.filters.ageMonths)

const AGE_OPTIONS = [4, 6, 7, 8, 9, 10, 12]

const hasActiveFilters = computed(
  () =>
    !!searchQuery.value ||
    selectedGroup.value !== null ||
    selectedAL.value !== null ||
    selectedAge.value !== null,
)

// ── Search with debounce ───────────────────────────────────────────────────
let searchTimer: ReturnType<typeof setTimeout> | null = null

function onSearchInput() {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    store.setFilter('search', searchQuery.value.trim())
  }, 300)
}

function clearSearch() {
  searchQuery.value = ''
  store.setFilter('search', '')
}

// ── Group / A-L / Age filters ──────────────────────────────────────────────
function applyFilters() {
  store.setFilter('group', selectedGroup.value)
  store.setFilter('alClassification', selectedAL.value)
  store.setFilter('ageMonths', selectedAge.value)
}

function resetFilters() {
  searchQuery.value = ''
  selectedGroup.value = null
  selectedAL.value = null
  selectedAge.value = null
  store.clearFilters()
}

// ── Load / pagination ──────────────────────────────────────────────────────
async function load() {
  await store.fetchFoods()
}

async function loadMore() {
  if (store.hasMore) {
    // Pass current active filters so the next page respects them
    const currentFilters: { q?: string; group?: import('@cfa/shared').FoodGroup; alClassification?: import('@cfa/shared').ALClassification; ageMonths?: number } = {}
    if (store.filters.search) currentFilters.q = store.filters.search
    if (store.filters.group) currentFilters.group = store.filters.group
    if (store.filters.alClassification) currentFilters.alClassification = store.filters.alClassification
    if (store.filters.ageMonths !== null) currentFilters.ageMonths = store.filters.ageMonths
    await store.fetchFoods(currentFilters, store.currentPage + 1)
  }
}

onMounted(() => {
  // Only fetch if we have no data yet (avoids double fetch when navigating back)
  if (store.foods.length === 0) {
    load()
  }
})

// ── AL badge helpers ──────────────────────────────────────────────────────
function alBadgeClass(al: ALClassification): string {
  switch (al) {
    case 'ASTRINGENT':
      return 'badge-astringent'
    case 'LAXATIVE':
      return 'badge-laxative'
    default:
      return 'badge-neutral'
  }
}

function alBadgeLabel(al: ALClassification): string {
  switch (al) {
    case 'ASTRINGENT':
      return 'A'
    case 'LAXATIVE':
      return 'L'
    default:
      return 'N'
  }
}
</script>

<style scoped>
.food-search-page {
  max-width: 960px;
  margin: 0 auto;
  padding: 1.5rem 1rem 4rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

/* Header */
.page-header {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.page-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
}

.page-subtitle {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
}

/* Filters */
.filters {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.search-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 0.75rem;
  font-size: 0.9rem;
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 0.65rem 2.5rem 0.65rem 2.25rem;
  border: 2px solid #e5e7eb;
  border-radius: 0.75rem;
  font-size: 0.925rem;
  outline: none;
  transition: border-color 0.15s;
  background: white;
}

.search-input:focus {
  border-color: #10b981;
}

.search-input::-webkit-search-cancel-button {
  display: none;
}

.clear-btn {
  position: absolute;
  right: 0.6rem;
  background: #e5e7eb;
  border: none;
  border-radius: 9999px;
  width: 22px;
  height: 22px;
  cursor: pointer;
  font-size: 1rem;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
}

.filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}

.filter-select {
  flex: 1;
  min-width: 140px;
  padding: 0.5rem 0.75rem;
  border: 2px solid #e5e7eb;
  border-radius: 0.75rem;
  font-size: 0.875rem;
  background: white;
  cursor: pointer;
  outline: none;
  transition: border-color 0.15s;
}

.filter-select:focus {
  border-color: #10b981;
}

.reset-btn {
  padding: 0.5rem 1rem;
  background: #f3f4f6;
  border: 2px solid #e5e7eb;
  border-radius: 0.75rem;
  font-size: 0.875rem;
  cursor: pointer;
  color: #374151;
  transition: all 0.15s;
  white-space: nowrap;
}

.reset-btn:hover {
  background: #e5e7eb;
}

/* Cache / error banners */
.cache-banner {
  padding: 0.6rem 1rem;
  background: #fef3c7;
  border: 1px solid #fbbf24;
  border-radius: 0.75rem;
  font-size: 0.875rem;
  color: #92400e;
}

.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 3rem 1rem;
  text-align: center;
  color: #6b7280;
}

.error-icon {
  font-size: 2rem;
}

.retry-btn {
  padding: 0.6rem 1.5rem;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 0.75rem;
  font-size: 0.875rem;
  cursor: pointer;
  font-weight: 600;
}

.retry-btn:hover {
  background: #059669;
}

/* Empty state */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 3rem 1rem;
  color: #9ca3af;
  text-align: center;
}

/* Skeleton */
.skeleton-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1rem;
}

.skeleton-card {
  height: 110px;
  background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
  border-radius: 1rem;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* Food grid */
.food-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1rem;
}

/* Food card */
.food-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 1rem;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  transition: box-shadow 0.15s;
}

.food-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.food-card--needs-validation {
  border-color: #fbbf24;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.food-name {
  flex: 1;
  font-size: 0.9rem;
  font-weight: 600;
  color: #111827;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.allergen-chip {
  font-size: 0.85rem;
  flex-shrink: 0;
}

/* A/L badge */
.al-badge {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  font-size: 0.7rem;
  font-weight: 700;
  color: white;
}

.badge-astringent { background: #ef4444; }
.badge-laxative   { background: #10b981; }
.badge-neutral    { background: #9ca3af; }

/* Card meta */
.card-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  align-items: center;
}

.group-chip,
.age-chip,
.validation-chip {
  font-size: 0.7rem;
  padding: 0.15rem 0.5rem;
  border-radius: 9999px;
  white-space: nowrap;
}

.group-chip {
  background: #eff6ff;
  color: #1d4ed8;
  font-weight: 500;
}

.age-chip {
  background: #f0fdf4;
  color: #15803d;
  font-weight: 500;
}

.validation-chip {
  background: #fefce8;
  color: #854d0e;
}

/* Description */
.food-description {
  font-size: 0.78rem;
  color: #6b7280;
  line-height: 1.5;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Load more */
.load-more-wrapper {
  display: flex;
  justify-content: center;
  padding-top: 0.5rem;
}

.load-more-btn {
  padding: 0.75rem 2rem;
  background: white;
  border: 2px solid #10b981;
  border-radius: 0.75rem;
  color: #10b981;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}

.load-more-btn:hover {
  background: #10b981;
  color: white;
}

.loading-more {
  text-align: center;
  font-size: 0.875rem;
  color: #9ca3af;
  padding: 1rem;
}
</style>
