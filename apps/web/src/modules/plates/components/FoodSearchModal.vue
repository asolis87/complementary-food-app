<template>
  <!-- Backdrop -->
  <teleport to="body">
    <transition name="backdrop-fade">
      <div
        v-if="isOpen"
        class="modal-backdrop"
        aria-hidden="true"
        @click="emit('close')"
      />
    </transition>

    <!-- Bottom sheet / modal -->
    <transition name="sheet-slide">
      <div
        v-if="isOpen"
        class="modal-sheet"
        role="dialog"
        :aria-label="`Agregar alimentos a ${groupLabel}`"
        aria-modal="true"
      >
        <!-- Drag handle (mobile) -->
        <div class="drag-handle" aria-hidden="true" />

        <!-- Header -->
        <div class="modal-header" :style="{ borderColor: groupColor }">
          <div class="header-left">
            <span class="header-icon" aria-hidden="true">{{ groupIcon }}</span>
            <div>
              <h2 class="header-title" :style="{ color: groupColor }">
                {{ groupLabel }}
                <span v-if="currentItems.length > 0" class="header-current-food"> — {{ currentItems[0].food.name }}</span>
              </h2>
              <p class="header-subtitle">
                {{ currentItems.length > 0 ? 'Tocá otro para reemplazarlo' : 'Elegí un alimento' }}
              </p>
            </div>
          </div>
          <button
            class="close-btn"
            aria-label="Cerrar"
            @click="emit('close')"
          >
            ×
          </button>
        </div>

        <!-- Search bar -->
        <div class="search-bar">
          <span class="search-icon" aria-hidden="true">🔍</span>
          <input
            ref="searchInputRef"
            v-model="rawQuery"
            type="search"
            class="search-input"
            :placeholder="`Buscar en ${groupLabel}...`"
            :aria-label="`Buscar alimentos en ${groupLabel}`"
            autocomplete="off"
            @input="onInput"
          />
          <button
            v-if="rawQuery"
            class="clear-btn"
            aria-label="Limpiar búsqueda"
            @click="clearSearch"
          >
            ×
          </button>
        </div>

        <!-- Scrollable food list -->
        <div class="food-list-container" role="region" aria-label="Lista de alimentos">

          <!-- Current food section — only ONE per zone -->
          <div v-if="currentItems.length > 0" class="section-block">
            <p class="section-label">✓ Seleccionado</p>
            <ul class="food-list" role="list">
              <li
                class="food-item food-item-added"
              >
                <span class="al-badge" :class="alBadgeClass(currentItems[0].food.alClassification)">
                  {{ alBadgeLabel(currentItems[0].food.alClassification) }}
                </span>
                <span class="food-info">
                  <span class="food-name">{{ currentItems[0].food.name }}</span>
                  <span class="food-meta">
                    <span v-if="currentItems[0].food.isAllergen" class="allergen-warning">⚠️ Alérgeno</span>
                    <span class="age-rec">≥ {{ currentItems[0].food.ageMonths }}m</span>
                  </span>
                </span>
                <span class="added-badge">✓ Seleccionado</span>
                <button
                  class="remove-btn"
                  :aria-label="`Quitar ${currentItems[0].food.name}`"
                  @click="emit('removeFood', currentItems[0].id)"
                >
                  −
                </button>
              </li>
            </ul>
          </div>

          <!-- Divider -->
          <div v-if="currentItems.length > 0 && availableFoods.length > 0" class="list-divider" />

          <!-- Loading -->
          <div v-if="loading" class="search-state">
            <span class="spinner" aria-hidden="true" />
            <span>Buscando...</span>
          </div>

          <!-- No results -->
          <div
            v-else-if="debouncedQuery && availableFoods.length === 0 && currentItems.length === 0"
            class="search-state"
            role="status"
          >
            Sin resultados para "{{ debouncedQuery }}"
          </div>

          <div
            v-else-if="debouncedQuery && availableFoods.length === 0 && currentItems.length > 0"
            class="search-state small"
            role="status"
          >
            Sin más resultados para "{{ debouncedQuery }}"
          </div>

          <!-- Available foods -->
          <div v-if="availableFoods.length > 0" class="section-block">
            <p v-if="currentItems.length > 0" class="section-label">Reemplazar con…</p>
            <ul class="food-list" role="list">
              <li
                v-for="food in availableFoods"
                :key="food.id"
                class="food-item"
              >
                <button
                  class="food-btn"
                  :title="currentItems.length > 0 ? `Reemplazar con ${food.name}` : `Agregar ${food.name} al plato`"
                  :aria-label="currentItems.length > 0 ? `Reemplazar con ${food.name}` : `Agregar ${food.name} al plato`"
                  @click="onAddFood(food)"
                >
                  <span class="al-badge" :class="alBadgeClass(food.alClassification)">
                    {{ alBadgeLabel(food.alClassification) }}
                  </span>
                  <span class="food-info">
                    <span class="food-name">{{ food.name }}</span>
                    <span class="food-meta">
                      <span v-if="food.isAllergen" class="allergen-warning">⚠️ Alérgeno</span>
                      <span class="age-rec">≥ {{ food.ageMonths }}m</span>
                    </span>
                  </span>
                  <span class="add-icon" aria-hidden="true" :style="{ background: groupColor }">{{ currentItems.length > 0 ? '⇄' : '+' }}</span>
                </button>
              </li>
            </ul>
          </div>

          <!-- Hint when list is large -->
          <p v-if="!debouncedQuery && groupFoods.length > MAX_VISIBLE" class="hint">
            Escribí para filtrar {{ groupFoods.length }} alimentos
          </p>
        </div>

        <!-- Confirmation toast inside modal -->
        <transition name="toast">
          <div v-if="addedToast" class="modal-toast" role="status">
            ✓ {{ addedToast }}
          </div>
        </transition>
      </div>
    </transition>
  </teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import type { Food, FoodGroup, ALClassification } from '@cfa/shared'
