<template>
  <!-- Export frame for weekly menu capture (rendered off-screen) -->
  <div ref="exportRef" class="export-frame" aria-hidden="true">
    <!-- Header: Title, week range, baby name -->
    <div class="export-header">
      <div class="export-header__top">
        <span class="export-logo">Pakulab</span>
        <span class="export-badge">PRO</span>
      </div>
      <h1 class="export-title">Menú Semanal</h1>
      <p class="export-subtitle">{{ weekLabel }}</p>
      <p v-if="babyName" class="export-baby">{{ babyName }}</p>
    </div>

    <!-- 7×3 Grid: Days × Meals -->
    <div class="export-grid">
      <!-- Day columns -->
      <div
        v-for="day in days"
        :key="day.label"
        class="export-day"
      >
        <!-- Day header -->
        <div class="export-day__header">
          <span class="export-day__name">{{ day.label }}</span>
          <span class="export-day__date">{{ day.date }}</span>
        </div>

        <!-- Meals for this day -->
        <div class="export-day__meals">
          <div
            v-for="meal in day.meals"
            :key="meal.type"
            class="export-meal"
          >
            <span class="export-meal__type">{{ meal.type }}</span>
            <div class="export-meal__content">
              <template v-if="meal.plateName">
                <span class="export-meal__plate">{{ meal.plateName }}</span>
                <!-- Food list with A/L color indicators -->
                <ul v-if="meal.foods.length > 0" class="export-foods">
                  <li
                    v-for="(food, index) in meal.foods"
                    :key="index"
                    class="export-food"
                  >
                    <span
                      class="export-food__dot"
                      :class="`export-food__dot--${food.alClassification.toLowerCase()}`"
                    />
                    <span class="export-food__name">{{ food.name }}</span>
                  </li>
                </ul>
              </template>
              <span v-else class="export-meal__plate export-meal__plate--empty">
                Sin plato
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer: Stats and disclaimer -->
    <div class="export-footer">
      <div class="export-stats">
        <span class="export-stat">
          <strong>{{ weekStats.total }}</strong> platos asignados
        </span>
        <span class="export-stat">
          <strong>{{ weekStats.balanced }}</strong> equilibrados
        </span>
        <span class="export-stat">
          <strong>{{ weekStats.empty }}</strong> sin planificar
        </span>
      </div>
      <p class="export-disclaimer">
        Información orientativa. Consultá siempre con tu pediatra.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

/** Food classification for A/L dots */
type ALClassification = 'ASTRINGENT' | 'LAXATIVE' | 'NEUTRAL'

/** Single food item in a meal */
interface ExportFood {
  name: string
  alClassification: ALClassification
}

/** Single meal slot (Desayuno/Comida/Cena) */
interface ExportMeal {
  type: string
  plateName: string | null
  foods: ExportFood[]
}

/** Single day with its meals */
interface ExportDay {
  label: string
  date: string
  meals: ExportMeal[]
}

/** Component props */
const props = defineProps<{
  weekStart: string
  weekEnd: string
  weekLabel: string
  babyName: string
  days: ExportDay[]
  weekStats: {
    total: number
    balanced: number
    empty: number
  }
}>()

const emit = defineEmits<{
  done: [dataUrl: string]
  error: [message: string]
}>()

const exportRef = ref<HTMLElement | null>(null)

/**
 * Capture the export frame as PNG using html2canvas.
 * Called externally via template ref.
 */
async function capture(): Promise<void> {
  if (!exportRef.value) {
    emit('error', 'Elemento de exportación no disponible')
    return
  }

  try {
    // Dynamic import to avoid increasing initial bundle
    const { default: html2canvas } = await import('html2canvas')
    const canvas = await html2canvas(exportRef.value, {
      scale: 1.5,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    })
    const dataUrl = canvas.toDataURL('image/png')
    emit('done', dataUrl)
  } catch (err) {
    emit('error', err instanceof Error ? err.message : 'Error al exportar')
  }
}

defineExpose({ capture })
</script>

<style scoped>
/* Export frame positioned off-screen */
.export-frame {
  position: fixed;
  top: -9999px;
  left: -9999px;
  width: 1200px;
  background: #ffffff;
  padding: 32px;
  border-radius: 12px;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

/* Header */
.export-header {
  text-align: center;
  padding-bottom: 24px;
  border-bottom: 2px solid #e5e7eb;
  margin-bottom: 24px;
}

.export-header__top {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 16px;
}

.export-logo {
  font-size: 24px;
  font-weight: 700;
  color: #1a1a1a;
  letter-spacing: -0.02em;
}

.export-badge {
  font-size: 11px;
  font-weight: 700;
  color: #ffffff;
  background: #1a1a1a;
  padding: 4px 8px;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.export-title {
  font-size: 28px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0 0 8px 0;
  letter-spacing: -0.02em;
}

.export-subtitle {
  font-size: 16px;
  color: #6b7280;
  margin: 0 0 4px 0;
  text-transform: capitalize;
}

.export-baby {
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 8px 0 0 0;
}

/* Grid: 7 columns (days) */
.export-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 12px;
  margin-bottom: 24px;
}

/* Day column */
.export-day {
  background: #f9fafb;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
}

.export-day__header {
  background: #1a1a1a;
  color: #ffffff;
  padding: 12px 8px;
  text-align: center;
}

.export-day__name {
  display: block;
  font-size: 13px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 4px;
}

.export-day__date {
  display: block;
  font-size: 14px;
  opacity: 0.9;
}

.export-day__meals {
  display: flex;
  flex-direction: column;
}

/* Meal slot */
.export-meal {
  padding: 10px 8px;
  border-bottom: 1px solid #e5e7eb;
  min-height: 100px;
}

.export-meal:last-child {
  border-bottom: none;
}

.export-meal__type {
  display: block;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #9ca3af;
  margin-bottom: 6px;
}

.export-meal__content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.export-meal__plate {
  font-size: 11px;
  font-weight: 600;
  color: #6b7280;
  line-height: 1.2;
  margin-bottom: 4px;
}

.export-meal__plate--empty {
  color: #9ca3af;
  font-style: italic;
}

/* Food list */
.export-foods {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.export-food {
  display: flex;
  align-items: center;
  gap: 5px;
}

.export-food__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.export-food__dot--astringent {
  background: #ef4444;
}

.export-food__dot--laxative {
  background: #22c55e;
}

.export-food__dot--neutral {
  background: #9ca3af;
}

.export-food__name {
  font-size: 11px;
  color: #374151;
  line-height: 1.2;
}

/* Footer */
.export-footer {
  border-top: 2px solid #e5e7eb;
  padding-top: 24px;
  text-align: center;
}

.export-stats {
  display: flex;
  justify-content: center;
  gap: 32px;
  margin-bottom: 16px;
}

.export-stat {
  font-size: 14px;
  color: #6b7280;
}

.export-stat strong {
  color: #1a1a1a;
  font-weight: 700;
}

.export-disclaimer {
  font-size: 12px;
  color: #9ca3af;
  margin: 0;
  font-style: italic;
}
</style>
