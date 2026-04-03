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
            <span class="material-symbols-outlined header-icon" aria-hidden="true">{{ groupIcon }}</span>
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
          <span class="material-symbols-outlined search-icon" aria-hidden="true">search</span>
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
                :class="{ 'food-item-allergen-warning': hasAllergenReactionWarning(currentItems[0].food) }"
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
                  <!-- History pill for selected food -->
                  <span v-if="historyLoading" class="history-pill history-pill-skeleton" aria-hidden="true" />
                  <template v-else-if="pillInfo(currentItems[0].food.id)">
                    <span class="history-pill" :class="pillInfo(currentItems[0].food.id)!.cssClass">
                      {{ pillInfo(currentItems[0].food.id)!.text }}
                    </span>
                  </template>
                  <span
                    v-if="hasAllergenReactionWarning(currentItems[0].food)"
                    class="allergen-reaction-warning"
                  >⚠️ Alérgeno · reacción registrada</span>
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
                  :class="{ 'food-btn-allergen-warning': hasAllergenReactionWarning(food) }"
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
                    <!-- History pill -->
                    <span v-if="historyLoading" class="history-pill history-pill-skeleton" aria-hidden="true" />
                    <template v-else-if="pillInfo(food.id)">
                      <span class="history-pill" :class="pillInfo(food.id)!.cssClass">
                        {{ pillInfo(food.id)!.text }}
                      </span>
                    </template>
                    <span
                      v-if="hasAllergenReactionWarning(food)"
                      class="allergen-reaction-warning"
                    >⚠️ Alérgeno · reacción registrada</span>
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
import type { Food, FoodGroup, ALClassification, FoodHistoryMap, FoodHistory } from '@pakulab/shared'
import { FOOD_GROUP_LABELS, ReactionType } from '@pakulab/shared'
import type { PlateItemDraft } from '@/shared/stores/plateStore.js'

const MAX_VISIBLE = 30
const DEBOUNCE_MS = 300

const props = defineProps<{
  isOpen: boolean
  group: FoodGroup
  groupFoods: Food[]      // all foods for this group (pre-filtered by parent)
  currentItems: PlateItemDraft[]  // items already assigned to this group in the draft
  loading?: boolean
  /** Optional food history map keyed by foodId — graceful degradation when absent */
  foodHistories?: FoodHistoryMap
  /** True while history is being fetched — shows skeleton pill */
  historyLoading?: boolean
}>()

const emit = defineEmits<{
  close: []
  addFood: [food: Food, group: FoodGroup]
  removeFood: [itemId: string]
  search: [query: string]
}>()

// ─── Group metadata ───────────────────────────────────────────────────────────

// Colors match MD3 food group tokens "-on" variants for text contrast
const GROUP_COLORS: Record<FoodGroup, string> = {
  FRUIT: '#6e391a',       // --md3-group-fruit-on
  VEGETABLE: '#004d36',   // --md3-group-vegetable-on
  PROTEIN: '#6e391a',     // --md3-group-protein-on
  CEREAL_TUBER: '#004d36', // --md3-group-cereal-on
  HEALTHY_FAT: '#3b1f8c', // --md3-group-fat-on
}

// Material Symbols Outlined icon names
const GROUP_ICONS: Record<FoodGroup, string> = {
  FRUIT: 'nutrition',
  VEGETABLE: 'eco',
  PROTEIN: 'egg',
  CEREAL_TUBER: 'bakery_dining',
  HEALTHY_FAT: 'water_drop',
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

// ─── History pill helpers ─────────────────────────────────────────────────────

/** Derived pill data — text + CSS modifier class. Null = no pill to render. */
interface PillInfo {
  text: string
  cssClass: string
}

/**
 * Returns the Spanish label for the most severe reaction present.
 * Severity order: ALLERGIC > RASH > GAS > DISLIKED
 */
function mostSevereReactionLabel(h: FoodHistory): string {
  if (h.reactions.includes(ReactionType.ALLERGIC)) return 'tuvo reacción alérgica'
  if (h.reactions.includes(ReactionType.RASH)) return 'tuvo sarpullido'
  if (h.reactions.includes(ReactionType.GAS)) return 'gases'
  if (h.reactions.includes(ReactionType.DISLIKED)) return 'no le gustó'
  return ''
}

/** Pluralises: "1 vez" / "N veces" */
function timesLabel(n: number): string {
  return n === 1 ? '1 vez' : `${n} veces`
}

/**
 * Returns pill text + CSS class for a food row.
 * Returns null when no history data is available (graceful degradation, AC: A6).
 */
function pillInfo(foodId: string): PillInfo | null {
  if (!props.foodHistories) return null
  const h: FoodHistory | undefined = props.foodHistories[foodId]
  if (!h) return null

  if (h.timesOffered === 0) {
    return { text: 'Nunca ofrecido', cssClass: 'history-pill-never' }
  }

  const t = timesLabel(h.timesOffered)

  if (h.hasAllergyReaction) {
    return { text: `${t} · ${mostSevereReactionLabel(h)}`, cssClass: 'history-pill-red' }
  }

  if (h.reactions.length === 0) {
    return { text: `${t} · sin reacciones`, cssClass: 'history-pill-clean' }
  }

  // DISLIKED / GAS → amber; LIKED / NEUTRAL only → green
  if (h.reactions.some((r) => r === ReactionType.GAS || r === ReactionType.DISLIKED)) {
    return { text: `${t} · ${mostSevereReactionLabel(h)}`, cssClass: 'history-pill-amber' }
  }

  return { text: `${t} · sin reacciones`, cssClass: 'history-pill-clean' }
}

/**
 * True when food row should display a prominent allergen+reaction warning border.
 * Condition: food.isAllergen AND history.hasAllergyReaction (AC: A5)
 */
function hasAllergenReactionWarning(food: Food): boolean {
  if (!food.isAllergen) return false
  const h = props.foodHistories?.[food.id]
  return !!(h && h.hasAllergyReaction)
}
</script>

<style scoped>
/* ─── Backdrop ─────────────────────────────────────────────────────────────── */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(11, 15, 15, 0.55); /* --md3-inverse-surface at ~55% */
  z-index: 200;
}