import { FOOD_GROUP_LABELS } from '@cfa/shared'
import type { PlateItemDraft } from '@/shared/stores/plateStore.js'

const MAX_VISIBLE = 30
const DEBOUNCE_MS = 300

const props = defineProps<{
  isOpen: boolean
  group: FoodGroup
  groupFoods: Food[]      // all foods for this group (pre-filtered by parent)
  currentItems: PlateItemDraft[]  // items already assigned to this group in the draft
  loading?: boolean
}>()

const emit = defineEmits<{
  close: []
  addFood: [food: Food, group: FoodGroup]
  removeFood: [itemId: string]
  search: [query: string]
}>()

// ─── Group metadata ───────────────────────────────────────────────────────────

const GROUP_COLORS: Record<FoodGroup, string> = {
  FRUIT: '#F59E0B',
  VEGETABLE: '#10B981',
  PROTEIN: '#F43F5E',
  CEREAL_TUBER: '#D97706',
  HEALTHY_FAT: '#8B5CF6',
}

const GROUP_ICONS: Record<FoodGroup, string> = {
  FRUIT: '🍎',
  VEGETABLE: '🥦',
  PROTEIN: '🥩',
  CEREAL_TUBER: '🌽',
  HEALTHY_FAT: '🥑',
}

const groupLabel = computed(() => FOOD_GROUP_LABELS[props.group])
const groupColor = computed(() => GROUP_COLORS[props.group])
const groupIcon = computed(() => GROUP_ICONS[props.group])

// ─── Search ───────────────────────────────────────────────────────────────────

const searchInputRef = ref<HTMLInputElement | null>(null)
const rawQuery = ref('')
const debouncedQuery = ref('')
let debounceTimer: ReturnType<typeof setTimeout> | null = null

function onInput() {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    debouncedQuery.value = rawQuery.value.trim()
    emit('search', debouncedQuery.value)
  }, DEBOUNCE_MS)
}

function clearSearch() {
  rawQuery.value = ''
  debouncedQuery.value = ''
  searchInputRef.value?.focus()
}

// Reset search when group changes or modal opens/closes
watch([() => props.group, () => props.isOpen], () => {
  rawQuery.value = ''
  debouncedQuery.value = ''
})

// Auto-focus when opened
watch(
  () => props.isOpen,
  async (open) => {
    if (open) {
      await nextTick()
      searchInputRef.value?.focus()
    }
  },
)

