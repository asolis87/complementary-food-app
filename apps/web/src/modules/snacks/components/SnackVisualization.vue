<template>
  <div class="bento-wrap">
    <!-- Bento box: rounded rectangle split into 3 cells (one per snack group).
         A cell is enabled only when its group is age-suggested; otherwise it is
         locked (age rule). When no group is suggested (<10m), all cells lock and
         an age hint is shown. -->
    <div
      class="bento-box"
      role="group"
      :aria-label="bentoAriaLabel"
    >
      <!-- ── HEALTHY_FAT ────────────────────────────────────────────────── -->
      <button
        type="button"
        class="cell cell-fat"
        :class="{
          'cell--filled': sectionHasItems('HEALTHY_FAT'),
          'cell--locked': !isEnabled('HEALTHY_FAT'),
        }"
        :disabled="!isEnabled('HEALTHY_FAT')"
        :aria-label="cellAriaLabel('HEALTHY_FAT', 'Grasa saludable')"
        @click="onCellClick('HEALTHY_FAT')"
      >
        <span
          class="material-symbols-outlined cell-icon"
          aria-hidden="true"
        >{{ isEnabled('HEALTHY_FAT') ? 'water_drop' : 'lock' }}</span>
        <span class="cell-label">Grasa saludable</span>
        <template v-if="sectionHasItems('HEALTHY_FAT')">
          <span
            v-for="item in groupItems('HEALTHY_FAT')"
            :key="item.id"
            class="cell-food-name"
          >
            <span class="food-name-text">{{ item.food.name }}</span>
          </span>
        </template>
        <span v-else-if="isEnabled('HEALTHY_FAT')" class="cell-empty">Vacío</span>
      </button>

      <!-- ── CEREAL_TUBER ───────────────────────────────────────────────── -->
      <button
        type="button"
        class="cell cell-cereal"
        :class="{
          'cell--filled': sectionHasItems('CEREAL_TUBER'),
          'cell--locked': !isEnabled('CEREAL_TUBER'),
        }"
        :disabled="!isEnabled('CEREAL_TUBER')"
        :aria-label="cellAriaLabel('CEREAL_TUBER', 'Cereal')"
        @click="onCellClick('CEREAL_TUBER')"
      >
        <span
          class="material-symbols-outlined cell-icon"
          aria-hidden="true"
        >{{ isEnabled('CEREAL_TUBER') ? 'bakery_dining' : 'lock' }}</span>
        <span class="cell-label">Cereal</span>
        <template v-if="sectionHasItems('CEREAL_TUBER')">
          <span
            v-for="item in groupItems('CEREAL_TUBER')"
            :key="item.id"
            class="cell-food-name"
          >
            <span class="food-name-text">{{ item.food.name }}</span>
          </span>
        </template>
        <span v-else-if="isEnabled('CEREAL_TUBER')" class="cell-empty">Vacío</span>
      </button>

      <!-- ── FRUIT ──────────────────────────────────────────────────────── -->
      <button
        type="button"
        class="cell cell-fruit"
        :class="{
          'cell--filled': sectionHasItems('FRUIT'),
          'cell--locked': !isEnabled('FRUIT'),
        }"
        :disabled="!isEnabled('FRUIT')"
        :aria-label="cellAriaLabel('FRUIT', 'Fruta')"
        @click="onCellClick('FRUIT')"
      >
        <span
          class="material-symbols-outlined cell-icon"
          aria-hidden="true"
        >{{ isEnabled('FRUIT') ? 'nutrition' : 'lock' }}</span>
        <span class="cell-label">Fruta</span>
        <template v-if="sectionHasItems('FRUIT')">
          <span
            v-for="item in groupItems('FRUIT')"
            :key="item.id"
            class="cell-food-name"
          >
            <span class="food-name-text">{{ item.food.name }}</span>
          </span>
        </template>
        <span v-else-if="isEnabled('FRUIT')" class="cell-empty">Vacío</span>
      </button>
    </div>

    <!-- Age hint when snacks are not yet recommended (<10m → no suggested groups) -->
    <p v-if="noGroupsForAge" class="bento-age-hint" role="note">
      Las colaciones se recomiendan a partir de los 10 meses.
    </p>
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
  /** Age-suggested groups. A cell is ENABLED only if its group is in here. */
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

/** True when the baby's age suggests no snack groups at all (<10m). */
const noGroupsForAge = computed(() => props.suggestedGroups.length === 0)

/** A cell is enabled only when its group is age-suggested (age gate). */
function isEnabled(group: FoodGroup): boolean {
  return props.suggestedGroups.includes(group)
}

function onCellClick(group: FoodGroup): void {
  if (!isEnabled(group)) return
  emit('select-group', group)
}

