<template>
  <div class="food-search-page">
    <header class="page-header">
      <h1 class="page-title">La Biblioteca de Alimentos Pakulab</h1>
      <p class="page-subtitle">
        {{ store.totalCount || store.foods.length }} alimentos disponibles para alimentación complementaria
      </p>
    </header>

    <!-- Filters -->
    <section class="filters-container" aria-label="Filtros del catálogo">
      <!-- Search -->
      <div class="search-wrapper">
        <span class="material-symbols-outlined search-icon" aria-hidden="true">search</span>
        <input
          v-model="searchQuery"
          type="search"
          class="search-input"
          placeholder="Buscar un alimento..."
          aria-label="Buscar alimento por nombre"
          autocomplete="off"
          @input="onSearchInput"
        />
        <button v-if="searchQuery" class="clear-btn" aria-label="Limpiar búsqueda" @click="clearSearch">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>

      <!-- Filter clusters -->
      <div class="filter-clusters">
        <!-- Group filter -->
        <div class="filter-cluster">
          <span class="cluster-label">Categoría</span>
          <div class="chip-row">
            <button
              class="filter-chip"
              :class="{ 'filter-chip--active': selectedGroup === null }"
              @click="setGroup(null)"
            >
              Todo
            </button>
            <button
              v-for="(label, key) in FOOD_GROUP_LABELS"
              :key="key"
              class="filter-chip"
              :class="{ 'filter-chip--active': selectedGroup === key }"
              @click="setGroup(key as FoodGroup)"
            >
              {{ label }}
            </button>
          </div>
        </div>

        <!-- A/L filter -->
        <div class="filter-cluster">
          <span class="cluster-label">Efecto Digestivo</span>
          <div class="chip-row">
            <button
              class="filter-chip"
              :class="{ 'filter-chip--active': selectedAL === null }"
              @click="setAL(null)"
            >
              Todos
            </button>
            <button
              v-for="(label, key) in AL_CLASSIFICATION_LABELS"
              :key="key"
              class="filter-chip"
              :class="{ 'filter-chip--active': selectedAL === key, [`chip-al-${key.toLowerCase()}`]: selectedAL === key }"
              @click="setAL(key as ALClassification)"
            >
              <span class="material-symbols-outlined chip-icon">{{ alIcon(key as ALClassification) }}</span>
              {{ label }}
            </button>
          </div>
        </div>

        <!-- Age filter -->
        <div class="filter-cluster">
          <span class="cluster-label">Edad mínima</span>
          <div class="chip-row">
            <button
              class="filter-chip"
              :class="{ 'filter-chip--active': selectedAge === null }"
              @click="setAge(null)"
            >
              Todas
            </button>
            <button
              v-for="m in AGE_OPTIONS"
              :key="m"
              class="filter-chip"
              :class="{ 'filter-chip--active': selectedAge === m }"
              @click="setAge(m)"
            >
              ≥ {{ m }}m
            </button>
          </div>
        </div>

        <!-- Reset filters -->
        <button
          v-if="hasActiveFilters"
          class="reset-btn"
          aria-label="Limpiar todos los filtros"
          @click="resetFilters"
        >
          <span class="material-symbols-outlined">filter_list_off</span>
          Limpiar filtros
        </button>
      </div>
    </section>

    <!-- Offline banner -->
    <div v-if="store.isUsingCache" class="cache-banner" role="status">
      <span class="material-symbols-outlined">inventory_2</span>
      Mostrando datos guardados (sin conexión)
    </div>

    <!-- Error state -->
    <div v-if="store.error && store.foods.length === 0" class="error-state" role="alert">
      <span class="material-symbols-outlined error-icon">warning</span>
      <p class="error-message">{{ store.error }}</p>
      <button class="cta-btn" @click="load">
        <span class="material-symbols-outlined">refresh</span>
        Reintentar
      </button>
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
      <span class="material-symbols-outlined empty-icon">search_off</span>
      <p class="empty-title">Sin resultados</p>
      <p class="empty-body">No hay alimentos que coincidan con los filtros seleccionados.</p>
      <button class="cta-btn" @click="resetFilters">
        <span class="material-symbols-outlined">restart_alt</span>
        Ver todos los alimentos
      </button>
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
          <span
            class="al-badge"
            :class="alBadgeClass(food.alClassification)"
            :title="AL_CLASSIFICATION_LABELS[food.alClassification]"
          >
            <span class="material-symbols-outlined al-badge-icon">{{ alIcon(food.alClassification) }}</span>
          </span>
          <span class="food-name">{{ food.name }}</span>
          <span v-if="food.isAllergen" class="allergen-chip" title="Alérgeno potencial">
            <span class="material-symbols-outlined">warning</span>
          </span>
        </div>

        <!-- Meta row: group tag + age -->
        <div class="card-meta">
          <span class="group-chip" :class="groupChipClass(food.group)">
            {{ FOOD_GROUP_LABELS[food.group] }}
          </span>
          <span class="age-chip">
            <span class="material-symbols-outlined age-icon">child_care</span>
            ≥ {{ food.ageMonths }}m
          </span>
          <span v-if="food.needsValidation" class="validation-chip" title="Pendiente validación nutricional">
            <span class="material-symbols-outlined">science</span>
          </span>
        </div>

        <!-- Description -->
        <p v-if="food.description" class="food-description">{{ food.description }}</p>
      </article>
    </section>

    <!-- Load more -->
    <div v-if="store.hasMore && !store.loading" class="load-more-wrapper">
      <button class="load-more-btn" @click="loadMore">
        <span class="material-symbols-outlined">expand_more</span>
        Cargar más alimentos
      </button>
    </div>
    <div v-if="store.loading && store.foods.length > 0" class="loading-more" aria-live="polite">
      <span class="material-symbols-outlined loading-icon">progress_activity</span>
      Cargando más...
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { FoodGroup, ALClassification } from '@pakulab/shared'
import { FOOD_GROUP_LABELS, AL_CLASSIFICATION_LABELS } from '@pakulab/shared'
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