// ─── Food lists ───────────────────────────────────────────────────────────────

/** IDs already added to this group */
const addedIds = computed(() => new Set(props.currentItems.map((i) => i.food.id)))

/**
 * Foods available to add (not yet in this group's draft items).
 * groupFoods is already filtered by the API (group + search query),
 * so we only need to exclude items already added to the draft.
 */
const availableFoods = computed(() => {
  const pool = props.groupFoods.filter((f) => !addedIds.value.has(f.id))
  return pool.slice(0, MAX_VISIBLE)
})

// ─── Add food with micro toast ────────────────────────────────────────────────

const addedToast = ref<string | null>(null)
let toastTimer: ReturnType<typeof setTimeout> | null = null

function onAddFood(food: Food) {
  emit('addFood', food, props.group)

  // Show confirmation toast inside modal
  if (toastTimer) clearTimeout(toastTimer)
  addedToast.value = food.name
  toastTimer = setTimeout(() => {
    addedToast.value = null
  }, 1600)
}

// ─── A/L badge helpers ────────────────────────────────────────────────────────

function alBadgeClass(al: ALClassification): string {
  switch (al) {
    case 'ASTRINGENT': return 'badge-astringent'
    case 'LAXATIVE': return 'badge-laxative'
    default: return 'badge-neutral'
  }
}

function alBadgeLabel(al: ALClassification): string {
  switch (al) {
    case 'ASTRINGENT': return 'A'
    case 'LAXATIVE': return 'L'
    default: return 'N'
  }
}
</script>

<style scoped>
/* ─── Backdrop ─────────────────────────────────────────────────────────────── */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 200;
}

/* ─── Bottom sheet ─────────────────────────────────────────────────────────── */
.modal-sheet {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 201;
  background: white;
  border-radius: 1.25rem 1.25rem 0 0;
  max-height: 72vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 -4px 32px rgba(0, 0, 0, 0.18);
  overflow: hidden;
}

/* Desktop: centered modal */
@media (min-width: 768px) {
  .modal-sheet {
    bottom: auto;
    top: 50%;
    left: 50%;
    right: auto;
    transform: translate(-50%, -50%);
    width: 520px;
    max-width: calc(100vw - 2rem);
    border-radius: 1.25rem;
    max-height: 80vh;
  }
}

/* ─── Drag handle ──────────────────────────────────────────────────────────── */
.drag-handle {
  width: 40px;
  height: 4px;
  background: #d1d5db;
  border-radius: 9999px;
  margin: 0.75rem auto 0;
  flex-shrink: 0;
}

@media (min-width: 768px) {
  .drag-handle {
    display: none;
  }
}

/* ─── Header ───────────────────────────────────────────────────────────────── */
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.875rem 1rem 0.75rem;
  border-bottom: 2px solid #f3f4f6;
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.header-icon {
  font-size: 1.75rem;
  line-height: 1;
}

.header-title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
}

.header-current-food {
  font-weight: 500;
  opacity: 0.75;
  font-size: 0.95rem;
}

.header-subtitle {
  margin: 0.1rem 0 0;
  font-size: 0.75rem;
  color: #9ca3af;
}

.close-btn {
  background: #f3f4f6;
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  cursor: pointer;
  font-size: 1.25rem;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  transition: background 0.15s;
  flex-shrink: 0;
}

.close-btn:hover {
  background: #e5e7eb;
}

/* ─── Search bar ───────────────────────────────────────────────────────────── */
.search-bar {
  position: relative;
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #f3f4f6;
  flex-shrink: 0;
}

.search-icon {
  position: absolute;
  left: 1.75rem;
  font-size: 0.9rem;
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 0.6rem 2.5rem 0.6rem 2.25rem;
  border: 2px solid #e5e7eb;
  border-radius: 0.75rem;
  font-size: 0.9rem;
  outline: none;
  transition: border-color 0.15s;
  background: #f9fafb;
}

.search-input:focus {
  border-color: #10b981;
  background: white;
}

.search-input::-webkit-search-cancel-button {
  display: none;
}

.clear-btn {
  position: absolute;
  right: 1.6rem;
  background: #e5e7eb;
  border: none;
  border-radius: 9999px;
  width: 20px;
  height: 20px;
  cursor: pointer;
  font-size: 1rem;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
}

