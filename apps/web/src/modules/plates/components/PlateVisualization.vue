<template>
  <div class="plate-wrap">
    <!-- Outer plate container: circular (4 groups) or stadium (5 groups) -->
    <div
      class="plate-outer"
      :class="{ 'plate-outer--five': props.groupCount === 5 }"
    >
      <!-- Inner plate ring: grid of quadrants -->
      <div
        class="plate-ring"
        :class="{ 'plate-ring--five': props.groupCount === 5 }"
        role="group"
        :aria-label="plateAriaLabel"
      >
        <!-- ── FRUIT (top-left) ───────────────────────────────────────── -->
        <button
          class="segment segment-tl segment-fruit"
          :class="{ 'segment--filled': sectionHasItems('FRUIT') }"
          aria-label="Agregar alimento a Frutas"
          @click="emit('select-group', 'FRUIT')"
        >
          <div class="segment-bg">
            <img src="/images/plate/fruits.png" alt="" aria-hidden="true" class="segment-img" />
          </div>
          <span class="material-symbols-outlined segment-icon text-primary">nutrition</span>
          <span class="segment-label text-primary-dim">Frutas</span>
          <template v-if="sectionHasItems('FRUIT')">
            <span
              v-for="item in groupItems('FRUIT')"
              :key="item.id"
              class="segment-food-name"
              :class="alClass(item)"
            >
              <span class="al-dot" />
              <span class="food-name-text">{{ item.food.name }}</span>
              <span
                v-if="item.food.isAllergen"
                class="material-symbols-outlined allergen-icon"
              >warning</span>
            </span>
          </template>
          <span v-else class="segment-empty">Vacío</span>
        </button>

        <!-- ── VEGETABLE (top-right) ─────────────────────────────────── -->
        <button
          class="segment segment-tr segment-vegetable"
          :class="{ 'segment--filled': sectionHasItems('VEGETABLE') }"
          aria-label="Agregar alimento a Verduras"
          @click="emit('select-group', 'VEGETABLE')"
        >
          <div class="segment-bg">
            <img src="/images/plate/vegetables.png" alt="" aria-hidden="true" class="segment-img" />
          </div>
          <span class="material-symbols-outlined segment-icon text-tertiary">eco</span>
          <span class="segment-label text-tertiary-dim">Verduras</span>
          <template v-if="sectionHasItems('VEGETABLE')">
            <span
              v-for="item in groupItems('VEGETABLE')"
              :key="item.id"
              class="segment-food-name"
              :class="alClass(item)"
            >
              <span class="al-dot" />
              <span class="food-name-text">{{ item.food.name }}</span>
              <span
                v-if="item.food.isAllergen"
                class="material-symbols-outlined allergen-icon"
              >warning</span>
            </span>
          </template>
          <span v-else class="segment-empty">Vacío</span>
        </button>

        <!-- ── CEREAL_TUBER (bottom-left) ────────────────────────────── -->
        <button
          class="segment segment-bl segment-cereal"
          :class="{ 'segment--filled': sectionHasItems('CEREAL_TUBER') }"
          aria-label="Agregar alimento a Cereales"
          @click="emit('select-group', 'CEREAL_TUBER')"
        >
          <div class="segment-bg">
            <img src="/images/plate/cereals.png" alt="" aria-hidden="true" class="segment-img" />
          </div>
          <span class="material-symbols-outlined segment-icon text-secondary">bakery_dining</span>
          <span class="segment-label text-secondary-dim">Cereales</span>
          <template v-if="sectionHasItems('CEREAL_TUBER')">
            <span
              v-for="item in groupItems('CEREAL_TUBER')"
              :key="item.id"
              class="segment-food-name"
              :class="alClass(item)"
            >
              <span class="al-dot" />
              <span class="food-name-text">{{ item.food.name }}</span>
              <span
                v-if="item.food.isAllergen"
                class="material-symbols-outlined allergen-icon"
              >warning</span>
            </span>
          </template>
          <span v-else class="segment-empty">Vacío</span>
        </button>

        <!-- ── PROTEIN (bottom-right) — no background image ─────────── -->
        <button
          class="segment segment-br segment-protein"
          :class="{ 'segment--filled': sectionHasItems('PROTEIN') }"
          aria-label="Agregar alimento a Proteínas"
          @click="emit('select-group', 'PROTEIN')"
        >
          <span class="material-symbols-outlined segment-icon text-on-surface-variant">egg</span>
          <span class="segment-label text-on-surface-variant">Proteínas</span>
          <template v-if="sectionHasItems('PROTEIN')">
            <span
              v-for="item in groupItems('PROTEIN')"
              :key="item.id"
              class="segment-food-name"
              :class="alClass(item)"
            >
              <span class="al-dot" />
              <span class="food-name-text">{{ item.food.name }}</span>
              <span
                v-if="item.food.isAllergen"
                class="material-symbols-outlined allergen-icon"
              >warning</span>
            </span>
          </template>
          <span v-else class="segment-empty">Vacío</span>
        </button>

        <!-- ── HEALTHY_FAT strip (5-group mode only) ─────────────────── -->
        <button
          v-if="props.groupCount === 5"
          class="segment segment-fat"
          :class="{ 'segment--filled': sectionHasItems('HEALTHY_FAT') }"
          aria-label="Agregar alimento a Grasas Saludables"
          @click="emit('select-group', 'HEALTHY_FAT')"
        >
          <span class="material-symbols-outlined segment-icon segment-icon--fat">water_drop</span>
          <span class="segment-label segment-label--fat">Grasas Saludables</span>
          <template v-if="sectionHasItems('HEALTHY_FAT')">
            <span
              v-for="item in groupItems('HEALTHY_FAT')"
              :key="item.id"
              class="segment-food-name segment-food-name--fat"
              :class="alClass(item)"
            >
              <span class="al-dot" />
              <span class="food-name-text">{{ item.food.name }}</span>
              <span
                v-if="item.food.isAllergen"
                class="material-symbols-outlined allergen-icon"
              >warning</span>
            </span>
          </template>
          <span v-else class="segment-empty segment-empty--fat">Vacío</span>
        </button>

        <!-- ── Center "+" element ────────────────────────────────────── -->
        <div class="plate-center" aria-hidden="true">
          <span class="material-symbols-outlined plate-center-icon">add</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { FoodGroup } from '@pakulab/shared'
