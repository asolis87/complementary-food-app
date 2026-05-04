<template>
  <section
    class="dashboard-card logs-card"
    role="region"
    aria-label="Registros de hoy"
  >
    <h2 class="card-title">¿Qué comió hoy?</h2>

    <div v-if="!hasSlots && !loading" class="empty-state">
      <p class="empty-text">Aún no hay registros para hoy.</p>
    </div>

    <!-- Loading skeleton -->
    <div v-if="loading" class="loading-skeleton">
      <div v-for="n in 4" :key="n" class="skeleton-slot">
        <div class="skeleton-line skeleton-line-short" />
        <div class="skeleton-line skeleton-line-medium" />
      </div>
    </div>

    <!-- Meal slots -->
    <ul v-if="hasSlots && !loading" class="slot-list" role="list">
      <li
        v-for="slot in mealSlots"
        :key="slot.mealType"
        class="slot-item"
        :class="{
          'slot-item--registered': slot.isRegistered,
          'slot-item--pending': !slot.isRegistered,
        }"
      >
        <div class="slot-info">
          <span class="slot-icon" aria-hidden="true">{{ slot.icon }}</span>
          <span class="slot-label">{{ slot.label }}</span>
          <span v-if="slot.isRegistered && slot.registeredTime" class="slot-time">
            {{ slot.registeredTime }}
          </span>
          <span v-else-if="!slot.isRegistered" class="slot-pending-badge">
            Pendiente
          </span>
        </div>

        <div class="slot-actions">
          <!-- Registered: show food count + edit button -->
          <template v-if="slot.isRegistered">
            <span class="slot-food-count" :aria-label="`${slot.foodCount} alimentos registrados`">
              {{ slot.foodCount }} alimento{{ slot.foodCount !== 1 ? 's' : '' }}
            </span>
            <button
              class="btn-edit"
              aria-label="Editar registro"
              @click="$emit('edit', slot.mealType)"
            >
              Editar
            </button>
          </template>

          <!-- Pending: show register button -->
          <button
            v-else
            class="btn-register"
            :aria-label="`Registrar ${slot.label}`"
            @click="$emit('register', slot.mealType)"
          >
            Registrar
          </button>
        </div>
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { MealSlot, MealType } from '@pakulab/shared'
import { DASHBOARD_MEAL_SLOTS } from '@pakulab/shared'

const props = defineProps<{
  mealSlots: MealSlot[]
  loading?: boolean
}>()

defineEmits<{
  register: [mealType: MealType]
  edit: [mealType: MealType]
}>()

/** Merge the static slot definitions with API slot data */
const mealSlots = computed<MealSlot[]>(() => {
  return DASHBOARD_MEAL_SLOTS.map((def) => {
    const apiSlot = props.mealSlots.find((s) => s.mealType === def.mealType)
    if (apiSlot) return apiSlot
    // Fallback: create a pending slot from the static definition
    return {
      mealType: def.mealType,
      label: def.label,
      icon: def.icon,
      isRegistered: false,
      registeredTime: null,
      foodCount: 0,
    }
  })
})

const hasSlots = computed(() => props.mealSlots.length > 0)
</script>

<style scoped>
.logs-card {
  /* Card styling inherited from dashboard-card */
}

.card-title {
  margin: 0 0 var(--md3-space-3);
  font-family: var(--md3-font-headline);
  font-size: var(--md3-title-sm);
  font-weight: var(--md3-weight-semibold);
  color: var(--md3-on-surface);
  line-height: var(--md3-title-line-height);
}

/* ── Slots ──────────────────────────────────────────────── */
.slot-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-2);
}

.slot-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--md3-space-2) var(--md3-space-3);
  border-radius: var(--md3-rounded-md);
  transition: background var(--md3-transition-fast);
}

.slot-item--pending {
  background: var(--md3-surface-container-low);
  border: 1px dashed var(--md3-outline-variant);
}

.slot-item--registered {
  background: var(--md3-primary-container);
}

.slot-info {
  display: flex;
  align-items: center;
  gap: var(--md3-space-2);
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-md);
  color: var(--md3-on-surface);
}

.slot-icon {
  font-size: 1.25rem;
  flex-shrink: 0;
}

.slot-label {
  font-weight: var(--md3-weight-medium);
}

.slot-time {
  color: var(--md3-on-surface-variant);
  font-size: var(--md3-body-sm);
  font-family: var(--md3-font-mono, monospace);
}

.slot-pending-badge {
  font-size: var(--md3-label-sm);
  font-weight: var(--md3-weight-medium);
  color: var(--md3-on-surface-variant);
  background: var(--md3-surface-container-high);
  padding: 0.1rem 0.5rem;
  border-radius: var(--md3-rounded-full);
}

.slot-actions {
  display: flex;
  align-items: center;
  gap: var(--md3-space-2);
  flex-shrink: 0;
}

.slot-food-count {
  font-size: var(--md3-label-sm);
  color: var(--md3-on-primary-container);
  font-weight: var(--md3-weight-medium);
}

/* ── Buttons ──────────────────────────────────────────────── */
.btn-register {
  display: inline-flex;
  align-items: center;
  padding: 0.4rem 1rem;
  border: none;
  border-radius: var(--md3-rounded-full);
  background: var(--md3-primary);
  color: var(--md3-on-primary);
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-sm);
  font-weight: var(--md3-weight-semibold);
  cursor: pointer;
  transition: background var(--md3-transition-fast), opacity var(--md3-transition-fast);
}

.btn-register:hover {
  opacity: 0.9;
}

.btn-register:focus-visible {
  outline: 2px solid var(--md3-primary);
  outline-offset: 2px;
}

.btn-edit {
  display: inline-flex;
  align-items: center;
  padding: 0.4rem 0.75rem;
  border: 1px solid var(--md3-outline);
  border-radius: var(--md3-rounded-full);
  background: transparent;
  color: var(--md3-on-primary-container);
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-sm);
  font-weight: var(--md3-weight-medium);
  cursor: pointer;
  transition: background var(--md3-transition-fast);
}

.btn-edit:hover {
  background: var(--md3-surface-container-high);
}

.btn-edit:focus-visible {
  outline: 2px solid var(--md3-primary);
  outline-offset: 2px;
}

/* ── Empty state ─────────────────────────────────────────── */
.empty-state {
  text-align: center;
  padding: var(--md3-space-4) 0;
}

.empty-text {
  margin: 0;
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-md);
  color: var(--md3-on-surface-variant);
}

/* ── Loading skeleton ─────────────────────────────────────── */
.loading-skeleton {
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-2);
}

.skeleton-slot {
  background: var(--md3-surface-container-low);
  border-radius: var(--md3-rounded-md);
  padding: var(--md3-space-3);
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-1);
}

.skeleton-line {
  height: 14px;
  border-radius: var(--md3-rounded-sm);
  background: linear-gradient(
    90deg,
    var(--md3-surface-container) 25%,
    var(--md3-surface-container-high) 50%,
    var(--md3-surface-container) 75%
  );
  background-size: 800px 100%;
  animation: shimmer 1.4s infinite linear;
}

.skeleton-line-short { width: 40%; }
.skeleton-line-medium { width: 65%; }

@keyframes shimmer {
  0% { background-position: -400px 0; }
  100% { background-position: 400px 0; }
}
</style>
