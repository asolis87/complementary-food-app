<template>
  <div class="snack-wrap">
    <!-- Outer circular container for 3-zone snack -->
    <div class="snack-outer">
      <!-- Inner snack ring: 3 zones arranged circularly -->
      <div
        class="snack-ring"
        role="group"
        :aria-label="snackAriaLabel"
      >
        <!-- ── HEALTHY_FAT (left zone) ────────────────────────────────────── -->
        <button
          class="segment segment-left segment-fat"
          :class="{
            'segment--filled': sectionHasItems('HEALTHY_FAT'),
            'segment--suggested': isSuggested('HEALTHY_FAT'),
          }"
          aria-label="Agregar alimento a Grasa saludable"
          @click="emit('select-group', 'HEALTHY_FAT')"
        >
          <span class="material-symbols-outlined segment-icon">water_drop</span>
          <span class="segment-label">Grasa saludable</span>
          <template v-if="sectionHasItems('HEALTHY_FAT')">
            <span
              v-for="item in groupItems('HEALTHY_FAT')"
              :key="item.id"
              class="segment-food-name"
            >
              <span class="food-name-text">{{ item.food.name }}</span>
            </span>
          </template>
          <span v-else class="segment-empty">Vacío</span>
        </button>

        <!-- ── CEREAL_TUBER (top zone) ────────────────────────────────────── -->
        <button
          class="segment segment-top segment-cereal"
          :class="{
            'segment--filled': sectionHasItems('CEREAL_TUBER'),
            'segment--suggested': isSuggested('CEREAL_TUBER'),
          }"
          aria-label="Agregar alimento a Cereal"
          @click="emit('select-group', 'CEREAL_TUBER')"
        >
          <div class="segment-bg">
            <img src="/images/plate/cereals.png" alt="" aria-hidden="true" class="segment-img" />
          </div>
          <span class="material-symbols-outlined segment-icon text-secondary">bakery_dining</span>
          <span class="segment-label text-secondary-dim">Cereal</span>
          <template v-if="sectionHasItems('CEREAL_TUBER')">
            <span
              v-for="item in groupItems('CEREAL_TUBER')"
              :key="item.id"
              class="segment-food-name"
            >
              <span class="food-name-text">{{ item.food.name }}</span>
            </span>
          </template>
          <span v-else class="segment-empty">Vacío</span>
        </button>

        <!-- ── FRUIT (right zone) ──────────────────────────────────────────── -->
        <button
          class="segment segment-right segment-fruit"
          :class="{
            'segment--filled': sectionHasItems('FRUIT'),
            'segment--suggested': isSuggested('FRUIT'),
          }"
          aria-label="Agregar alimento a Fruta"
          @click="emit('select-group', 'FRUIT')"
        >
          <div class="segment-bg">
            <img src="/images/plate/fruits.png" alt="" aria-hidden="true" class="segment-img" />
          </div>
          <span class="material-symbols-outlined segment-icon text-primary">nutrition</span>
          <span class="segment-label text-primary-dim">Fruta</span>
          <template v-if="sectionHasItems('FRUIT')">
            <span
              v-for="item in groupItems('FRUIT')"
              :key="item.id"
              class="segment-food-name"
            >
              <span class="food-name-text">{{ item.food.name }}</span>
            </span>
          </template>
          <span v-else class="segment-empty">Vacío</span>
        </button>

        <!-- ── Center "+" element ────────────────────────────────────────── -->
        <div class="snack-center" aria-hidden="true">
          <span class="material-symbols-outlined snack-center-icon">add</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { FoodGroup } from '@pakulab/shared'
import { FOOD_GROUP_LABELS } from '@pakulab/shared'
// Snacks intentionally reuse the plate draft-item shape (foodId + group +
// serving) — same structure, no snack-specific fields. Kept as PlateItemDraft
// (matching useSnackBuilder) rather than aliasing to avoid a divergent name.
import type { PlateItemDraft } from '@/shared/stores/plateStore.js'

const props = defineProps<{
  items: PlateItemDraft[]
  suggestedGroups: FoodGroup[]
}>()

const emit = defineEmits<{
  'select-group': [group: FoodGroup]
}>()

function groupItems(group: FoodGroup): PlateItemDraft[] {
  return props.items.filter((item) => item.groupAssignment === group)
}

function sectionHasItems(group: FoodGroup): boolean {
  return groupItems(group).length > 0
}

function isSuggested(group: FoodGroup): boolean {
  return props.suggestedGroups.includes(group)
}