import { FOOD_GROUP_LABELS } from '@pakulab/shared'
import type { PlateItemDraft } from '@/shared/stores/plateStore.js'

const props = defineProps<{
  items: PlateItemDraft[]
  groupCount: 4 | 5
}>()

const emit = defineEmits<{
  'remove-item': [itemId: string]
  'select-group': [group: FoodGroup]
}>()

function groupItems(group: FoodGroup): PlateItemDraft[] {
  return props.items.filter((item) => item.groupAssignment === group)
}

function sectionHasItems(group: FoodGroup): boolean {
  return groupItems(group).length > 0
}

function alClass(item: PlateItemDraft): string {
  switch (item.food.alClassification) {
    case 'ASTRINGENT': return 'al-astringent'
    case 'LAXATIVE': return 'al-laxative'
    default: return 'al-neutral'
  }
}

const plateAriaLabel = computed(() => {
  const totalItems = props.items.length
  if (totalItems === 0) return `Plato vacío con ${props.groupCount} grupos de alimentos`
  const groups: FoodGroup[] = ['FRUIT', 'VEGETABLE', 'CEREAL_TUBER', 'PROTEIN']
  if (props.groupCount === 5) groups.push('HEALTHY_FAT')
  const groupSummary = groups
    .map((g) => {
      const count = groupItems(g).length
      return count > 0 ? `${FOOD_GROUP_LABELS[g]}: ${count}` : null
    })
    .filter(Boolean)
    .join(', ')
  return `Plato con ${totalItems} alimentos — ${groupSummary}`
})
</script>

<style scoped>
/* ── Wrapper ──────────────────────────────────────────────────────────────── */
.plate-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* ── Outer container (circular plate) ────────────────────────────────────── */
.plate-outer {
  width: 320px;
  height: 320px;
  border-radius: 50%;
  background: var(--md3-surface-container-lowest);
  box-shadow: 0 20px 50px -12px rgba(0, 105, 75, 0.08);
  padding: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: border-radius 0.4s ease, height 0.4s ease;
}