// ── Group / A-L / Age chip setters ────────────────────────────────────────
function setGroup(group: FoodGroup | null) {
  selectedGroup.value = group
  store.setFilter('group', group)
}

function setAL(al: ALClassification | null) {
  selectedAL.value = al
  store.setFilter('alClassification', al)
}

function setAge(age: number | null) {
  selectedAge.value = age
  store.setFilter('ageMonths', age)
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
    const currentFilters: { q?: string; group?: import('@pakulab/shared').FoodGroup; alClassification?: import('@pakulab/shared').ALClassification; ageMonths?: number } = {}
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

function alIcon(al: ALClassification): string {
  switch (al) {
    case 'ASTRINGENT':
      return 'energy_savings_leaf'
    case 'LAXATIVE':
      return 'water_drop'
    default:
      return 'balance'
  }
}

// ── Group chip class ──────────────────────────────────────────────────────
function groupChipClass(group: FoodGroup): string {
  const map: Record<FoodGroup, string> = {
    FRUIT: 'group-chip--fruit',
    VEGETABLE: 'group-chip--vegetable',
    PROTEIN: 'group-chip--protein',
    CEREAL_TUBER: 'group-chip--cereal',
    HEALTHY_FAT: 'group-chip--fat',
  }
  return map[group] ?? ''
}
</script>

<style scoped>
/* ─── Page layout ──────────────────────────────────────────────────────── */
.food-search-page {
  max-width: 960px;
  margin: 0 auto;
  padding: 1.5rem 1rem 4rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

/* ─── Header ───────────────────────────────────────────────────────────── */
.page-header {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.page-title {
  font-family: var(--md3-font-headline);
  font-size: var(--md3-headline-md);
  font-weight: var(--md3-weight-bold);
  color: var(--md3-on-surface);
  margin: 0;
  letter-spacing: var(--md3-headline-tracking);
  line-height: var(--md3-headline-line-height);
}

.page-subtitle {
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-md);
  color: var(--md3-on-surface-variant);
  margin: 0;
  line-height: var(--md3-body-line-height);
}

/* ─── Filters container ────────────────────────────────────────────────── */
.filters-container {
  background: var(--md3-surface-container-low);
  border-radius: var(--md3-rounded-lg);
  padding: var(--md3-space-4) var(--md3-space-4);
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-4);
}

/* ─── Search ───────────────────────────────────────────────────────────── */
.search-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 1rem;
  font-size: 1.25rem;
  color: var(--md3-outline);
  pointer-events: none;
  user-select: none;
}