const snackAriaLabel = computed(() => {
  const totalItems = props.items.length
  if (totalItems === 0) return 'Colación vacía con 3 grupos de alimentos'
  const groups: FoodGroup[] = ['HEALTHY_FAT', 'CEREAL_TUBER', 'FRUIT']
  const groupSummary = groups
    .map((g) => {
      const count = groupItems(g).length
      return count > 0 ? `${FOOD_GROUP_LABELS[g]}: ${count}` : null
    })
    .filter(Boolean)
    .join(', ')
  return `Colación con ${totalItems} alimentos — ${groupSummary}`
})
</script>

<style scoped>
/* ── Wrapper ──────────────────────────────────────────────────────────────── */
.snack-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* ── Outer container (circular snack) ────────────────────────────────────── */
.snack-outer {
  width: 280px;
  height: 280px;
  border-radius: 50%;
  background: var(--md3-surface-container-lowest);
  box-shadow: 0 20px 50px -12px rgba(0, 105, 75, 0.08);
  padding: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

@media (min-width: 768px) {
  .snack-outer {
    width: 360px;
    height: 360px;
    padding: 1.25rem;
  }
}

/* ── Inner snack ring ─────────────────────────────────────────────────────── */
.snack-ring {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 10px solid var(--md3-surface-container-low);
  overflow: hidden;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 0;
  position: relative;
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

/* ── Zone positioning: 3 zones arranged in a triangular pattern ─────────── */
.segment-left {
  grid-column: 1;
  grid-row: 1 / span 2;
  border-radius: 9999px 0 0 9999px;
}

.segment-top {
  grid-column: 2 / span 2;
  grid-row: 1;
  border-radius: 0 9999px 0 0;
}

.segment-right {
  grid-column: 2 / span 2;
  grid-row: 2;
  border-radius: 0 0 9999px 0;
}

/* ── Per-group background colors ─────────────────────────────────────────── */
.segment-fat {
  background-color: color-mix(in srgb, var(--md3-group-fat) 18%, transparent);
}
.segment-fat:hover,
.segment-fat:focus-visible {
  background-color: color-mix(in srgb, var(--md3-group-fat) 35%, transparent);
}
.segment-fat.segment--filled {
  background-color: color-mix(in srgb, var(--md3-group-fat) 25%, transparent);
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

/* ── Suggested zone emphasis (REQ-SC4) ────────────────────────────────────── */
.segment--suggested {
  box-shadow: inset 0 0 0 3px var(--md3-primary);
}

.segment--suggested::after {
  content: 'Sugerido';
  position: absolute;
  top: 0.5rem;
  left: 50%;
  transform: translateX(-50%);
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-xs);
  font-weight: var(--md3-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--md3-primary);
  background: var(--md3-surface-container-lowest);
  padding: 0.15rem 0.5rem;
  border-radius: var(--md3-rounded-full);
  z-index: 2;
  pointer-events: none;
}

/* ── Icon ─────────────────────────────────────────────────────────────────── */
.segment-icon {
  font-size: 1.5rem;
  line-height: 1;
  z-index: 1;
  pointer-events: none;
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
  color: var(--md3-group-fat-on);
}

/* ── Color helpers (inline text color via class) ─────────────────────────── */
.text-primary { color: var(--md3-primary); }
.text-primary-dim { color: var(--md3-primary-dim); }
.text-secondary { color: var(--md3-secondary); }
.text-secondary-dim { color: var(--md3-secondary-dim); }

/* ── Empty state hint ─────────────────────────────────────────────────────── */
.segment-empty {
  font-size: 0.625rem;
  color: var(--md3-on-surface-variant);
  opacity: 0.6;
  z-index: 1;
  pointer-events: none;
  letter-spacing: 0.02em;
}

/* ── Filled: food name chip ───────────────────────────────────────────────── */
.segment-food-name {
  display: flex;
  align-items: center;
  gap: 0.2rem;
  background: rgba(255, 255, 255, 0.88);
  border-radius: 0.5rem;
  padding: 0.2rem 0.35rem;
  z-index: 1;
  pointer-events: none;
  max-width: 90%;
  box-shadow: 0 2px 8px -2px rgba(44, 47, 48, 0.1);
}

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

/* ── Center "+" circle ────────────────────────────────────────────────────── */
.snack-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 3rem;
  height: 3rem;
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

.snack-center-icon {
  font-size: 1.25rem;
  color: var(--md3-primary);
  font-variation-settings: 'wght' 700;
  animation: snack-center-pulse 2s ease-in-out infinite;
}

@keyframes snack-center-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%       { opacity: 0.65; transform: scale(0.9); }
}
</style>