/* ─── Bottom sheet ─────────────────────────────────────────────────────────── */
.modal-sheet {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 201;
  background: var(--md3-surface-container-lowest);
  border-radius: var(--md3-rounded-lg) var(--md3-rounded-lg) 0 0;
  max-height: 72vh;
  display: flex;
  flex-direction: column;
  box-shadow: var(--md3-shadow-ambient);
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
    border-radius: var(--md3-rounded-lg);
    max-height: 80vh;
  }
}

/* ─── Drag handle ──────────────────────────────────────────────────────────── */
.drag-handle {
  width: 40px;
  height: 4px;
  background: var(--md3-outline-variant);
  border-radius: var(--md3-rounded-full);
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
  padding: 0.875rem var(--md3-space-3) 0.75rem;
  border-bottom: 2px solid var(--md3-surface-container);
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
  font-family: var(--md3-font-headline);
  font-size: var(--md3-title-md);
  font-weight: var(--md3-weight-bold);
}

.header-current-food {
  font-weight: var(--md3-weight-medium);
  opacity: 0.75;
  font-size: var(--md3-body-md);
}

.header-subtitle {
  margin: 0.1rem 0 0;
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-sm);
  color: var(--md3-on-surface-variant);
}

.close-btn {
  background: var(--md3-surface-container);
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
  color: var(--md3-on-surface-variant);
  transition: background var(--md3-transition-fast);
  flex-shrink: 0;
}

.close-btn:hover {
  background: var(--md3-surface-container-high);
}

/* ─── Search bar ───────────────────────────────────────────────────────────── */
.search-bar {
  position: relative;
  display: flex;
  align-items: center;
  padding: 0.75rem var(--md3-space-3);
  border-bottom: 1px solid var(--md3-surface-container);
  flex-shrink: 0;
}

.search-icon {
  position: absolute;
  left: 1.75rem;
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
  outline: none;
  transition: border-color var(--md3-transition-fast), background var(--md3-transition-fast);
  background: var(--md3-surface-container-low);
}

.search-input:focus {
  border-color: var(--md3-primary);
  background: var(--md3-surface-container-lowest);
}

.search-input::-webkit-search-cancel-button {
  display: none;
}

.clear-btn {
  position: absolute;
  right: 1.6rem;
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

/* ─── Food list ────────────────────────────────────────────────────────────── */
.food-list-container {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem 0;
  scrollbar-width: thin;
  scrollbar-color: var(--md3-outline-variant) transparent;
  position: relative;
}

.section-block {
  padding: 0 var(--md3-space-3);
}

.section-label {
  margin: 0.5rem 0 0.25rem;
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-sm);
  font-weight: var(--md3-weight-bold);
  text-transform: uppercase;
  letter-spacing: var(--md3-label-tracking);
  color: var(--md3-on-surface-variant);
}

.list-divider {
  height: 1px;
  background: var(--md3-surface-container);
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
  border-radius: var(--md3-rounded-md);
}

/* Added items row */
.food-item-added {
  background: var(--md3-primary-container);
  border: 1px solid var(--md3-on-primary-container);
}

