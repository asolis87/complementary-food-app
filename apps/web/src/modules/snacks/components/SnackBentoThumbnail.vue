<template>
  <!-- Read-only bento preview for a saved snack card. Mirrors the builder's
       bento visual language (3 group cells) but is non-interactive: no age
       gate, no locks, no tap. Shows the assigned food per group, or a subtle
       empty cell. -->
  <div class="bento-thumb" role="img" :aria-label="thumbAriaLabel">
    <div
      v-for="cell in cells"
      :key="cell.group"
      class="thumb-cell"
      :class="[`thumb-cell--${cell.key}`, { 'thumb-cell--empty': cell.names.length === 0 }]"
    >
      <span class="material-symbols-outlined thumb-icon" aria-hidden="true">{{ cell.icon }}</span>
      <span v-if="cell.names.length" class="thumb-food">{{ cell.names[0] }}</span>
      <span v-if="cell.names.length > 1" class="thumb-more">+{{ cell.names.length - 1 }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { FoodGroup, SnackItemSummary } from '@pakulab/shared'
import { FOOD_GROUP_LABELS } from '@pakulab/shared'

const props = defineProps<{
  items: SnackItemSummary[]
}>()

interface CellDef {
  group: FoodGroup
  key: 'fat' | 'cereal' | 'fruit'
  icon: string
  names: string[]
}

/** The 3 snack cells, in fixed order, each with its assigned food names. */
const cells = computed<CellDef[]>(() => {
  const defs: Array<Omit<CellDef, 'names'>> = [
    { group: 'HEALTHY_FAT', key: 'fat', icon: 'water_drop' },
    { group: 'CEREAL_TUBER', key: 'cereal', icon: 'bakery_dining' },
    { group: 'FRUIT', key: 'fruit', icon: 'nutrition' },
  ]
  return defs.map((def) => ({
    ...def,
    names: props.items
      .filter((item) => item.groupAssignment === def.group)
      // Defensive: the API always populates `food`, but never crash the card
      // preview on a partial item — fall back to a neutral label.
      .map((item) => item.food?.name ?? 'Alimento'),
  }))
})

const thumbAriaLabel = computed(() => {
  const summary = cells.value
    .filter((c) => c.names.length > 0)
    .map((c) => `${FOOD_GROUP_LABELS[c.group]}: ${c.names.join(', ')}`)
    .join('; ')
  return summary ? `Colación — ${summary}` : 'Colación sin alimentos'
})
</script>

<style scoped>
.bento-thumb {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.35rem;
  width: 100%;
  aspect-ratio: 3 / 1.4;
  padding: 0.4rem;
  background: var(--md3-surface-container-lowest);
  border: 1.5px solid var(--md3-surface-container-low);
  border-radius: var(--md3-rounded-md, 0.85rem);
}

.thumb-cell {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.15rem;
  padding: 0.3rem 0.2rem;
  border-radius: var(--md3-rounded-sm, 0.6rem);
  min-width: 0;
}

/* Per-group colors (mirror the builder bento) */
.thumb-cell--fat {
  background-color: color-mix(in srgb, var(--md3-group-fat) 22%, transparent);
}
.thumb-cell--cereal {
  background-color: color-mix(in srgb, var(--md3-secondary-container) 24%, transparent);
}
.thumb-cell--fruit {
  background-color: color-mix(in srgb, var(--md3-primary-container) 24%, transparent);
}

.thumb-cell--empty {
  background-color: var(--md3-surface-container);
  opacity: 0.5;
}

.thumb-icon {
  font-size: 1.1rem;
  line-height: 1;
  color: var(--md3-group-fat-on);
}
.thumb-cell--cereal .thumb-icon { color: var(--md3-secondary); }
.thumb-cell--fruit .thumb-icon { color: var(--md3-primary); }
.thumb-cell--empty .thumb-icon { color: var(--md3-on-surface-variant); }

.thumb-food {
  font-size: 0.6rem;
  font-weight: var(--md3-weight-medium);
  color: var(--md3-on-surface);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
  line-height: 1.2;
  text-align: center;
}

.thumb-more {
  font-size: 0.55rem;
  font-weight: var(--md3-weight-bold);
  color: var(--md3-on-surface-variant);
  line-height: 1;
}
</style>
