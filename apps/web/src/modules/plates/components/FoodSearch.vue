<template>
  <div class="food-search">
    <!-- Search input -->
    <div class="search-bar">
      <span class="material-symbols-outlined search-icon" aria-hidden="true">search</span>
      <input
        ref="inputRef"
        v-model="rawQuery"
        type="search"
        class="search-input"
        :placeholder="`Buscar en ${FOOD_GROUP_LABELS[group]}...`"
        :aria-label="`Buscar alimentos en ${FOOD_GROUP_LABELS[group]}`"
        autocomplete="off"
        @input="onInput"
      />
      <button v-if="rawQuery" class="clear-btn" aria-label="Limpiar búsqueda" @click="clearSearch">
        ×
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="search-state" aria-live="polite">
      <span class="spinner" aria-hidden="true" />
      <span>Buscando...</span>
    </div>

    <!-- Empty state (after search) -->
    <div
      v-else-if="debouncedQuery && visibleFoods.length === 0"
      class="search-state"
      role="status"
    >
      <span>Sin resultados para "{{ debouncedQuery }}"</span>
    </div>

    <!-- Food list -->
    <ul v-else class="food-list" role="list" :aria-label="`Alimentos de ${FOOD_GROUP_LABELS[group]}`">
      <li
        v-for="food in visibleFoods"
        :key="food.id"
        class="food-item"
        role="listitem"
      >
        <button
          class="food-btn"
          :title="`Agregar ${food.name} al plato`"
          :aria-label="`Agregar ${food.name} (${alBadgeLabel(food.alClassification) === 'A' ? 'Astringente' : alBadgeLabel(food.alClassification) === 'L' ? 'Laxante' : 'Neutro'}) al plato`"
          @click="emit('add', food)"
        >
          <!-- A/L badge -->
          <span class="al-badge" :class="alBadgeClass(food.alClassification)">
            {{ alBadgeLabel(food.alClassification) }}
          </span>

          <!-- Food info -->
          <span class="food-info">
            <span class="food-name">{{ food.name }}</span>
            <span class="food-meta">
              <span v-if="food.isAllergen" class="allergen-warning" title="Alérgeno potencial">
                ⚠️ Alérgeno
              </span>
              <span class="age-rec">≥ {{ food.ageMonths }}m</span>
            </span>
          </span>

          <!-- Add icon -->
          <span class="add-icon" aria-hidden="true">+</span>
        </button>
      </li>
    </ul>

    <!-- Show more hint when list is big -->
    <p v-if="!debouncedQuery && foods.length > MAX_VISIBLE" class="hint">
      Escribí para filtrar {{ foods.length }} alimentos
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Food, FoodGroup, ALClassification } from '@pakulab/shared'
import { FOOD_GROUP_LABELS } from '@pakulab/shared'

const MAX_VISIBLE = 20
const DEBOUNCE_MS = 300

const props = defineProps<{
  group: FoodGroup
  foods: Food[]
  loading?: boolean
}>()

const emit = defineEmits<{
  add: [food: Food]
}>()

const inputRef = ref<HTMLInputElement | null>(null)
const rawQuery = ref('')
const debouncedQuery = ref('')

let debounceTimer: ReturnType<typeof setTimeout> | null = null

function onInput() {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    debouncedQuery.value = rawQuery.value.trim()
  }, DEBOUNCE_MS)
}

// Reset query when group changes
watch(
  () => props.group,
  () => {
    rawQuery.value = ''
    debouncedQuery.value = ''
  },
)

function clearSearch() {
  rawQuery.value = ''
  debouncedQuery.value = ''
  inputRef.value?.focus()
}

const visibleFoods = computed(() => {
  const q = debouncedQuery.value.toLowerCase()
  const list = q
    ? props.foods.filter((f) => f.name.toLowerCase().includes(q))
    : props.foods
  return list.slice(0, MAX_VISIBLE)
})

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
.food-search {
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-2);
}

/* Search bar */
.search-bar {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 0.75rem;
  font-size: 1.1rem;
  color: var(--md3-on-surface-variant);
  pointer-events: none;
  line-height: 1;
}

.search-input {
  width: 100%;
  padding: 0.6rem 2.5rem 0.6rem 2.5rem;
  border: 2px solid var(--md3-outline-variant);
  border-radius: var(--md3-rounded-md);
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-md);
  color: var(--md3-on-surface);
  background: var(--md3-surface-container-lowest);
  outline: none;
  transition: border-color var(--md3-transition-fast);
}

.search-input:focus {
  border-color: var(--md3-primary);
}

.search-input::-webkit-search-cancel-button {
  display: none;
}

.clear-btn {
  position: absolute;
  right: 0.6rem;
  background: var(--md3-surface-container);
  border: none;
  border-radius: var(--md3-rounded-full);
  width: 20px;
  height: 20px;
  cursor: pointer;
  font-size: 1rem;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--md3-on-surface-variant);
  transition: background var(--md3-transition-fast);
}

.clear-btn:hover {
  background: var(--md3-surface-container-high);
}

/* States */
.search-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1.5rem 0;
  font-family: var(--md3-font-body);
  color: var(--md3-on-surface-variant);
  font-size: var(--md3-body-md);
}

.spinner {
  width: 18px;
  height: 18px;
  border: 2px solid var(--md3-outline-variant);
  border-top-color: var(--md3-primary);
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Food list */
.food-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  max-height: 300px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--md3-outline-variant) transparent;
}

.food-item {
  display: flex;
}

.food-btn {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  width: 100%;
  padding: 0.6rem 0.75rem;
  background: var(--md3-surface-container-low);
  border: 1px solid transparent;
  border-radius: var(--md3-rounded-md);
  cursor: pointer;
  text-align: left;
  transition: all var(--md3-transition-fast);
}

.food-btn:hover {
  background: var(--md3-primary-container);
  border-color: var(--md3-primary);
}

.food-btn:active {
  transform: scale(0.98);
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
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-sm);
  font-weight: var(--md3-weight-bold);
  color: var(--md3-surface-container-lowest);
}

.badge-astringent {
  background: var(--md3-error);
}

.badge-laxative {
  background: var(--md3-primary);
}

.badge-neutral {
  background: var(--md3-outline);
}

/* Food info */
.food-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  overflow: hidden;
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

.food-meta {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-sm);
  color: var(--md3-on-surface-variant);
}

.allergen-warning {
  color: var(--md3-tertiary);
  font-weight: var(--md3-weight-semibold);
}

.add-icon {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  background: var(--md3-primary);
  color: var(--md3-on-primary);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  font-weight: 300;
  line-height: 1;
}

.hint {
  margin: 0;
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-sm);
  color: var(--md3-on-surface-variant);
  text-align: center;
}
</style>