@media (min-width: 768px) {
  .plate-outer {
    width: 440px;
    height: 440px;
    padding: 1.5rem;
  }
}

/* 5-group mode: morph from circle to stadium */
.plate-outer--five {
  border-radius: 2.5rem;
  height: 380px;
}

@media (min-width: 768px) {
  .plate-outer--five {
    height: 540px;
  }
}

/* ── Inner plate ring ─────────────────────────────────────────────────────── */
.plate-ring {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 12px solid var(--md3-surface-container-low);
  overflow: hidden;
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 0.375rem;
  padding: 0.375rem;
  position: relative;
  transition: border-radius 0.4s ease, grid-template-rows 0.4s ease;
}

/* 5-group ring: stadium shape + 3rd row for fat strip */
.plate-ring--five {
  border-radius: 1.8rem;
  grid-template-rows: 1fr 1fr 0.55fr;
}

/* ── Segment base styles ──────────────────────────────────────────────────── */
.segment {
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.2rem;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  transition: background-color 0.2s ease;
  /* Focus ring */
  outline: none;
}

.segment:focus-visible {
  outline: 2px solid var(--md3-primary);
  outline-offset: -2px;
}

/* ── Background image overlay (absolute, low-opacity) ────────────────────── */
.segment-bg {
  position: absolute;
  inset: 0;
  opacity: 0.1;
  transition: opacity 0.2s ease;
  pointer-events: none;
}

.segment:hover .segment-bg,
.segment:focus-visible .segment-bg {
  opacity: 0.22;
}

.segment--filled .segment-bg {
  opacity: 0.15;
}

.segment--filled:hover .segment-bg {
  opacity: 0.28;
}

.segment-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* ── Per-quadrant corner radii ────────────────────────────────────────────── */
.segment-tl { border-radius: 9999px 0 0 0; }  /* top-left = Fruits */
.segment-tr { border-radius: 0 9999px 0 0; }  /* top-right = Vegetables */
.segment-bl { border-radius: 0 0 0 9999px; }  /* bottom-left = Cereals */
.segment-br { border-radius: 0 0 9999px 0; }  /* bottom-right = Proteins */

/* ── Per-group background colors ─────────────────────────────────────────── */
.segment-fruit {
  background-color: color-mix(in srgb, var(--md3-primary-container) 20%, transparent);
}
.segment-fruit:hover,
.segment-fruit:focus-visible {
  background-color: color-mix(in srgb, var(--md3-primary-container) 40%, transparent);
}
.segment-fruit.segment--filled {
  background-color: color-mix(in srgb, var(--md3-primary-container) 25%, transparent);
}

.segment-vegetable {
  background-color: color-mix(in srgb, var(--md3-tertiary-container) 20%, transparent);
}
.segment-vegetable:hover,
.segment-vegetable:focus-visible {
  background-color: color-mix(in srgb, var(--md3-tertiary-container) 40%, transparent);
}
.segment-vegetable.segment--filled {
  background-color: color-mix(in srgb, var(--md3-tertiary-container) 25%, transparent);
}

.segment-cereal {
  background-color: color-mix(in srgb, var(--md3-secondary-container) 20%, transparent);
}
.segment-cereal:hover,
.segment-cereal:focus-visible {
  background-color: color-mix(in srgb, var(--md3-secondary-container) 40%, transparent);
}
.segment-cereal.segment--filled {
  background-color: color-mix(in srgb, var(--md3-secondary-container) 25%, transparent);
}

.segment-protein {
  background-color: var(--md3-surface-container-high);
}
.segment-protein:hover,
.segment-protein:focus-visible {
  background-color: var(--md3-surface-container-highest);
}

/* ── HEALTHY_FAT strip (5th group) ───────────────────────────────────────── */
.segment-fat {
  grid-column: 1 / -1;
  border-radius: 0 0 1.4rem 1.4rem;
  background-color: color-mix(in srgb, var(--md3-group-fat) 18%, transparent);
  flex-direction: row;
  gap: 0.5rem;
  justify-content: center;
  padding: 0.5rem 1rem;
}
.segment-fat:hover,
.segment-fat:focus-visible {
  background-color: color-mix(in srgb, var(--md3-group-fat) 35%, transparent);
}
.segment-fat.segment--filled {
  background-color: color-mix(in srgb, var(--md3-group-fat) 25%, transparent);
}