/* Available food button */
.food-btn {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  width: 100%;
  padding: 0.55rem 0.75rem;
  background: var(--md3-surface-container-low);
  border: 1px solid transparent;
  border-radius: var(--md3-rounded-md);
  cursor: pointer;
  text-align: left;
  transition: all var(--md3-transition-fast);
}

.food-btn:hover {
  background: var(--md3-surface-container);
  border-color: var(--md3-outline-variant);
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
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-sm);
  font-weight: var(--md3-weight-bold);
  color: var(--md3-surface-container-lowest);
}

.badge-astringent { background: var(--md3-error); }
.badge-laxative   { background: var(--md3-primary); }
.badge-neutral    { background: var(--md3-outline); }

/* ─── Food info ────────────────────────────────────────────────────────────── */
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

.age-rec {
  color: var(--md3-on-surface-variant);
}

/* ─── Added badge & remove ─────────────────────────────────────────────────── */
.added-badge {
  flex-shrink: 0;
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-sm);
  font-weight: var(--md3-weight-semibold);
  color: var(--md3-on-primary-container);
  white-space: nowrap;
}

.remove-btn {
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: none;
  background: var(--md3-error-container);
  color: var(--md3-on-error-container);
  font-size: 1.1rem;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background var(--md3-transition-fast);
}

.remove-btn:hover {
  background: var(--md3-error);
  color: var(--md3-on-error);
}

/* ─── Add icon ─────────────────────────────────────────────────────────────── */
.add-icon {
  flex-shrink: 0;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  color: var(--md3-surface-container-lowest);
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
  padding: 1.5rem var(--md3-space-3);
  font-family: var(--md3-font-body);
  color: var(--md3-on-surface-variant);
  font-size: var(--md3-body-md);
}

.search-state.small {
  padding: 0.75rem var(--md3-space-3);
  font-size: var(--md3-body-sm);
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
  to { transform: rotate(360deg); }
}

.hint {
  margin: 0.5rem var(--md3-space-3);
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-sm);
  color: var(--md3-on-surface-variant);
  text-align: center;
}

/* ─── Modal confirmation toast ─────────────────────────────────────────────── */
.modal-toast {
  position: absolute;
  bottom: 1rem;
  left: 50%;
  transform: translateX(-50%);
  background: var(--md3-primary);
  color: var(--md3-on-primary);
  padding: 0.5rem 1.25rem;
  border-radius: var(--md3-rounded-full);
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-lg);
  font-weight: var(--md3-weight-semibold);
  white-space: nowrap;
  box-shadow: var(--md3-shadow-elevated);
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

/* ─── Food history pills ────────────────────────────────────────────────────── */
.history-pill {
  display: inline-flex;
  align-items: center;
  padding: 0.1rem 0.45rem;
  border-radius: var(--md3-rounded-full);
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-sm);
  font-weight: var(--md3-weight-medium);
  line-height: 1.4;
  white-space: nowrap;
}

/* "Nunca ofrecido" — muted blue/gray (secondary-container) */
.history-pill-never {
  background: var(--md3-secondary-container);
  color: var(--md3-on-secondary-container);
}

/* "X veces · sin reacciones" — green (primary-container) */
.history-pill-clean {
  background: var(--md3-primary-container);
  color: var(--md3-on-primary-container);
}

/* "X veces · gases / no le gustó" — amber (tertiary-container) */
.history-pill-amber {
  background: var(--md3-tertiary-container);
  color: var(--md3-on-tertiary-container);
}

/* "X veces · tuvo reacción alérgica / sarpullido" — red (error-container) */
.history-pill-red {
  background: var(--md3-error-container);
  color: var(--md3-on-error-container);
}

/* Skeleton placeholder while loading */
.history-pill-skeleton {
  display: inline-block;
  width: 6rem;
  height: 1rem;
  background: var(--md3-surface-container-high);
  border-radius: var(--md3-rounded-full);
  animation: skeleton-pulse 1.2s ease-in-out infinite;
}

@keyframes skeleton-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

/* Allergen + allergy reaction warning text */
.allergen-reaction-warning {
  color: var(--md3-error);
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-sm);
  font-weight: var(--md3-weight-semibold);
}

/* Food button with prominent allergen+reaction highlight */
.food-btn-allergen-warning {
  border-color: var(--md3-error) !important;
  background: color-mix(in srgb, var(--md3-error-container) 30%, var(--md3-surface-container-low));
}

.food-btn-allergen-warning:hover {
  background: color-mix(in srgb, var(--md3-error-container) 50%, var(--md3-surface-container));
}

/* Selected (added) item with allergen+reaction highlight — red left border tint */
.food-item-allergen-warning {
  border-left: 3px solid var(--md3-error) !important;
  background: color-mix(in srgb, var(--md3-error-container) 40%, var(--md3-primary-container));
}
</style>