/* ─── Food list ────────────────────────────────────────────────────────────── */
.food-list-container {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem 0;
  scrollbar-width: thin;
  scrollbar-color: #e5e7eb transparent;
  position: relative;
}

.section-block {
  padding: 0 1rem;
}

.section-label {
  margin: 0.5rem 0 0.25rem;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #9ca3af;
}

.list-divider {
  height: 1px;
  background: #f3f4f6;
  margin: 0.5rem 0;
}

.food-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.food-item {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.55rem 0.75rem;
  border-radius: 0.75rem;
}

/* Added items row */
.food-item-added {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
}

/* Available food button */
.food-btn {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  width: 100%;
  padding: 0.55rem 0.75rem;
  background: #f9fafb;
  border: 1px solid transparent;
  border-radius: 0.75rem;
  cursor: pointer;
  text-align: left;
  transition: all 0.12s;
}

.food-btn:hover {
  background: #f3f4f6;
  border-color: #e5e7eb;
}

.food-btn:active {
  transform: scale(0.98);
}

/* ─── A/L Badge ────────────────────────────────────────────────────────────── */
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

/* ─── Food info ────────────────────────────────────────────────────────────── */
.food-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  overflow: hidden;
}

.food-name {
  font-size: 0.875rem;
  font-weight: 500;
  color: #111827;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.food-meta {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  font-size: 0.7rem;
  color: #9ca3af;
}

.allergen-warning {
  color: #f59e0b;
  font-weight: 600;
}

.age-rec {
  color: #9ca3af;
}

/* ─── Added badge & remove ─────────────────────────────────────────────────── */
.added-badge {
  flex-shrink: 0;
  font-size: 0.7rem;
  font-weight: 600;
  color: #10b981;
  white-space: nowrap;
}

.remove-btn {
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: none;
  background: #fee2e2;
  color: #ef4444;
  font-size: 1.1rem;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.15s;
}

.remove-btn:hover {
  background: #fecaca;
}

/* ─── Add icon ─────────────────────────────────────────────────────────────── */
.add-icon {
  flex-shrink: 0;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
  font-weight: 300;
  line-height: 1;
}

/* ─── Empty / search states ────────────────────────────────────────────────── */
.search-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1.5rem 1rem;
  color: #9ca3af;
  font-size: 0.875rem;
}

.search-state.small {
  padding: 0.75rem 1rem;
  font-size: 0.8rem;
}

.spinner {
  width: 18px;
  height: 18px;
  border: 2px solid #e5e7eb;
  border-top-color: #10b981;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.hint {
  margin: 0.5rem 1rem;
  font-size: 0.75rem;
  color: #9ca3af;
  text-align: center;
}

/* ─── Modal confirmation toast ─────────────────────────────────────────────── */
.modal-toast {
  position: absolute;
  bottom: 1rem;
  left: 50%;
  transform: translateX(-50%);
  background: #10b981;
  color: white;
  padding: 0.5rem 1.25rem;
  border-radius: 9999px;
  font-size: 0.85rem;
  font-weight: 600;
  white-space: nowrap;
  box-shadow: 0 2px 12px rgba(16, 185, 129, 0.4);
  z-index: 10;
  pointer-events: none;
}

/* ─── Transitions ──────────────────────────────────────────────────────────── */
.backdrop-fade-enter-active,
.backdrop-fade-leave-active {
  transition: opacity 0.2s ease;
}
.backdrop-fade-enter-from,
.backdrop-fade-leave-to {
  opacity: 0;
}

/* Mobile: slide up from bottom */
.sheet-slide-enter-active,
.sheet-slide-leave-active {
  transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease;
}
.sheet-slide-enter-from,
.sheet-slide-leave-to {
  transform: translateY(100%);
  opacity: 0;
}

/* Desktop: fade + slight scale */
@media (min-width: 768px) {
  .sheet-slide-enter-from,
  .sheet-slide-leave-to {
    transform: translate(-50%, -44%);
    opacity: 0;
  }
  .sheet-slide-enter-active,
  .sheet-slide-leave-active {
    transform-origin: center;
  }
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.2s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(6px);
}
</style>
