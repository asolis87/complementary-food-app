/**
 * MealSlotIcon.vue
 *
 * Maps meal types to Phosphor icon components for the dashboard.
 */
<script setup lang="ts">
import { computed } from 'vue'
import {
  PhCoffee,
  PhSun,
  PhMoon,
  PhCookie,
} from '@phosphor-icons/vue'

/** Props */
const props = defineProps<{
  /** Meal type */
  mealType: string
  /** Icon size in pixels (default: 24) */
  size?: number
  /** Icon weight variant */
  weight?: 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone'
}>()

/** Meal type to icon mapping */
const MEAL_ICONS: Record<string, typeof PhCoffee> = {
  BREAKFAST: PhCoffee,
  LUNCH: PhSun,
  DINNER: PhMoon,
  SNACK: PhCookie,
  SNACK_1: PhCookie,
  SNACK_2: PhCookie,
}

/** The icon component to render */
const iconComponent = computed(() => MEAL_ICONS[props.mealType] ?? PhSun)

/** Icon size with default */
const iconSize = computed(() => props.size ?? 24)

/** Icon weight with default */
const iconWeight = computed(() => props.weight ?? 'regular')
</script>

<template>
  <component
    :is="iconComponent"
    :size="iconSize"
    :weight="iconWeight"
    class="meal-slot-icon"
    aria-hidden="true"
  />
</template>

<style scoped>
.meal-slot-icon {
  display: inline-block;
  vertical-align: middle;
  flex-shrink: 0;
}
</style>