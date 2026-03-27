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
import type { FoodGroup } from '@cfa/shared'
import { FOOD_GROUP_LABELS } from '@cfa/shared'

defineProps<{
  groups: FoodGroup[]
  activeGroup: FoodGroup
  itemCounts: Partial<Record<FoodGroup, number>>
}>()

const emit = defineEmits<{
  select: [group: FoodGroup]
}>()

function groupColor(group: FoodGroup): string {
  const colors: Record<FoodGroup, string> = {
    FRUIT: '#F59E0B',
    VEGETABLE: '#10B981',
    PROTEIN: '#F43F5E',
    CEREAL_TUBER: '#D97706',
    HEALTHY_FAT: '#8B5CF6',
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
  gap: 0.5rem;
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
  border-radius: 9999px;
  border: 2px solid #e5e7eb;
  background: white;
  cursor: pointer;
  font-size: 0.8rem;
  color: #6b7280;
  transition: all 0.15s;
  font-weight: 500;
  white-space: nowrap;
}

.tab-btn:hover {
  border-color: var(--group-color);
  color: var(--group-color);
}

.tab-btn.active {
  border-color: var(--group-color);
  background: var(--group-color);
  color: white;
  box-shadow: 0 2px 6px color-mix(in srgb, var(--group-color) 40%, transparent);
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
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.35);
  font-size: 0.7rem;
  font-weight: 700;
  padding: 0 4px;
}

.tab-btn:not(.active) .tab-count {
  background: #f3f4f6;
  color: #374151;
}
</style>