.search-input {
  width: 100%;
  padding: 0.85rem 2.75rem 0.85rem 3rem;
  background: var(--md3-surface-container-lowest);
  border: none;
  border-radius: var(--md3-rounded-md);
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-md);
  color: var(--md3-on-surface);
  outline: none;
  transition: box-shadow var(--md3-transition-fast);
}

.search-input::placeholder {
  color: var(--md3-outline-variant);
}

.search-input:focus {
  box-shadow: 0 0 0 0.5rem var(--md3-primary-container);
}

.search-input::-webkit-search-cancel-button {
  display: none;
}

.clear-btn {
  position: absolute;
  right: 0.6rem;
  background: var(--md3-surface-container-high);
  border: none;
  border-radius: var(--md3-rounded-full);
  width: 28px;
  height: 28px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--md3-on-surface-variant);
  transition: background var(--md3-transition-fast);
}

.clear-btn:hover {
  background: var(--md3-surface-container-highest);
}

.clear-btn .material-symbols-outlined {
  font-size: 1rem;
}

/* ─── Filter clusters ──────────────────────────────────────────────────── */
.filter-clusters {
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-3);
}

.filter-cluster {
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-2);
}

.cluster-label {
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-sm);
  font-weight: var(--md3-weight-bold);
  color: var(--md3-outline);
  text-transform: uppercase;
  letter-spacing: var(--md3-label-tracking);
}

.chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--md3-space-2);
  align-items: center;
}

/* ─── Filter chips ─────────────────────────────────────────────────────── */
.filter-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.45rem 1rem;
  background: var(--md3-surface-container);
  color: var(--md3-on-surface-variant);
  border: none;
  border-radius: var(--md3-rounded-full);
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-md);
  font-weight: var(--md3-weight-medium);
  cursor: pointer;
  transition:
    background var(--md3-transition-fast),
    color var(--md3-transition-fast);
  white-space: nowrap;
}

.filter-chip:hover {
  background: var(--md3-surface-container-high);
}

.filter-chip--active {
  background: var(--md3-primary-container);
  color: var(--md3-on-primary-container);
  font-weight: var(--md3-weight-semibold);
}

.filter-chip--active:hover {
  background: var(--md3-primary-container);
  filter: brightness(0.96);
}

.chip-icon {
  font-size: 0.875rem;
  line-height: 1;
}

/* A/L active chip colors */
.chip-al-laxative {
  background: var(--md3-primary-container);
  color: var(--md3-on-primary-container);
}

.chip-al-astringent {
  background: var(--md3-secondary-container);
  color: var(--md3-on-secondary-container);
}

.chip-al-neutral {
  background: var(--md3-surface-container-high);
  color: var(--md3-on-surface);
}

/* ─── Reset button ─────────────────────────────────────────────────────── */
.reset-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  align-self: flex-start;
  padding: 0.45rem 1rem;
  background: var(--md3-surface-container-high);
  border: none;
  border-radius: var(--md3-rounded-full);
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-md);
  font-weight: var(--md3-weight-medium);
  color: var(--md3-on-surface-variant);
  cursor: pointer;
  transition: background var(--md3-transition-fast);
}

