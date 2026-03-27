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
  background: white;
  border: 1px solid #e5e7eb;
  border-left-width: 3px;
  border-radius: 0.5rem;
  padding: 0.35rem 0.5rem;
  font-size: 0.75rem;
  width: 100%;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  transition: box-shadow 0.15s ease;
}

.plate-item-chip:hover {
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

/* Left border accent color per A/L classification */
.chip-astringent {
  border-left-color: #ef4444;
}

.chip-laxative {
  border-left-color: #10b981;
}

.chip-neutral {
  border-left-color: #9ca3af;
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
  color: #111827;
  font-weight: 500;
  font-size: 0.8rem;
  line-height: 1.2;
}

/* ── Allergen warning ──────────────────────────────────────────────── */
.chip-allergen {
  flex-shrink: 0;
  font-size: 0.8rem;
  line-height: 1;
  cursor: help;
}

.chip-allergen-type {
  font-size: 0.65rem;
  color: #b45309;
  background: #fef3c7;
  border-radius: 0.25rem;
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
  color: #d1d5db;
  font-size: 0.7rem;
  line-height: 1;
  padding: 0.1rem;
  margin-left: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 9999px;
  transition: color 0.15s, background 0.15s;
}

.chip-remove:hover {
  color: #ef4444;
  background: #fee2e2;
}

/* ── A/L badge ─────────────────────────────────────────────────────── */
.al-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  border-radius: 9999px;
  padding: 0.1rem 0.35rem 0.1rem 0.2rem;
  font-size: 0.65rem;
  font-weight: 700;
  line-height: 1;
  letter-spacing: 0.03em;
}

.al-dot {
  width: 6px;
  height: 6px;
  border-radius: 9999px;
  flex-shrink: 0;
}

.al-label {
  /* inherits color from parent .al-badge */
}

/* Badge variants */
.badge-astringent {
  color: #dc2626;
  background: #fef2f2;
}

.badge-astringent .al-dot {
  background: #ef4444;
}

.badge-laxative {
  color: #059669;
  background: #ecfdf5;
}

.badge-laxative .al-dot {
  background: #10b981;
}

.badge-neutral {
  color: #6b7280;
  background: #f9fafb;
}

.badge-neutral .al-dot {
  background: #9ca3af;
}
</style>
