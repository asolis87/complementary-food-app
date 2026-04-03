<template>
  <div class="plate-contents">
    <!-- ─── Header row ────────────────────────────────────────────────────── -->
    <div class="contents-header">
      <h4 class="contents-title">Contenido del Plato</h4>
      <span class="contents-counter">{{ filledGroupCount }}/{{ groupCount }} Seleccionados</span>
    </div>

    <!-- ─── Group slot grid ──────────────────────────────────────────────── -->
    <div class="contents-grid">
      <div
        v-for="group in activeGroups"
        :key="group"
        class="group-slot"
        :class="[`group-slot--${group.toLowerCase()}`, { 'group-slot--filled': hasItemsInGroup(group) }]"
        :style="slotStyle(group)"
        @click="onSlotClick(group)"
      >
        <!-- Empty state -->
        <template v-if="!hasItemsInGroup(group)">
          <span
            class="group-dot"
            :style="{ background: groupColor(group) }"
            aria-hidden="true"
          ></span>
          <span class="group-label-empty">Añadir {{ groupShortLabel(group) }}...</span>
        </template>

        <!-- Filled state -->
        <template v-else>
          <div class="group-items">
            <div
              v-for="item in itemsForGroup(group)"
              :key="item.id"
              class="food-chip"
            >
              <!-- A/L dot -->
              <span
                class="al-dot"
                :class="`al-dot--${item.food.alClassification.toLowerCase()}`"
                :title="alLabel(item.food.alClassification)"
                aria-hidden="true"
              ></span>

              <!-- Food name -->
              <span class="food-name">{{ item.food.name }}</span>

              <!-- Allergen indicator -->
              <span
                v-if="item.food.isAllergen"
                class="material-symbols-outlined allergen-icon"
                :title="`Alérgeno: ${item.food.allergenType ?? 'Sí'}`"
                aria-hidden="true"
              >warning</span>

              <!-- Remove button -->
              <button
                class="remove-btn"
                :aria-label="`Quitar ${item.food.name}`"
                @click.stop="emit('remove-item', item.id)"
              >
                <span class="material-symbols-outlined remove-icon" aria-hidden="true">close</span>
              </button>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { FoodGroup, ALClassification } from '@pakulab/shared'
import { FOOD_GROUP_LABELS, BASE_GROUPS, OPTIONAL_GROUPS } from '@pakulab/shared'
import type { PlateItemDraft } from '@/shared/stores/plateStore.js'

// ─── Props & emits ─────────────────────────────────────────────────────────

const props = defineProps<{
  items: PlateItemDraft[]
  groupCount: 4 | 5
}>()

const emit = defineEmits<{
  'select-group': [group: FoodGroup]
  'remove-item': [itemId: string]
}>()

// ─── Active groups ─────────────────────────────────────────────────────────

const activeGroups = computed<FoodGroup[]>(() => {
  const groups: FoodGroup[] = [...BASE_GROUPS]
  if (props.groupCount === 5) {
    groups.push(...OPTIONAL_GROUPS)
  }
  return groups
})

// ─── Derived state ─────────────────────────────────────────────────────────

/** Number of groups that have at least one item */
const filledGroupCount = computed(() => {
  return activeGroups.value.filter((group) => hasItemsInGroup(group)).length
})

function hasItemsInGroup(group: FoodGroup): boolean {
  return props.items.some((item) => item.groupAssignment === group)
}

function itemsForGroup(group: FoodGroup): PlateItemDraft[] {
  return props.items.filter((item) => item.groupAssignment === group)
}

// ─── Group colors & labels ─────────────────────────────────────────────────

/** Primary fill color for each group */
function groupColor(group: FoodGroup): string {
  const colorMap: Record<FoodGroup, string> = {
    FRUIT: 'var(--md3-group-fruit)',
    VEGETABLE: 'var(--md3-group-vegetable)',
    CEREAL_TUBER: 'var(--md3-group-cereal)',
    PROTEIN: 'var(--md3-surface-container-high)',
    HEALTHY_FAT: 'var(--md3-group-fat)',
  }
  return colorMap[group]
}

/** Background style for a filled slot (group color at ~15% opacity) */
function slotStyle(group: FoodGroup): Record<string, string> {
  if (!hasItemsInGroup(group)) return {}
  const colorMap: Record<FoodGroup, string> = {
    FRUIT: 'rgba(255, 197, 167, 0.18)',       // --md3-group-fruit
    VEGETABLE: 'rgba(126, 239, 192, 0.18)',   // --md3-group-vegetable
    CEREAL_TUBER: 'rgba(140, 254, 206, 0.18)', // --md3-group-cereal
    PROTEIN: 'rgba(223, 227, 227, 0.4)',       // --md3-surface-container-high
    HEALTHY_FAT: 'rgba(211, 188, 253, 0.18)', // --md3-group-fat
  }
  return { background: colorMap[group] }
}

