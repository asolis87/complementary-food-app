<template>
  <div class="food-group-tabs" role="tablist" :aria-label="'Grupos de alimentos'">
    <button
      v-for="group in groups"
      :key="group"
      role="tab"
      :aria-selected="group === activeGroup"
      :aria-controls="`panel-${group}`"
      class="tab-btn"
      :class="{ active: group === activeGroup, 'has-items': (itemCounts[group] ?? 0) > 0 }"
      :style="{ '--group-color': groupColor(group) }"
      @click="emit('select', group)"
    >
      <span class="tab-icon" aria-hidden="true">{{ groupIcon(group) }}</span>
      <span class="tab-label">{{ FOOD_GROUP_LABELS[group] }}</span>
      <span v-if="(itemCounts[group] ?? 0) > 0" class="tab-count">
        {{ itemCounts[group] }}
      </span>
    </button>
  </div>
</template>

<script setup lang="ts">
import type { FoodGroup } from '@pakulab/shared'
import { FOOD_GROUP_LABELS } from '@pakulab/shared'

defineProps<{
  groups: FoodGroup[]
  activeGroup: FoodGroup
  itemCounts: Partial<Record<FoodGroup, number>>
}>()

const emit = defineEmits<{
  select: [group: FoodGroup]
}>()

// Colors match MD3 food group tokens: --md3-group-{fruit,vegetable,protein,cereal,fat}-on
// Using the "-on" values (darker) so active tabs have enough contrast on the container background
function groupColor(group: FoodGroup): string {
  const colors: Record<FoodGroup, string> = {
    FRUIT: '#6e391a',       // --md3-group-fruit-on
    VEGETABLE: '#004d36',   // --md3-group-vegetable-on
    PROTEIN: '#6e391a',     // --md3-group-protein-on
    CEREAL_TUBER: '#004d36', // --md3-group-cereal-on
    HEALTHY_FAT: '#3b1f8c', // --md3-group-fat-on
  }
  return colors[group]
}

function groupIcon(group: FoodGroup): string {
  const icons: Record<FoodGroup, string> = {
    FRUIT: '🍎',
    VEGETABLE: '🥦',
    PROTEIN: '🥩',
    CEREAL_TUBER: '🌽',
    HEALTHY_FAT: '🥑',
  }
  return icons[group]
}
</script>

<style scoped>
.food-group-tabs {
  display: flex;
  gap: var(--md3-space-2);
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
  padding-bottom: 2px; /* Room for focus ring */
}

.food-group-tabs::-webkit-scrollbar {
  display: none;
}

.tab-btn {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 0.85rem;
  border-radius: var(--md3-rounded-full);
  border: 2px solid var(--md3-outline-variant);
  background: var(--md3-surface-container-lowest);
  cursor: pointer;
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-lg);
  color: var(--md3-on-surface-variant);
  transition: all var(--md3-transition-fast);
  font-weight: var(--md3-weight-medium);
  white-space: nowrap;
}

.tab-btn:hover {
  border-color: var(--group-color);
  color: var(--group-color);
  background: var(--md3-surface-container-low);
}

.tab-btn.active {
  border-color: var(--group-color);
  background: var(--group-color);
  color: var(--md3-surface-container-lowest);
  box-shadow: var(--md3-shadow-card);
}

.tab-btn.has-items:not(.active)::before {
  content: '';
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--group-color);
  margin-right: 0.2rem;
}

.tab-icon {
  font-size: 1rem;
}

.tab-label {
  display: none;
}

@media (min-width: 480px) {
  .tab-label {
    display: inline;
  }
}

.tab-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  border-radius: var(--md3-rounded-full);
  background: rgba(255, 255, 255, 0.35);
  font-size: var(--md3-label-sm);
  font-weight: var(--md3-weight-bold);
  padding: 0 4px;
}

.tab-btn:not(.active) .tab-count {
  background: var(--md3-surface-container);
  color: var(--md3-on-surface);
}
</style>
