<template>
  <section
    class="dashboard-card logs-card"
    role="region"
    aria-label="Registros de hoy"
  >
    <!-- Card header -->
    <div class="card-header">
      <h2 class="card-title">¿Qué comió hoy?</h2>
    </div>

    <!-- Empty state -->
    <div v-if="!hasSlots && !loading" class="empty-state">
      <p class="empty-text">Aún no hay registros para hoy.</p>
    </div>

    <!-- Loading skeleton -->
    <div v-if="loading" class="loading-skeleton">
      <div v-for="n in 4" :key="n" class="skeleton-slot">
        <div class="skeleton-icon" />
        <div class="skeleton-content">
          <div class="skeleton-line skeleton-line-short" />
          <div class="skeleton-line skeleton-line-medium" />
        </div>
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
        <!-- Slot left group: Icon and Label -->
        <div class="slot-left-group">
          <div class="slot-icon-wrapper" :class="{ 'icon--active': slot.isRegistered }">
            <MealSlotIcon :meal-type="slot.mealType" :size="20" weight="bold" />
          </div>
          <div class="slot-text-content">
            <span class="slot-label">{{ slot.label }}</span>
            <span v-if="slot.isRegistered && slot.registeredTime" class="slot-time">
              {{ slot.registeredTime }} · {{ slot.foodCount }} alimento{{ slot.foodCount !== 1 ? 's' : '' }}
            </span>
          </div>
        </div>

        <!-- Status tag in the middle -->
        <span
          class="status-chip"
          :class="slot.isRegistered ? 'status-chip--registered' : 'status-chip--pending'"
        >
          {{ slot.isRegistered ? 'Registrado' : 'Pendiente' }}
        </span>

        <!-- Slot action on the right -->
        <div class="slot-actions">
          <button
            v-if="slot.isRegistered"
            class="btn-action btn-edit"
            :aria-label="`Editar registro de ${slot.label}`"
            @click="$emit('edit', slot.mealType)"
          >
            Editar
          </button>
          <button
            v-else
            class="btn-action btn-register"
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
import MealSlotIcon from '@/shared/components/MealSlotIcon.vue'

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

const hasSlots = computed(() => props.mealSlots && props.mealSlots.length > 0)
</script>

<style scoped>
/* ═══════════════════════════════════════════════════════════════════════
   TodayLogsCard — Nurture & Growth redesign
   Modern card with icon badges, better visual hierarchy, and improved
   action buttons with Material Symbols icons.
   ═══════════════════════════════════════════════════════════════════════ */

.logs-card {
  /* Card styling inherited from dashboard-card */
}

.card-header {
  margin-bottom: var(--md3-space-4);
}

.card-title {
  margin: 0;
  font-family: var(--md3-font-headline);
  font-size: var(--md3-title-lg);
  font-weight: var(--md3-weight-semibold);
  color: var(--md3-on-surface);
  line-height: var(--md3-title-line-height);
}

/* ── Slots ─────────────────────────────────────────────── */
.slot-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-3);
}

.slot-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  border-radius: var(--md3-rounded-lg);
  transition: background var(--md3-transition-fast), box-shadow var(--md3-transition-fast);
  gap: var(--md3-space-2);
}

.slot-item--pending {
  background: var(--md3-surface-container-low);
  border: 1px dashed var(--md3-outline-variant);
}

.slot-item--registered {
  background: var(--md3-primary-container);
}

.slot-item--registered:hover {
  box-shadow: var(--md3-shadow-card);
}

/* ── Slot Info ─────────────────────────────────────────── */
.slot-left-group {
  display: flex;
  align-items: center;
  gap: var(--md3-space-2);
  min-width: 0;
  flex: 1;
}

.slot-text-content {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.slot-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: var(--md3-rounded-lg);
  background: var(--md3-surface-container);
  color: var(--md3-on-surface-variant);
  flex-shrink: 0;
  transition: background var(--md3-transition-fast), color var(--md3-transition-fast);
}

.slot-icon-wrapper.icon--active {
  background: var(--md3-primary);
  color: var(--md3-on-primary);
}

.slot-label {
  font-family: var(--md3-font-headline);
  font-size: var(--md3-title-md);
  font-weight: var(--md3-weight-semibold);
  color: var(--md3-on-surface);
  line-height: var(--md3-title-line-height);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.status-chip {
  font-family: var(--md3-font-label);
  font-size: 11px;
  font-weight: var(--md3-weight-semibold);
  padding: 2px 8px;
  border-radius: var(--md3-rounded-full);
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
}

.status-chip--pending {
  background: var(--md3-surface-container-highest);
  color: var(--md3-on-surface-variant);
}

.status-chip--registered {
  background: var(--md3-primary-container);
  color: var(--md3-primary);
}

.slot-time {
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-sm);
  color: var(--md3-on-surface-variant);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ── Slot Actions ────────────────────────────────────────── */
.slot-actions {
  flex-shrink: 0;
}

.btn-action {
  display: inline-flex;
  align-items: center;
  gap: var(--md3-space-1);
  padding: 6px 12px;
  border-radius: var(--md3-rounded-full);
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-md);
  font-weight: var(--md3-weight-semibold);
  cursor: pointer;
  transition: background var(--md3-transition-fast), transform var(--md3-transition-fast);
  border: none;
}

.btn-action:active {
  transform: scale(0.98);
}

.btn-icon {
  font-size: 1.1rem;
}

.btn-register {
  background: var(--md3-primary);
  color: var(--md3-on-primary);
}

.btn-register:hover {
  background: var(--md3-primary-dim);
}

.btn-register:focus-visible {
  outline: 2px solid var(--md3-primary);
  outline-offset: 2px;
}

.btn-edit {
  background: var(--md3-surface-container-lowest);
  color: var(--md3-on-primary-container);
  border: 1px solid var(--md3-outline-variant);
}

.btn-edit:hover {
  background: var(--md3-surface-container);
}

.btn-edit:focus-visible {
  outline: 2px solid var(--md3-primary);
  outline-offset: 2px;
}

/* ── Empty state ─────────────────────────────────────────── */
.empty-state {
  text-align: center;
  padding: var(--md3-space-8) 0;
}

.empty-text {
  margin: 0;
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-lg);
  color: var(--md3-on-surface-variant);
}

/* ── Loading skeleton ─────────────────────────────────────── */
.loading-skeleton {
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-3);
}

.skeleton-slot {
  display: flex;
  align-items: center;
  gap: var(--md3-space-3);
  padding: var(--md3-space-4);
  background: var(--md3-surface-container-low);
  border-radius: var(--md3-rounded-lg);
}

.skeleton-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--md3-rounded-lg);
  background: var(--md3-surface-container-high);
}

.skeleton-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-2);
}

.skeleton-line {
  height: 16px;
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
.skeleton-line-medium { width: 60%; }

@keyframes shimmer {
  0% { background-position: -400px 0; }
  100% { background-position: 400px 0; }
}

/* ── Responsive ──────────────────────────────────────────── */
@media (max-width: 480px) {
  .slot-item {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--md3-space-3);
  }

  .slot-actions {
    width: 100%;
  }

  .btn-action {
    width: 100%;
    justify-content: center;
  }
}
</style>