/* ── Icon ─────────────────────────────────────────────────────────────────── */
.segment-icon {
  font-size: 1.75rem;
  line-height: 1;
  z-index: 1;
  pointer-events: none;
}

.segment-icon--fat {
  color: var(--md3-group-fat-on);
  font-size: 1.25rem;
}

/* ── Label ────────────────────────────────────────────────────────────────── */
.segment-label {
  font-size: var(--md3-label-sm);
  font-weight: var(--md3-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  z-index: 1;
  pointer-events: none;
  line-height: 1.2;
  text-align: center;
}

.segment-label--fat {
  font-size: var(--md3-label-sm);
  font-weight: var(--md3-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--md3-group-fat-on);
}

/* ── Color helpers (inline text color via class) ─────────────────────────── */
.text-primary { color: var(--md3-primary); }
.text-primary-dim { color: var(--md3-primary-dim); }
.text-tertiary { color: var(--md3-tertiary); }
.text-tertiary-dim { color: var(--md3-tertiary-dim); }
.text-secondary { color: var(--md3-secondary); }
.text-secondary-dim { color: var(--md3-secondary-dim); }
.text-on-surface-variant { color: var(--md3-on-surface-variant); }

/* ── Empty state hint ─────────────────────────────────────────────────────── */
.segment-empty {
  font-size: 0.625rem;
  color: var(--md3-on-surface-variant);
  opacity: 0.6;
  z-index: 1;
  pointer-events: none;
  letter-spacing: 0.02em;
}

.segment-empty--fat {
  font-size: 0.625rem;
  color: var(--md3-group-fat-on);
  opacity: 0.5;
}

/* ── Filled: food name chip ───────────────────────────────────────────────── */
.segment-food-name {
  display: flex;
  align-items: center;
  gap: 0.2rem;
  background: rgba(255, 255, 255, 0.88);
  border-radius: 0.5rem;
  padding: 0.2rem 0.35rem;
  border-left: 3px solid transparent;
  z-index: 1;
  pointer-events: none;
  max-width: 90%;
  box-shadow: 0 2px 8px -2px rgba(44, 47, 48, 0.1);
}

.segment-food-name--fat {
  max-width: 40%;
}

.segment-food-name.al-astringent { border-left-color: var(--md3-error); }
.segment-food-name.al-laxative   { border-left-color: var(--md3-primary); }
.segment-food-name.al-neutral     { border-left-color: var(--md3-outline-variant); }

.food-name-text {
  font-size: 0.6rem;
  font-weight: var(--md3-weight-medium);
  color: var(--md3-on-surface);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 5rem;
  line-height: 1.3;
}

.al-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
  background: var(--md3-outline-variant);
}
.al-astringent .al-dot { background: var(--md3-error); }
.al-laxative   .al-dot { background: var(--md3-primary); }

.allergen-icon {
  font-size: 0.7rem;
  color: var(--md3-error);
  flex-shrink: 0;
  line-height: 1;
}

/* ── Center "+" circle ────────────────────────────────────────────────────── */
.plate-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 3.5rem;
  height: 3.5rem;
  background: var(--md3-surface-container-lowest);
  border-radius: 50%;
  border: 4px solid var(--md3-surface-container-low);
  box-shadow: var(--md3-shadow-card);
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.plate-center-icon {
  font-size: 1.5rem;
  color: var(--md3-primary);
  font-variation-settings: 'wght' 700;
  animation: plate-center-pulse 2s ease-in-out infinite;
}

@keyframes plate-center-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%       { opacity: 0.65; transform: scale(0.9); }
}

/* ── 5-group mode: center moves up to sit at the midpoint of the 2×2 quadrant area ── */
/* Grid is 1fr 1fr 0.55fr → top 2 rows = 2/2.55 of total height → midpoint ≈ 39% */
.plate-ring--five .plate-center {
  top: 39%;
}
</style>