function cellAriaLabel(group: FoodGroup, label: string): string {
  return isEnabled(group)
    ? `Agregar alimento a ${label}`
    : `${label} no disponible para esta edad`
}

const bentoAriaLabel = computed(() => {
  const totalItems = props.items.length
  if (totalItems === 0) return 'Colación vacía tipo bento con 3 grupos de alimentos'
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
.bento-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--md3-space-3);
  width: 100%;
}

/* ── Bento box: rounded rectangle, 3 equal cells ─────────────────────────── */
.bento-box {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
  width: 100%;
  max-width: 340px;
  aspect-ratio: 3 / 2;
  padding: 0.75rem;
  background: var(--md3-surface-container-lowest);
  border: 2px solid var(--md3-surface-container-low);
  border-radius: var(--md3-rounded-lg, 1.25rem);
  box-shadow: 0 20px 50px -12px rgba(0, 105, 75, 0.1);
}

@media (min-width: 768px) {
  .bento-box {
    max-width: 420px;
    gap: 0.65rem;
    padding: 1rem;
  }
}

/* ── Cell base ────────────────────────────────────────────────────────────── */
.cell {
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: var(--md3-rounded-md, 0.85rem);
  transition: background-color 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease;
  outline: none;
}

.cell:focus-visible {
  outline: 2px solid var(--md3-primary);
  outline-offset: -2px;
}

/* ── Per-group colors ─────────────────────────────────────────────────────── */
.cell-fat {
  background-color: color-mix(in srgb, var(--md3-group-fat) 18%, transparent);
}
.cell-fat:not(.cell--locked):hover,
.cell-fat:not(.cell--locked):focus-visible {
  background-color: color-mix(in srgb, var(--md3-group-fat) 35%, transparent);
}
.cell-fat.cell--filled {
  background-color: color-mix(in srgb, var(--md3-group-fat) 25%, transparent);
}

.cell-cereal {
  background-color: color-mix(in srgb, var(--md3-secondary-container) 20%, transparent);
}
.cell-cereal:not(.cell--locked):hover,
.cell-cereal:not(.cell--locked):focus-visible {
  background-color: color-mix(in srgb, var(--md3-secondary-container) 40%, transparent);
}
.cell-cereal.cell--filled {
  background-color: color-mix(in srgb, var(--md3-secondary-container) 25%, transparent);
}

.cell-fruit {
  background-color: color-mix(in srgb, var(--md3-primary-container) 20%, transparent);
}
.cell-fruit:not(.cell--locked):hover,
.cell-fruit:not(.cell--locked):focus-visible {
  background-color: color-mix(in srgb, var(--md3-primary-container) 40%, transparent);
}
.cell-fruit.cell--filled {
  background-color: color-mix(in srgb, var(--md3-primary-container) 25%, transparent);
}

/* ── Locked cell (age rule) ───────────────────────────────────────────────── */
.cell--locked {
  cursor: not-allowed;
  opacity: 0.45;
  background-color: var(--md3-surface-container) !important;
  box-shadow: inset 0 0 0 1.5px var(--md3-outline-variant, rgba(0, 0, 0, 0.12));
}

/* ── Icon ─────────────────────────────────────────────────────────────────── */
.cell-icon {
  font-size: 1.5rem;
  line-height: 1;
  z-index: 1;
  pointer-events: none;
  color: var(--md3-group-fat-on);
}

.cell-cereal .cell-icon { color: var(--md3-secondary); }
.cell-fruit .cell-icon { color: var(--md3-primary); }
.cell--locked .cell-icon { color: var(--md3-on-surface-variant); }

/* ── Label ────────────────────────────────────────────────────────────────── */
.cell-label {
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

.cell-cereal .cell-label { color: var(--md3-secondary-dim); }
.cell-fruit .cell-label { color: var(--md3-primary-dim); }
.cell--locked .cell-label { color: var(--md3-on-surface-variant); }

/* ── Empty state hint ─────────────────────────────────────────────────────── */
.cell-empty {
  font-size: 0.625rem;
  color: var(--md3-on-surface-variant);
  opacity: 0.6;
  z-index: 1;
  pointer-events: none;
  letter-spacing: 0.02em;
}

/* ── Filled: food name chip ───────────────────────────────────────────────── */
.cell-food-name {
  display: flex;
  align-items: center;
  gap: 0.2rem;
  background: rgba(255, 255, 255, 0.88);
  border-radius: 0.5rem;
  padding: 0.2rem 0.35rem;
  z-index: 1;
  pointer-events: none;
  max-width: 92%;
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

/* ── Age hint ─────────────────────────────────────────────────────────────── */
.bento-age-hint {
  margin: 0;
  font-size: var(--md3-label-sm);
  color: var(--md3-on-surface-variant);
  text-align: center;
  max-width: 340px;
}
</style>