.reset-btn:hover {
  background: var(--md3-surface-container-highest);
}

.reset-btn .material-symbols-outlined {
  font-size: 1rem;
}

/* ─── Cache banner ─────────────────────────────────────────────────────── */
.cache-banner {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: var(--md3-tertiary-container);
  border-radius: var(--md3-rounded-md);
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-sm);
  color: var(--md3-on-tertiary-container);
}

.cache-banner .material-symbols-outlined {
  font-size: 1.125rem;
  flex-shrink: 0;
}

/* ─── Error state ──────────────────────────────────────────────────────── */
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 3rem 1rem;
  text-align: center;
}

.error-icon {
  font-size: 3rem;
  color: var(--md3-error);
}

.error-message {
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-md);
  color: var(--md3-on-surface-variant);
  margin: 0;
}

/* ─── Empty state ──────────────────────────────────────────────────────── */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 4rem 1rem;
  text-align: center;
}

.empty-icon {
  font-size: 3.5rem;
  color: var(--md3-outline-variant);
}

.empty-title {
  font-family: var(--md3-font-headline);
  font-size: var(--md3-headline-sm);
  font-weight: var(--md3-weight-semibold);
  color: var(--md3-on-surface);
  margin: 0;
}

.empty-body {
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-md);
  color: var(--md3-on-surface-variant);
  margin: 0;
}

/* ─── CTA button (shared by error + empty states) ─────────────────────── */
.cta-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: var(--md3-primary);
  color: var(--md3-on-primary);
  border: none;
  border-radius: var(--md3-rounded-full);
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-lg);
  font-weight: var(--md3-weight-semibold);
  cursor: pointer;
  transition: background var(--md3-transition-fast);
  margin-top: 0.5rem;
}

.cta-btn:hover {
  background: var(--md3-primary-dim);
}

.cta-btn .material-symbols-outlined {
  font-size: 1.125rem;
}

/* ─── Skeleton ─────────────────────────────────────────────────────────── */
.skeleton-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1rem;
}

.skeleton-card {
  height: 130px;
  background: linear-gradient(
    90deg,
    var(--md3-surface-container-low) 25%,
    var(--md3-surface-container) 50%,
    var(--md3-surface-container-low) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
  border-radius: var(--md3-rounded-lg);
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* ─── Food grid ────────────────────────────────────────────────────────── */
.food-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1.25rem;
}

/* ─── Food card ────────────────────────────────────────────────────────── */
.food-card {
  background: var(--md3-surface-container-lowest);
  border-radius: var(--md3-rounded-lg);
  padding: var(--md3-space-4);
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
  box-shadow: var(--md3-shadow-ambient);
  transition: box-shadow var(--md3-transition-normal), transform var(--md3-transition-normal);
}

.food-card:hover {
  box-shadow: var(--md3-shadow-elevated);
  transform: translateY(-2px);
}

/* Needs-validation: subtle surface shift instead of a border */
.food-card--needs-validation {
  background: var(--md3-surface-container-low);
}

/* ─── Card header ──────────────────────────────────────────────────────── */
.card-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.food-name {
  flex: 1;
  font-family: var(--md3-font-headline);
  font-size: var(--md3-title-md);
  font-weight: var(--md3-weight-semibold);
  color: var(--md3-on-surface);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ─── Allergen chip ────────────────────────────────────────────────────── */
.allergen-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  background: var(--md3-error-container);
  border-radius: var(--md3-rounded-full);
  color: var(--md3-on-error-container);
}

.allergen-chip .material-symbols-outlined {
  font-size: 0.875rem;
}

/* ─── A/L badge ────────────────────────────────────────────────────────── */
.al-badge {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: var(--md3-rounded-full);
}

.al-badge-icon {
  font-size: 0.9rem;
  line-height: 1;
}

.badge-astringent {
  background: var(--md3-secondary-container);
  color: var(--md3-on-secondary-container);
}

.badge-laxative {
  background: var(--md3-primary-container);
  color: var(--md3-on-primary-container);
}

.badge-neutral {
  background: var(--md3-surface-container-high);
  color: var(--md3-on-surface-variant);
}

/* ─── Card meta ────────────────────────────────────────────────────────── */
.card-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
  align-items: center;
}