/** Short label for empty state placeholder text */
function groupShortLabel(group: FoodGroup): string {
  const shortMap: Record<FoodGroup, string> = {
    FRUIT: 'Fruta',
    VEGETABLE: 'Verdura',
    CEREAL_TUBER: 'Cereal',
    PROTEIN: 'Proteína',
    HEALTHY_FAT: 'Grasa Saludable',
  }
  return shortMap[group]
}

/** Full label from shared package (for aria / tooltips) */
function groupLabel(group: FoodGroup): string {
  return FOOD_GROUP_LABELS[group]
}

/** A/L classification label */
function alLabel(classification: ALClassification): string {
  const map: Record<ALClassification, string> = {
    ASTRINGENT: 'Astringente',
    LAXATIVE: 'Laxante',
    NEUTRAL: 'Neutro',
  }
  return map[classification]
}

// ─── Handlers ──────────────────────────────────────────────────────────────

function onSlotClick(group: FoodGroup): void {
  emit('select-group', group)
}
</script>

<style scoped>
/* ─── Container ─────────────────────────────────────────────────────────── */
.plate-contents {
  background: var(--md3-surface-container-lowest);
  border-radius: var(--md3-rounded-md);
  padding: var(--md3-space-4);
  box-shadow: var(--md3-shadow-ambient);
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-3);
}

/* ─── Header ─────────────────────────────────────────────────────────────── */
.contents-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--md3-space-2);
}

.contents-title {
  margin: 0;
  font-family: var(--md3-font-headline);
  font-size: var(--md3-title-md);
  font-weight: var(--md3-weight-bold);
  color: var(--md3-on-surface);
}

.contents-counter {
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-sm);
  font-weight: var(--md3-weight-bold);
  color: var(--md3-primary);
  white-space: nowrap;
  flex-shrink: 0;
}

/* ─── Grid ───────────────────────────────────────────────────────────────── */
.contents-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

/* ─── Group slot ─────────────────────────────────────────────────────────── */
.group-slot {
  padding: 0.75rem;
  border-radius: 1rem;
  cursor: pointer;
  transition:
    background var(--md3-transition-fast),
    border-color var(--md3-transition-fast),
    box-shadow var(--md3-transition-fast);
  min-height: 3.5rem;
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;

  /* Empty state: dashed border */
  background: var(--md3-surface-container-low);
  border: 2px dashed rgba(171, 173, 174, 0.35); /* --md3-outline-variant at ~35% */
}

.group-slot:hover {
  border-color: rgba(171, 173, 174, 0.6);
  box-shadow: var(--md3-shadow-soft);
}

/* Filled state: solid background, no dashed border */
.group-slot--filled {
  border: 2px solid transparent;
  align-items: flex-start;
}

.group-slot--filled:hover {
  box-shadow: var(--md3-shadow-card);
}

/* ─── Empty state elements ───────────────────────────────────────────────── */
.group-dot {
  flex-shrink: 0;
  margin-top: 0.1rem;
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
}

.group-label-empty {
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-sm);
  font-style: italic;
  color: var(--md3-on-surface-variant);
  line-height: 1.4;
}

/* ─── Filled state elements ──────────────────────────────────────────────── */
.group-items {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  width: 100%;
}

.food-chip {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  width: 100%;
}

.food-name {
  flex: 1;
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-sm);
  font-weight: var(--md3-weight-bold);
  color: var(--md3-on-surface);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ─── A/L classification dot ─────────────────────────────────────────────── */
.al-dot {
  flex-shrink: 0;
  width: 0.4rem;
  height: 0.4rem;
  border-radius: 50%;
}

.al-dot--astringent {
  background: var(--md3-secondary);
}

.al-dot--laxative {
  background: var(--md3-tertiary);
}

.al-dot--neutral {
  background: var(--md3-outline);
}

/* ─── Allergen indicator ─────────────────────────────────────────────────── */
.allergen-icon {
  flex-shrink: 0;
  font-size: 0.75rem;
  color: var(--md3-error);
}

/* ─── Remove button ──────────────────────────────────────────────────────── */
.remove-btn {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.25rem;
  height: 1.25rem;
  border: none;
  border-radius: 50%;
  background: transparent;
  cursor: pointer;
  color: var(--md3-on-surface-variant);
  padding: 0;
  opacity: 0;
  transition:
    opacity var(--md3-transition-fast),
    background var(--md3-transition-fast),
    color var(--md3-transition-fast);
}

.food-chip:hover .remove-btn {
  opacity: 1;
}

.remove-btn:hover {
  background: var(--md3-error-container);
  color: var(--md3-on-error-container);
}

.remove-icon {
  font-size: 0.875rem;
}

/* ─── Healthy Fat slot spans both columns when present ───────────────────── */
/* Only when groupCount=5 and it's the 5th slot */
.group-slot--healthy_fat {
  grid-column: 1 / -1;
}
</style>
