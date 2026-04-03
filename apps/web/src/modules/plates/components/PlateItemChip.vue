<template>
  <div class="plate-item-chip" :class="chipClass">
    <!-- Row 1: name + actions -->
    <div class="chip-row chip-row-top">
      <span class="chip-name" :title="item.food.name">{{ item.food.name }}</span>

      <!-- Allergen warning icon -->
      <span
        v-if="item.food.isAllergen"
        class="chip-allergen"
        :title="allergenTitle"
        aria-label="Alérgeno potencial"
        role="img"
      >⚠️</span>

      <!-- Remove button -->
      <button
        class="chip-remove"
        :aria-label="`Quitar ${item.food.name}`"
        @click.stop="emit('remove', item.id)"
      >
        ✕
      </button>
    </div>

    <!-- Row 2: A/L badge + allergen text if needed -->
    <div class="chip-row chip-row-bottom">
      <!-- A/L dot + label -->
      <span class="al-badge" :class="alBadgeClass">
        <span class="al-dot" aria-hidden="true" />
        <span class="al-label">{{ alShortLabel }}</span>
      </span>

      <!-- Allergen type text (only when available) -->
      <span
        v-if="item.food.isAllergen && item.food.allergenType"
        class="chip-allergen-type"
      >
        {{ item.food.allergenType }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { PlateItemDraft } from '@/shared/stores/plateStore.js'

const props = defineProps<{
  item: PlateItemDraft
}>()

const emit = defineEmits<{
  remove: [itemId: string]
}>()

const alBadgeClass = computed(() => {
  switch (props.item.food.alClassification) {
    case 'ASTRINGENT':
      return 'badge-astringent'
    case 'LAXATIVE':
      return 'badge-laxative'
    default:
      return 'badge-neutral'
  }
})

/** Single letter shorthand shown in the badge — consistent with BalanceIndicator */
const alShortLabel = computed(() => {
  switch (props.item.food.alClassification) {
    case 'ASTRINGENT':
      return 'A'
    case 'LAXATIVE':
      return 'L'
    default:
      return 'N'
  }
})

/** Full title for the allergen tooltip */
const allergenTitle = computed(() => {
  if (!props.item.food.isAllergen) return ''
  return props.item.food.allergenType
    ? `Alérgeno: ${props.item.food.allergenType}`
    : 'Alérgeno potencial'
})

/** Light left-border accent that matches the A/L color */
const chipClass = computed(() => {
  switch (props.item.food.alClassification) {
    case 'ASTRINGENT':
      return 'chip-astringent'
    case 'LAXATIVE':
      return 'chip-laxative'
    default:
      return 'chip-neutral'
  }
})
</script>

<style scoped>
/* ── Base chip card ────────────────────────────────────────────────── */
.plate-item-chip {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  background: var(--md3-surface-container-lowest);
  border: 1px solid var(--md3-outline-variant);
  border-left-width: 3px;
  border-radius: var(--md3-rounded-sm);
  padding: 0.35rem 0.5rem;
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-sm);
  width: 100%;
  box-shadow: var(--md3-shadow-soft);
  transition: box-shadow var(--md3-transition-fast);
}

.plate-item-chip:hover {
  box-shadow: var(--md3-shadow-card);
}

/* Left border accent color per A/L classification */
.chip-astringent {
  border-left-color: var(--md3-error);
}

.chip-laxative {
  border-left-color: var(--md3-primary);
}

.chip-neutral {
  border-left-color: var(--md3-outline-variant);
}

/* ── Rows ──────────────────────────────────────────────────────────── */
.chip-row {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.chip-row-top {
  gap: 0.3rem;
}

.chip-row-bottom {
  flex-wrap: wrap;
  row-gap: 0.1rem;
}

/* ── Food name ─────────────────────────────────────────────────────── */
.chip-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--md3-on-surface);
  font-weight: var(--md3-weight-medium);
  font-size: var(--md3-body-sm);
  line-height: 1.2;
}

/* ── Allergen warning ──────────────────────────────────────────────── */
.chip-allergen {
  flex-shrink: 0;
  font-size: var(--md3-body-sm);
  line-height: 1;
  cursor: help;
}

.chip-allergen-type {
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-sm);
  color: var(--md3-on-tertiary-container);
  background: var(--md3-tertiary-container);
  border-radius: var(--md3-rounded-sm);
  padding: 0.05rem 0.25rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 80px;
}

/* ── Remove button ─────────────────────────────────────────────────── */
.chip-remove {
  flex-shrink: 0;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--md3-outline-variant);
  font-size: var(--md3-label-sm);
  line-height: 1;
  padding: 0.1rem;
  margin-left: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: var(--md3-rounded-full);
  transition: color var(--md3-transition-fast), background var(--md3-transition-fast);
}

.chip-remove:hover {
  color: var(--md3-on-error-container);
  background: var(--md3-error-container);
}

/* ── A/L badge ─────────────────────────────────────────────────────── */
.al-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  border-radius: var(--md3-rounded-full);
  padding: 0.1rem 0.35rem 0.1rem 0.2rem;
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-sm);
  font-weight: var(--md3-weight-bold);
  line-height: 1;
  letter-spacing: var(--md3-label-tracking);
}

.al-dot {
  width: 6px;
  height: 6px;
  border-radius: var(--md3-rounded-full);
  flex-shrink: 0;
}

/* Badge variants */
.badge-astringent {
  color: var(--md3-error);
  background: var(--md3-error-container);
}

.badge-astringent .al-dot {
  background: var(--md3-error);
}

.badge-laxative {
  color: var(--md3-on-primary-container);
  background: var(--md3-primary-container);
}

.badge-laxative .al-dot {
  background: var(--md3-primary);
}

.badge-neutral {
  color: var(--md3-on-surface-variant);
  background: var(--md3-surface-container);
}

.badge-neutral .al-dot {
  background: var(--md3-outline);
}
</style>