/* ─── Group chip ───────────────────────────────────────────────────────── */
.group-chip {
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-sm);
  font-weight: var(--md3-weight-semibold);
  padding: 0.2rem 0.625rem;
  border-radius: var(--md3-rounded-full);
  white-space: nowrap;
  text-transform: uppercase;
  letter-spacing: var(--md3-label-tracking);
  /* default — overridden by group-specific modifier */
  background: var(--md3-surface-container);
  color: var(--md3-on-surface-variant);
}

.group-chip--fruit {
  background: var(--md3-group-fruit);
  color: var(--md3-group-fruit-on);
}

.group-chip--vegetable {
  background: var(--md3-group-vegetable);
  color: var(--md3-group-vegetable-on);
}

.group-chip--protein {
  background: var(--md3-group-protein);
  color: var(--md3-group-protein-on);
}

.group-chip--cereal {
  background: var(--md3-group-cereal);
  color: var(--md3-group-cereal-on);
}

.group-chip--fat {
  background: var(--md3-group-fat);
  color: var(--md3-group-fat-on);
}

/* ─── Age chip ─────────────────────────────────────────────────────────── */
.age-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-sm);
  font-weight: var(--md3-weight-semibold);
  padding: 0.2rem 0.625rem;
  border-radius: var(--md3-rounded-full);
  background: var(--md3-surface-container-low);
  color: var(--md3-primary);
  white-space: nowrap;
}

.age-icon {
  font-size: 0.75rem;
  line-height: 1;
}

/* ─── Validation chip ──────────────────────────────────────────────────── */
.validation-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  background: var(--md3-tertiary-container);
  border-radius: var(--md3-rounded-full);
  color: var(--md3-on-tertiary-container);
}

.validation-chip .material-symbols-outlined {
  font-size: 0.8rem;
}

/* ─── Food description ─────────────────────────────────────────────────── */
.food-description {
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-sm);
  color: var(--md3-on-surface-variant);
  line-height: var(--md3-body-line-height);
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* ─── Load more ────────────────────────────────────────────────────────── */
.load-more-wrapper {
  display: flex;
  justify-content: center;
  padding-top: 1rem;
}

.load-more-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 2rem;
  background: var(--md3-surface-container-lowest);
  border: none;
  border-radius: var(--md3-rounded-full);
  box-shadow: var(--md3-shadow-card);
  color: var(--md3-primary);
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-lg);
  font-weight: var(--md3-weight-semibold);
  cursor: pointer;
  transition:
    box-shadow var(--md3-transition-fast),
    background var(--md3-transition-fast);
}

.load-more-btn:hover {
  background: var(--md3-surface-container-low);
  box-shadow: var(--md3-shadow-ambient);
}

.load-more-btn .material-symbols-outlined {
  font-size: 1.25rem;
}

/* ─── Loading more ─────────────────────────────────────────────────────── */
.loading-more {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-sm);
  color: var(--md3-on-surface-variant);
  padding: 1rem;
}

.loading-icon {
  font-size: 1.125rem;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ─── Responsive ───────────────────────────────────────────────────────── */
@media (max-width: 640px) {
  .food-search-page {
    padding: 1rem 0.75rem 3rem;
    gap: 1.5rem;
  }

  .page-title {
    font-size: var(--md3-headline-sm);
  }

  .filters-container {
    padding: 1rem;
  }

  .food-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .food-card {
    padding: 1rem;
  }
}
</style>
