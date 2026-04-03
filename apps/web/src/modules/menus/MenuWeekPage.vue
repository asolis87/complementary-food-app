<template>
  <TierGate required-tier="PRO" feature-name="Menú Semanal">
    <div class="menu-page">

      <!-- ─── Header ─── -->
      <header class="menu-header">
        <div class="menu-header__titles">
          <h1 class="menu-header__title">Menú Semanal</h1>
          <p class="menu-header__subtitle">Planificá la alimentación de tu bebé</p>
        </div>
        <div class="menu-header__actions">
          <button
            class="export-btn"
            :disabled="isExporting"
            :aria-label="isExporting ? 'Exportando menú...' : 'Exportar menú semanal'"
            @click="handleExport"
          >
            <span
              v-if="isExporting"
              class="export-btn__spinner"
              aria-hidden="true"
            />
            <template v-else>
              <span class="material-symbols-outlined" aria-hidden="true">download</span>
              <span>Exportar</span>
            </template>
          </button>
          <div class="week-nav">
            <button class="week-nav__btn" aria-label="Semana anterior" @click="prevWeek">
              <span class="material-symbols-outlined" aria-hidden="true">chevron_left</span>
            </button>
            <span class="week-nav__label">{{ weekLabel }}</span>
            <button class="week-nav__btn" aria-label="Semana siguiente" @click="nextWeek">
              <span class="material-symbols-outlined" aria-hidden="true">chevron_right</span>
            </button>
          </div>
        </div>
      </header>

      <!-- ─── Desktop: 7-column grid ─── -->
      <div class="week-grid" role="grid" :aria-label="`Menú semana del ${weekLabel}`">
        <div
          v-for="day in weekDays"
          :key="day.key"
          class="day-column"
          :class="{ 'day-column--today': day.isToday }"
          role="gridcell"
        >
          <!-- Day header -->
          <div class="day-header">
            <span class="day-header__name">{{ day.shortName }}</span>
            <span class="day-header__date" :class="{ 'day-header__date--today': day.isToday }">
              {{ day.dayNumber }}
            </span>
          </div>

          <!-- Meal slots -->
          <div class="meal-slots">
          <div
            v-for="meal in MEALS"
            :key="meal.key"
            class="meal-slot"
            :class="[`meal-slot--${meal.key}`, { 'meal-slot--loading': menuStore.isSlotLoading(day.key, meal.key) }]"
            :data-slot="`${day.key}:${meal.key}`"
          >
              <span class="meal-slot__label">
                <span class="material-symbols-outlined meal-slot__icon" aria-hidden="true">{{ meal.icon }}</span>
                {{ meal.name }}
              </span>

              <!-- Assigned plate -->
              <template v-if="getAssignedPlate(day.key, meal.key)">
                <div
                  class="plate-chip"
                  :class="{ 'plate-chip--loading': menuStore.isSlotLoading(day.key, meal.key) }"
                  @mouseenter="showTooltip(day.key, meal.key)"
                  @mouseleave="hideTooltip"
                >
                  <span class="plate-chip__score" :class="scoreClass(getAssignedPlate(day.key, meal.key)!)">
                    <span class="material-symbols-outlined plate-chip__score-icon" aria-hidden="true">
                      {{ scoreIcon(getAssignedPlate(day.key, meal.key)!) }}
                    </span>
                  </span>
                  <span class="plate-chip__name">{{ getAssignedPlate(day.key, meal.key)!.name }}</span>
                  <button
                    class="plate-chip__remove"
                    :aria-label="`Quitar ${getAssignedPlate(day.key, meal.key)!.name}`"
                    @click.stop="removePlate(day.key, meal.key)"
                  >
                    <span class="material-symbols-outlined" aria-hidden="true">close</span>
                  </button>
                </div>
                <!-- Food dots and overflow badge -->
                <div class="food-dots-container">
                  <span
                    v-for="(item, index) in getVisibleFoodDots(day.key, meal.key)"
                    :key="item.foodId"
                    class="food-dot"
                    :class="`food-dot--${item.food?.alClassification?.toLowerCase() ?? 'neutral'}`"
                    :aria-label="item.food?.name"
                  />
                  <span
                    v-if="getFoodOverflowCount(day.key, meal.key) > 0"
                    class="food-overflow-badge"
                  >
                    +{{ getFoodOverflowCount(day.key, meal.key) }}
                  </span>
                </div>

                <!-- Serve button -->
                <button
                  class="serve-btn"
                  :class="getServeButtonClass(day.key, meal.key)"
                  :disabled="isServeDisabled(day.key, meal.key)"
                  :title="getServeTooltip(day.key, meal.key)"
                  @click="handleServeClick(day.key, meal.key)"
                >
                  <span v-if="menuStore.isServeLoading(day.key, meal.key)" class="serve-btn__spinner" />
                  <template v-else>
                    <span class="material-symbols-outlined serve-btn__icon" aria-hidden="true">
                      {{ menuStore.getServedAt(day.key, meal.key) ? 'check_circle' : 'restaurant' }}
                    </span>
                    {{ getServeButtonLabel(day.key, meal.key) }}
                  </template>
                </button>
              </template>

              <!-- Empty slot -->
              <template v-else>
                <button
                  class="add-slot-btn"
                  :class="{ 'add-slot-btn--loading': menuStore.isSlotLoading(day.key, meal.key) }"
                  :aria-label="`Agregar plato a ${meal.name} del ${day.name}`"
                  :disabled="menuStore.isSlotLoading(day.key, meal.key)"
                  @click="openPicker(day.key, meal.key)"
                >
                  <span v-if="menuStore.isSlotLoading(day.key, meal.key)" class="slot-spinner" aria-hidden="true" />
                  <span v-else class="material-symbols-outlined" aria-hidden="true">add</span>
                </button>
              </template>
            </div>
          </div>
        </div>
      </div>

      <!-- Tooltip for desktop food list -->
      <Teleport to="body">
        <Transition name="tooltip-fade">
          <div
            v-if="tooltip.visible && tooltip.content"
            class="food-tooltip"
            :style="{ left: `${tooltip.x}px`, top: `${tooltip.y}px` }"
            role="tooltip"
          >
            <div class="food-tooltip__title">Alimentos</div>
            <ul class="food-tooltip__list">
              <li
                v-for="item in tooltip.content"
                :key="item.foodId"
                class="food-tooltip__item"
              >
                <span
                  class="food-tooltip__dot"
                  :class="`food-tooltip__dot--${item.food?.alClassification?.toLowerCase() ?? 'neutral'}`"
                />
                <span class="food-tooltip__name">{{ item.food?.name ?? 'Alimento' }}</span>
                <span class="food-tooltip__al">
                  {{ getALLabel(item.food?.alClassification) }}
                </span>
              </li>
            </ul>
          </div>
        </Transition>
      </Teleport>

      <!-- ─── Mobile: Day tabs + selected day detail ─── -->
      <div class="mobile-view" role="region" aria-label="Vista móvil del menú semanal">
        <!-- Day tabs -->
        <div class="day-tabs" role="tablist">
          <button
            v-for="day in weekDays"
            :key="day.key"
            class="day-tab"
            :class="{ 'day-tab--active': selectedDayKey === day.key, 'day-tab--today': day.isToday }"
            role="tab"
            :aria-selected="selectedDayKey === day.key"
            :aria-controls="`day-panel-${day.key}`"
            @click="selectedDayKey = day.key"
          >
            <span class="day-tab__short">{{ day.shortName }}</span>
            <span class="day-tab__number" :class="{ 'day-tab__number--today': day.isToday }">
              {{ day.dayNumber }}
            </span>
          </button>
        </div>

        <!-- Selected day meals -->
        <div
          v-for="day in weekDays"
          :key="`panel-${day.key}`"
          :id="`day-panel-${day.key}`"
          class="day-panel"
          role="tabpanel"
          :hidden="selectedDayKey !== day.key"
        >
          <div
            v-for="meal in MEALS"
            :key="meal.key"
            class="meal-row"
            :class="`meal-row--${meal.key}`"
          >
            <div class="meal-row__meta">
              <span class="material-symbols-outlined meal-row__icon" aria-hidden="true">{{ meal.icon }}</span>
              <span class="meal-row__name">{{ meal.name }}</span>
            </div>

            <!-- Assigned plate -->
            <template v-if="getAssignedPlate(day.key, meal.key)">
              <div class="mobile-plate-container">
                <!-- Plate name row -->
                <div class="plate-row-chip" :class="{ 'plate-row-chip--loading': menuStore.isSlotLoading(day.key, meal.key) }">
                  <span class="plate-row-chip__score" :class="scoreClass(getAssignedPlate(day.key, meal.key)!)">
                    <span class="material-symbols-outlined" aria-hidden="true">
                      {{ scoreIcon(getAssignedPlate(day.key, meal.key)!) }}
                    </span>
                  </span>
                  <span class="plate-row-chip__name">{{ getAssignedPlate(day.key, meal.key)!.name }}</span>
                  <button
                    class="plate-row-chip__remove"
                    :aria-label="`Quitar ${getAssignedPlate(day.key, meal.key)!.name}`"
                    @click="removePlate(day.key, meal.key)"
                  >
                    <span class="material-symbols-outlined" aria-hidden="true">close</span>
                  </button>
                </div>
                <!-- Food chips - horizontal scrollable -->
                <div class="food-chips-scroll">
                  <div
                    v-for="item in getSlotFoods(day.key, meal.key)"
                    :key="item.foodId"
                    class="food-chip"
                    :class="`food-chip--${item.food?.alClassification?.toLowerCase() ?? 'neutral'}`"
                  >
                    <span class="food-chip__border" />
                    <span class="food-chip__name">{{ truncateFoodName(item.food?.name ?? 'Alimento') }}</span>
                  </div>
                </div>
                <!-- Serve button mobile -->
                <button
                  class="serve-btn serve-btn--mobile"
                  :class="getServeButtonClass(day.key, meal.key)"
                  :disabled="isServeDisabled(day.key, meal.key)"
                  :title="getServeTooltip(day.key, meal.key)"
                  @click="handleServeClick(day.key, meal.key)"
                >
                  <span v-if="menuStore.isServeLoading(day.key, meal.key)" class="serve-btn__spinner" />
                  <template v-else>
                    <span class="material-symbols-outlined serve-btn__icon" aria-hidden="true">
                      {{ menuStore.getServedAt(day.key, meal.key) ? 'check_circle' : 'restaurant' }}
                    </span>
                    {{ getServeButtonLabel(day.key, meal.key) }}
                  </template>
                </button>
              </div>
            </template>

            <!-- Empty row slot -->
            <template v-else>
              <button
                class="add-row-btn"
                :class="{ 'add-row-btn--loading': menuStore.isSlotLoading(day.key, meal.key) }"
                :aria-label="`Agregar plato a ${meal.name}`"
                :disabled="menuStore.isSlotLoading(day.key, meal.key)"
                @click="openPicker(day.key, meal.key)"
              >
                <span v-if="menuStore.isSlotLoading(day.key, meal.key)" class="slot-spinner" aria-hidden="true" />
                <template v-else>
                  <span class="material-symbols-outlined" aria-hidden="true">add_circle</span>
                  Agregar plato
                </template>
              </button>
            </template>
          </div>
        </div>
      </div>

      <!-- ─── Weekly Summary ─── -->
      <section class="summary-section" aria-label="Resumen semanal">
        <h2 class="summary-title">
          <span class="material-symbols-outlined summary-title__icon" aria-hidden="true">bar_chart</span>
          Resumen Semanal
        </h2>
        <div class="summary-grid">
          <div class="summary-card summary-card--balanced">
            <span class="summary-card__value">{{ weekStats.balanced }}</span>
            <span class="material-symbols-outlined summary-card__icon" aria-hidden="true">check_circle</span>
            <span class="summary-card__label">Equilibrado</span>
          </div>
          <div class="summary-card summary-card--total">
            <span class="summary-card__value">{{ weekStats.total }}</span>
            <span class="material-symbols-outlined summary-card__icon" aria-hidden="true">restaurant</span>
            <span class="summary-card__label">Platos planificados</span>
          </div>
          <div class="summary-card summary-card--empty">
            <span class="summary-card__value">{{ weekStats.empty }}</span>
            <span class="material-symbols-outlined summary-card__icon" aria-hidden="true">event_busy</span>
            <span class="summary-card__label">Sin planificar</span>
          </div>
        </div>
      </section>

      <!-- ─── Plate Picker Dialog ─── -->
      <Teleport to="body">
        <Transition name="dialog-fade">
          <div
            v-if="picker.open"
            class="dialog-backdrop"
            role="presentation"
            @click.self="closePicker"
          >
            <div
              class="dialog"
              role="dialog"
              aria-modal="true"
              aria-labelledby="picker-title"
            >
              <div class="dialog__header">
                <h3 id="picker-title" class="dialog__title">Elegir plato</h3>
                <button class="dialog__close" aria-label="Cerrar" @click="closePicker">
                  <span class="material-symbols-outlined" aria-hidden="true">close</span>
                </button>
              </div>

              <!-- Loading -->
              <div v-if="plateStore.loading" class="picker-loading">
                <div class="picker-spinner" aria-hidden="true" />
                <span>Cargando platos...</span>
              </div>

              <!-- Empty plates -->
              <div v-else-if="plateStore.savedPlates.length === 0" class="picker-empty">
                <span class="material-symbols-outlined picker-empty__icon" aria-hidden="true">no_meals</span>
                <p>No tenés platos guardados todavía.</p>
                <RouterLink to="/plates" class="picker-empty__link">Crear un plato</RouterLink>
              </div>

              <!-- Plate list -->
              <ul v-else class="picker-list" role="listbox" :aria-label="`Platos disponibles`">
                <li
                  v-for="plate in plateStore.savedPlates"
                  :key="plate.id"
                  class="picker-item"
                  :class="{ 'picker-item--expanded': expandedPlateId === plate.id }"
                  role="option"
                  :aria-selected="false"
                  :aria-expanded="expandedPlateId === plate.id"
                >
                  <div class="picker-item__header" @click="togglePlatePreview(plate.id)">
                    <span class="picker-item__score" :class="scoreClass(plate)">
                      <span class="material-symbols-outlined" aria-hidden="true">{{ scoreIcon(plate) }}</span>
                    </span>
                    <span class="picker-item__name">{{ plate.name }}</span>
                    <span class="picker-item__meta">
                      {{ plate.items?.length ?? 0 }} alimentos
                    </span>
                    <span
                      class="material-symbols-outlined picker-item__arrow"
                      :class="{ 'picker-item__arrow--open': expandedPlateId === plate.id }"
                      aria-hidden="true"
                    >expand_more</span>
                  </div>

                  <!-- Expanded: food list + select button -->
                  <div v-if="expandedPlateId === plate.id" class="picker-item__detail">
                    <ul v-if="plate.items?.length" class="picker-food-list">
                      <li
                        v-for="item in plate.items"
                        :key="item.id"
                        class="picker-food-item"
                      >
                        <span
                          class="picker-food-item__dot"
                          :class="`picker-food-item__dot--${item.food?.alClassification?.toLowerCase() ?? 'neutral'}`"
                        />
                        <span class="picker-food-item__name">{{ item.food?.name ?? 'Alimento' }}</span>
                        <span class="picker-food-item__group">{{ formatGroup(item.groupAssignment) }}</span>
                      </li>
                    </ul>
                    <p v-else class="picker-food-empty">Sin alimentos</p>
                    <button class="picker-select-btn" @click="assignPlate(plate)">
                      <span class="material-symbols-outlined" aria-hidden="true">check</span>
                      Seleccionar plato
                    </button>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </Transition>
      </Teleport>

      <!-- ─── Re-serve Confirmation Dialog ─── -->
      <Teleport to="body">
        <Transition name="dialog-fade">
          <div
            v-if="reServeDialog.open"
            class="dialog-backdrop"
            role="presentation"
            @click.self="closeReServeDialog"
          >
            <div
              class="dialog dialog--confirm"
              role="dialog"
              aria-modal="true"
              aria-labelledby="confirm-title"
              aria-describedby="confirm-desc"
            >
              <div class="dialog__header dialog__header--confirm">
                <span class="material-symbols-outlined dialog__confirm-icon" aria-hidden="true">warning</span>
                <h3 id="confirm-title" class="dialog__title">¿Registrar de nuevo?</h3>
              </div>

              <div class="dialog__body">
                <p id="confirm-desc" class="dialog__text">
                  ¿Querés registrar de nuevo? Esto reemplazará las entradas anteriores.
                </p>
              </div>

              <div class="dialog__actions">
                <button class="dialog__btn dialog__btn--secondary" @click="closeReServeDialog">
                  Cancelar
                </button>
                <button class="dialog__btn dialog__btn--primary" @click="confirmReServe">
                  Sí, registrar
                </button>
              </div>
            </div>
          </div>
        </Transition>
      </Teleport>

      <!-- ─── Export Frame (off-screen, for capture) ─── -->
      <MenuExportFrame
        ref="exportFrameRef"
        :week-start="weekStartISO"
        :week-end="weekEndISO"
        :week-label="weekLabel"
        :baby-name="profileStore.activeProfile?.name ?? ''"
        :days="exportData"
        :week-stats="weekStats"
        @done="onExportDone"
        @error="onExportError"
      />

    </div>
  </TierGate>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { RouterLink } from 'vue-router'
import type { Plate, PlateItemSummary } from '@pakulab/shared'
import TierGate from '@/shared/components/TierGate.vue'
import MenuExportFrame from './components/MenuExportFrame.vue'
import { usePlateStore } from '@/shared/stores/plateStore.js'
import { useMenuStore } from '@/shared/stores/menuStore.js'
import { useProfileStore } from '@/shared/stores/profileStore.js'
import { useUiStore } from '@/shared/stores/uiStore.js'

// ─── Food visualization helpers ───────────────────────────────────────────

const AL_LABELS: Record<string, string> = {
  ASTRINGENT: 'Astringente',
  LAXATIVE: 'Laxante',
  NEUTRAL: 'Neutro',
}

const MAX_VISIBLE_DOTS = 3
const MAX_FOOD_NAME_LENGTH = 15

interface TooltipState {
  visible: boolean
  content: PlateItemSummary[] | null
  x: number
  y: number
}

const tooltip = ref<TooltipState>({
  visible: false,
  content: null,
  x: 0,
  y: 0,
})

// ─── Serve / Re-serve dialog state ─────────────────────────────────────────

interface ReServeDialogState {
  open: boolean
  dayKey: DayKey | null
  mealKey: MealKey | null
}

const reServeDialog = ref<ReServeDialogState>({
  open: false,
  dayKey: null,
  mealKey: null,
})

// ─── Export state ─────────────────────────────────────────────────────────

const isExporting = ref(false)
const exportFrameRef = ref<InstanceType<typeof MenuExportFrame> | null>(null)

// ─── Constants ────────────────────────────────────────────────────────────

type MealKey = 'desayuno' | 'comida' | 'cena'
type DayKey = 'lun' | 'mar' | 'mie' | 'jue' | 'vie' | 'sab' | 'dom'

interface MealDef {
  key: MealKey
  name: string
  icon: string
}

interface DayInfo {
  key: DayKey
  name: string
  shortName: string
  dayNumber: string
  date: Date
  isToday: boolean
}

const MEALS: MealDef[] = [
  { key: 'desayuno', name: 'Desayuno', icon: 'wb_sunny' },
  { key: 'comida', name: 'Comida', icon: 'lunch_dining' },
  { key: 'cena', name: 'Cena', icon: 'bedtime' },
]

// ─── Stores ───────────────────────────────────────────────────────────────

const plateStore = usePlateStore()
const menuStore = useMenuStore()
const profileStore = useProfileStore()
const uiStore = useUiStore()

// ─── Week state ───────────────────────────────────────────────────────────

/** Offset in weeks from current week. 0 = this week, -1 = last week, etc. */
const weekOffset = ref(0)

/** Week anchor: Monday of the displayed week */
const weekStart = computed<Date>(() => {
  const now = new Date()
  const dayOfWeek = now.getDay() // 0=Sun…6=Sat
  const diffToMonday = (dayOfWeek + 6) % 7
  const monday = new Date(now)
  monday.setDate(now.getDate() - diffToMonday + weekOffset.value * 7)
  monday.setHours(0, 0, 0, 0)
  return monday
})

/** ISO date string for API calls (YYYY-MM-DD) */
const weekStartISO = computed(() => {
  return weekStart.value.toISOString().slice(0, 10)
})

/** ISO date string for week end (Sunday) */
const weekEndISO = computed(() => {
  const end = new Date(weekStart.value)
  end.setDate(weekStart.value.getDate() + 6)
  return end.toISOString().slice(0, 10)
})

const weekLabel = computed(() => {
  const start = weekStart.value
  const end = new Date(start)
  end.setDate(start.getDate() + 6)

  const fmtDay = (d: Date) =>
    d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })

  return `${fmtDay(start)} – ${fmtDay(end)}`
})

const weekDays = computed<DayInfo[]>(() => {
  const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
  const shortNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
  const keys: DayKey[] = ['lun', 'mar', 'mie', 'jue', 'vie', 'sab', 'dom']
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(weekStart.value)
    date.setDate(weekStart.value.getDate() + i)
    const isToday = date.getTime() === today.getTime()
    return {
      key: keys[i]!,
      name: dayNames[i]!,
      shortName: shortNames[i]!,
      dayNumber: date.getDate().toString(),
      date,
      isToday,
    }
  })
})

/** Export view-models for MenuExportFrame */
interface ExportFood {
  name: string
  alClassification: 'ASTRINGENT' | 'LAXATIVE' | 'NEUTRAL'
}

interface ExportMeal {
  type: string
  plateName: string | null
  foods: ExportFood[]
}

interface ExportDay {
  label: string
  date: string
  meals: ExportMeal[]
}

const exportData = computed<ExportDay[]>(() => {
  const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
  const keys: DayKey[] = ['lun', 'mar', 'mie', 'jue', 'vie', 'sab', 'dom']

  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(weekStart.value)
    date.setDate(weekStart.value.getDate() + i)

    const dayKey = keys[i]!
    const meals: ExportMeal[] = MEALS.map((meal) => {
      const plate = menuStore.getPlate(dayKey, meal.key)
      const foods = menuStore.getSlotFoods(dayKey, meal.key).map((item) => ({
        name: item.food?.name ?? 'Alimento',
        alClassification: (item.food?.alClassification ?? 'NEUTRAL') as 'ASTRINGENT' | 'LAXATIVE' | 'NEUTRAL',
      }))

      return {
        type: meal.name,
        plateName: plate?.name ?? null,
        foods,
      }
    })

    return {
      label: dayNames[i]!,
      date: date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }),
      meals,
    }
  })
})

function prevWeek() {
  weekOffset.value--
}

function nextWeek() {
  weekOffset.value++
}

// ─── Menu assignment state (backed by menuStore) ──────────────────────────

/** 
 * Get assigned plate from store.
 * Thin wrapper for template compatibility.
 */
function getAssignedPlate(dayKey: DayKey, mealKey: MealKey): Plate | undefined {
  return menuStore.getPlate(dayKey, mealKey) ?? undefined
}

/**
 * Remove plate from slot via store (with optimistic UI + API sync).
 */
async function removePlate(dayKey: DayKey, mealKey: MealKey): Promise<void> {
  const profileId = profileStore.activeProfile?.id
  if (!profileId) return

  try {
    await menuStore.removePlate(profileId, weekStartISO.value, dayKey, mealKey)
  } catch (err) {
    // Error already handled in store (rollback + toast), just log
    console.error('Failed to remove plate:', err)
  }
}

// ─── Serve button handlers ─────────────────────────────────────────────────

/**
 * Handle serve button click.
 * If not served yet: calls serveMeal.
 * If already served: opens re-serve confirmation dialog.
 */
function handleServeClick(dayKey: DayKey, mealKey: MealKey): void {
  const servedAt = menuStore.getServedAt(dayKey, mealKey)

  if (servedAt) {
    // Already served - open re-serve dialog
    reServeDialog.value = {
      open: true,
      dayKey,
      mealKey,
    }
  } else {
    // Not served yet - serve directly
    serveMeal(dayKey, mealKey)
  }
}

/**
 * Call serve API for a meal slot.
 */
async function serveMeal(dayKey: DayKey, mealKey: MealKey): Promise<void> {
  const profileId = profileStore.activeProfile?.id
  if (!profileId) return

  try {
    await menuStore.serveMeal(profileId, dayKey, mealKey)
  } catch (err) {
    // Error already handled in store
    console.error('Failed to serve meal:', err)
  }
}

/**
 * Confirm re-serve from dialog.
 */
async function confirmReServe(): Promise<void> {
  if (!reServeDialog.value.dayKey || !reServeDialog.value.mealKey) return

  const profileId = profileStore.activeProfile?.id
  if (!profileId) {
    closeReServeDialog()
    return
  }

  const dayKey = reServeDialog.value.dayKey
  const mealKey = reServeDialog.value.mealKey

  closeReServeDialog()

  try {
    await menuStore.reServeMeal(profileId, dayKey, mealKey)
  } catch (err) {
    // Error already handled in store
    console.error('Failed to re-serve meal:', err)
  }
}

function closeReServeDialog(): void {
  reServeDialog.value = {
    open: false,
    dayKey: null,
    mealKey: null,
  }
}

/**
 * Get serve button label based on state.
 */
function getServeButtonLabel(dayKey: DayKey, mealKey: MealKey): string {
  const servedAt = menuStore.getServedAt(dayKey, mealKey)
  return servedAt ? 'Servido \u2713' : 'Se lo di \u2713'
}

/**
 * Get serve button state classes.
 */
function getServeButtonClass(dayKey: DayKey, mealKey: MealKey): string {
  const servedAt = menuStore.getServedAt(dayKey, mealKey)
  if (servedAt) {
    return 'serve-btn--served'
  }
  return 'serve-btn--ready'
}

/**
 * Check if serve button should be disabled.
 */
function isServeDisabled(dayKey: DayKey, mealKey: MealKey): boolean {
  return menuStore.isServeLoading(dayKey, mealKey)
}

/**
 * Get tooltip text for served button.
 */
function getServeTooltip(dayKey: DayKey, mealKey: MealKey): string {
  const servedAt = menuStore.getServedAt(dayKey, mealKey)
  if (!servedAt) return ''

  const date = new Date(servedAt)
  const formatted = date.toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
  return `Registrado el ${formatted}`
}

// ─── Food visualization helpers ───────────────────────────────────────────

/**
 * Get visible food dots for desktop (max 3).
 * REQ-001: Show max 2-3 A/L colored dots per slot.
 */
function getVisibleFoodDots(dayKey: DayKey, mealKey: MealKey): PlateItemSummary[] {
  const foods = menuStore.getSlotFoods(dayKey, mealKey)
  return foods.slice(0, MAX_VISIBLE_DOTS)
}

/**
 * Get overflow count for badge.
 */
function getFoodOverflowCount(dayKey: DayKey, mealKey: MealKey): number {
  const foods = menuStore.getSlotFoods(dayKey, mealKey)
  return Math.max(0, foods.length - MAX_VISIBLE_DOTS)
}

/**
 * Get slot foods for mobile chips.
 */
function getSlotFoods(dayKey: DayKey, mealKey: MealKey): PlateItemSummary[] {
  return menuStore.getSlotFoods(dayKey, mealKey)
}

/**
 * Truncate food name for mobile chips.
 * REQ-002: Mobile chips show names truncated to 15 chars.
 */
function truncateFoodName(name: string): string {
  if (name.length <= MAX_FOOD_NAME_LENGTH) return name
  return name.slice(0, MAX_FOOD_NAME_LENGTH) + '…'
}

/**
 * Get A/L classification label in Spanish.
 */
function getALLabel(classification: string | undefined): string {
  if (!classification) return 'Neutro'
  return AL_LABELS[classification] ?? 'Neutro'
}

/**
 * Show tooltip with food list on desktop hover.
 * REQ-003: Tooltip shows full food names with A/L classification.
 */
function showTooltip(dayKey: DayKey, mealKey: MealKey): void {
  const foods = menuStore.getSlotFoods(dayKey, mealKey)
  if (foods.length === 0) return

  tooltip.value.content = foods
  tooltip.value.visible = true

  // Position tooltip near the slot (will be updated on mousemove)
  const slotKey = `${dayKey}:${mealKey}`
  const slotElement = document.querySelector(`[data-slot="${slotKey}"]`)
  if (slotElement) {
    const rect = slotElement.getBoundingClientRect()
    tooltip.value.x = rect.left + rect.width / 2
    tooltip.value.y = rect.bottom + 8
  }
}

function hideTooltip(): void {
  tooltip.value.visible = false
  tooltip.value.content = null
}

// ─── Picker ───────────────────────────────────────────────────────────────

interface PickerState {
  open: boolean
  dayKey: DayKey | null
  mealKey: MealKey | null
}

const picker = ref<PickerState>({ open: false, dayKey: null, mealKey: null })
const expandedPlateId = ref<string | null>(null)

function openPicker(dayKey: DayKey, mealKey: MealKey): void {
  picker.value = { open: true, dayKey, mealKey }
  expandedPlateId.value = null
}

function closePicker(): void {
  picker.value = { open: false, dayKey: null, mealKey: null }
  expandedPlateId.value = null
}

function togglePlatePreview(plateId: string): void {
  expandedPlateId.value = expandedPlateId.value === plateId ? null : plateId
}

const GROUP_LABELS: Record<string, string> = {
  FRUIT: 'Fruta',
  VEGETABLE: 'Verdura',
  PROTEIN: 'Proteína',
  CEREAL_TUBER: 'Cereal',
  HEALTHY_FAT: 'Grasa saludable',
}

function formatGroup(group: string): string {
  return GROUP_LABELS[group] ?? group
}

async function assignPlate(plate: Plate): Promise<void> {
  if (!picker.value.dayKey || !picker.value.mealKey) return
  
  const profileId = profileStore.activeProfile?.id
  if (!profileId) return
  
  const dayKey = picker.value.dayKey
  const mealKey = picker.value.mealKey
  
  closePicker()
  
  try {
    await menuStore.assignPlate(profileId, weekStartISO.value, dayKey, mealKey, plate)
  } catch (err) {
    // Error already handled in store (rollback + toast), just log
    console.error('Failed to assign plate:', err)
  }
}

// ─── Mobile tab state ─────────────────────────────────────────────────────

const selectedDayKey = ref<DayKey>('lun')

// Initialize to today's day if in current week
const todayDay = weekDays.value.find((d) => d.isToday)
if (todayDay) selectedDayKey.value = todayDay.key

// ─── Weekly stats ─────────────────────────────────────────────────────────

/** Use store's computed stats */
const weekStats = computed(() => menuStore.weekStats)

// ─── Plate score helpers ──────────────────────────────────────────────────

function scoreClass(plate: Plate): string {
  if (plate.balanceScore > 0.2) return 'score--balanced'
  if (plate.balanceScore < -0.2) return 'score--unbalanced'
  return 'score--neutral'
}

function scoreIcon(plate: Plate): string {
  if (plate.balanceScore > 0.2) return 'check_circle'
  if (plate.balanceScore < -0.2) return 'warning'
  return 'remove_circle'
}

// ─── Export handlers ───────────────────────────────────────────────────────

async function handleExport(): Promise<void> {
  if (isExporting.value || !exportFrameRef.value) return

  isExporting.value = true

  try {
    // Wait for frame to render
    await nextTick()
    // Trigger capture
    await exportFrameRef.value.capture()
  } catch (err) {
    console.error('Export failed:', err)
    isExporting.value = false
  }
}

function onExportDone(dataUrl: string): void {
  try {
    // Create download link
    const link = document.createElement('a')
    link.href = dataUrl
    link.download = `menu-semanal-${weekStartISO.value}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    uiStore.addToast('Menú exportado', 'success')
  } catch (err) {
    console.error('Download failed:', err)
    uiStore.addToast('Error al descargar el menú', 'error')
  } finally {
    isExporting.value = false
  }
}

function onExportError(message: string): void {
  console.error('Export error:', message)
  isExporting.value = false
  uiStore.addToast('Error al exportar el menú. Intentá de nuevo.', 'error')
}

// ─── Lifecycle ────────────────────────────────────────────────────────────

onMounted(async () => {
  // Ensure baby profiles are loaded (may not be if navigating directly to /menus)
  if (profileStore.profiles.length === 0) {
    await profileStore.fetchProfiles()
  }

  // Fetch saved plates for the picker
  if (plateStore.savedPlates.length === 0) {
    await plateStore.fetchSavedPlates()
  }
  
  // Fetch menu for current week
  const profileId = profileStore.activeProfile?.id
  if (profileId) {
    await menuStore.fetchWeekMenu(profileId, weekStartISO.value)
  }
})

// ─── Watchers ─────────────────────────────────────────────────────────────

/** Watch week changes and fetch appropriate menu */
watch(weekStartISO, async (newWeekStart) => {
  const profileId = profileStore.activeProfile?.id
  if (profileId) {
    await menuStore.fetchWeekMenu(profileId, newWeekStart)
  }
})

/** Watch profile changes and clear cache + fetch new */
watch(() => profileStore.activeProfile?.id, async (newProfileId) => {
  if (newProfileId) {
    menuStore.clearProfileCache()
    await menuStore.fetchWeekMenu(newProfileId, weekStartISO.value)
  }
})
</script>

<style scoped>
/* ─── Page layout ─── */
.menu-page {
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-6);
  max-width: 1200px;
  margin: 0 auto;
}

/* ─── Header ─── */
.menu-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--md3-space-3);
}

.menu-header__titles {
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-1);
}

.menu-header__title {
  margin: 0;
  font-family: var(--md3-font-headline);
  font-size: var(--md3-headline-md);
  font-weight: var(--md3-weight-bold);
  color: var(--md3-on-surface);
  letter-spacing: var(--md3-headline-tracking);
}

.menu-header__subtitle {
  margin: 0;
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-md);
  color: var(--md3-on-surface-variant);
}

.menu-header__actions {
  display: flex;
  align-items: center;
  gap: var(--md3-space-3);
}

.week-nav {
  display: flex;
  align-items: center;
  gap: var(--md3-space-2);
  background: var(--md3-surface-container-low);
  border-radius: var(--md3-rounded-full);
  padding: var(--md3-space-1) var(--md3-space-2);
}

.week-nav__btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  background: transparent;
  color: var(--md3-primary);
  border-radius: var(--md3-rounded-full);
  cursor: pointer;
  transition: background var(--md3-transition-fast);
}

.week-nav__btn:hover {
  background: var(--md3-surface-container);
}

.week-nav__btn .material-symbols-outlined {
  font-size: 1.25rem;
}

.week-nav__label {
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-lg);
  font-weight: var(--md3-weight-semibold);
  color: var(--md3-on-surface);
  min-width: 140px;
  text-align: center;
}

/* ─── Export button ─── */
.export-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  border: none;
  background: var(--md3-primary);
  color: var(--md3-on-primary);
  border-radius: var(--md3-rounded-full);
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-lg);
  font-weight: var(--md3-weight-semibold);
  cursor: pointer;
  transition: background var(--md3-transition-fast), opacity var(--md3-transition-fast);
  min-height: 40px;
}

.export-btn:hover:not(:disabled) {
  background: var(--md3-primary-hover, var(--md3-primary));
  opacity: 0.9;
}

.export-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.export-btn .material-symbols-outlined {
  font-size: 1.125rem;
}

.export-btn__spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: var(--md3-on-primary);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

/* ─── Desktop: Week grid ─── */
.week-grid {
  display: none;
  grid-template-columns: repeat(7, 1fr);
  gap: var(--md3-space-2);
}

@media (min-width: 768px) {
  .week-grid {
    display: grid;
  }

  .mobile-view {
    display: none !important;
  }
}

.day-column {
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-2);
  background: var(--md3-surface-container-lowest);
  border-radius: var(--md3-rounded-md);
  padding: var(--md3-space-3);
  box-shadow: var(--md3-shadow-soft);
  transition: box-shadow var(--md3-transition-fast);
}

.day-column--today {
  background: var(--md3-primary-container);
  box-shadow: var(--md3-shadow-card);
}

.day-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--md3-space-1);
  padding-bottom: var(--md3-space-2);
  border-bottom: 1.5px solid var(--md3-outline-variant);
}

.day-column--today .day-header {
  border-bottom-color: var(--md3-on-primary-container);
}

.day-header__name {
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-md);
  font-weight: var(--md3-weight-semibold);
  color: var(--md3-on-surface-variant);
  text-transform: uppercase;
  letter-spacing: var(--md3-label-tracking);
}

.day-column--today .day-header__name {
  color: var(--md3-on-primary-container);
}

.day-header__date {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--md3-font-headline);
  font-size: var(--md3-title-md);
  font-weight: var(--md3-weight-bold);
  color: var(--md3-on-surface);
  border-radius: var(--md3-rounded-full);
}

.day-header__date--today {
  background: var(--md3-primary);
  color: var(--md3-on-primary);
}

.meal-slots {
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-2);
}

/* ─── Meal slot (desktop) ─── */
.meal-slot {
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-1);
  min-height: 68px;
}

.meal-slot__label {
  display: flex;
  align-items: center;
  gap: var(--md3-space-1);
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-sm);
  font-weight: var(--md3-weight-semibold);
  text-transform: uppercase;
  letter-spacing: var(--md3-label-tracking);
  color: var(--md3-on-surface-variant);
}

.meal-slot__icon {
  font-size: 0.875rem;
}

.meal-slot--desayuno .meal-slot__label { color: var(--md3-tertiary); }
.meal-slot--comida .meal-slot__label { color: var(--md3-primary); }
.meal-slot--cena .meal-slot__label { color: var(--md3-secondary); }

.meal-slot--loading {
  opacity: 0.7;
}

.slot-spinner {
  width: 18px;
  height: 18px;
  border: 2px solid var(--md3-outline-variant);
  border-top-color: var(--md3-primary);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

/* ─── Add slot button ─── */
.add-slot-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 36px;
  border: 1.5px dashed var(--md3-outline-variant);
  border-radius: var(--md3-rounded-sm);
  background: transparent;
  color: var(--md3-on-surface-variant);
  cursor: pointer;
  transition: border-color var(--md3-transition-fast), background var(--md3-transition-fast), color var(--md3-transition-fast);
}

.add-slot-btn:hover {
  border-color: var(--md3-primary);
  background: var(--md3-surface-container-low);
  color: var(--md3-primary);
}

.add-slot-btn .material-symbols-outlined {
  font-size: 1.125rem;
}

/* ─── Plate chip (desktop) ─── */
.plate-chip {
  display: flex;
  align-items: center;
  gap: var(--md3-space-1);
  padding: var(--md3-space-1) var(--md3-space-2);
  background: var(--md3-surface-container);
  border-radius: var(--md3-rounded-sm);
  min-height: 36px;
}

.plate-chip__score {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.plate-chip__score .material-symbols-outlined {
  font-size: 1rem;
}

.plate-chip__name {
  flex: 1;
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-sm);
  font-weight: var(--md3-weight-medium);
  color: var(--md3-on-surface);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.plate-chip__remove {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border: none;
  background: transparent;
  color: var(--md3-on-surface-variant);
  border-radius: var(--md3-rounded-full);
  cursor: pointer;
  flex-shrink: 0;
  transition: background var(--md3-transition-fast), color var(--md3-transition-fast);
}

.plate-chip__remove:hover {
  background: var(--md3-error-container);
  color: var(--md3-error);
}

.plate-chip__remove .material-symbols-outlined {
  font-size: 0.875rem;
}

.plate-chip--loading {
  opacity: 0.6;
  pointer-events: none;
}

/* ─── Food dots container (desktop) ─── */
.food-dots-container {
  display: flex;
  align-items: center;
  gap: var(--md3-space-1);
  margin-top: var(--md3-space-1);
  min-height: 12px;
}

.food-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.food-dot--astringent {
  background: #ef4444;
}

.food-dot--laxative {
  background: #22c55e;
}

.food-dot--neutral {
  background: #9ca3af;
}

.food-overflow-badge {
  font-family: var(--md3-font-label);
  font-size: 10px;
  font-weight: var(--md3-weight-semibold);
  color: var(--md3-on-surface-variant);
  background: var(--md3-surface-container-high);
  padding: 1px 4px;
  border-radius: var(--md3-rounded-full);
}

/* ─── Food tooltip ─── */
.food-tooltip {
  position: fixed;
  z-index: 1001;
  background: var(--md3-surface-container-high);
  border-radius: var(--md3-rounded-md);
  padding: var(--md3-space-3);
  box-shadow: var(--md3-shadow-ambient);
  min-width: 200px;
  pointer-events: none;
}

.food-tooltip__title {
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-sm);
  font-weight: var(--md3-weight-semibold);
  color: var(--md3-on-surface-variant);
  text-transform: uppercase;
  letter-spacing: var(--md3-label-tracking);
  margin-bottom: var(--md3-space-2);
  padding-bottom: var(--md3-space-1);
  border-bottom: 1px solid var(--md3-outline-variant);
}

.food-tooltip__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-2);
}

.food-tooltip__item {
  display: flex;
  align-items: center;
  gap: var(--md3-space-2);
}

.food-tooltip__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.food-tooltip__dot--astringent {
  background: #ef4444;
}

.food-tooltip__dot--laxative {
  background: #22c55e;
}

.food-tooltip__dot--neutral {
  background: #9ca3af;
}

.food-tooltip__name {
  flex: 1;
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-sm);
  color: var(--md3-on-surface);
}

.food-tooltip__al {
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-sm);
  color: var(--md3-on-surface-variant);
  font-style: italic;
}

.tooltip-fade-enter-active,
.tooltip-fade-leave-active {
  transition: opacity var(--md3-transition-fast), transform var(--md3-transition-fast);
}

.tooltip-fade-enter-from,
.tooltip-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

/* ─── Mobile food chips ─── */
.mobile-plate-container {
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-2);
  flex: 1;
}

.food-chips-scroll {
  display: flex;
  gap: var(--md3-space-2);
  overflow-x: auto;
  padding-bottom: var(--md3-space-1);
  scrollbar-width: thin;
  scrollbar-color: var(--md3-outline-variant) transparent;
}

.food-chips-scroll::-webkit-scrollbar {
  height: 4px;
}

.food-chips-scroll::-webkit-scrollbar-track {
  background: transparent;
}

.food-chips-scroll::-webkit-scrollbar-thumb {
  background: var(--md3-outline-variant);
  border-radius: 2px;
}

.food-chip {
  display: flex;
  align-items: center;
  gap: var(--md3-space-1);
  padding: var(--md3-space-1) var(--md3-space-2);
  background: var(--md3-surface-container);
  border-radius: var(--md3-rounded-sm);
  flex-shrink: 0;
  border-left: 3px solid transparent;
}

.food-chip--astringent {
  border-left-color: #ef4444;
}

.food-chip--laxative {
  border-left-color: #22c55e;
}

.food-chip--neutral {
  border-left-color: #9ca3af;
}

.food-chip__name {
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-sm);
  color: var(--md3-on-surface);
  white-space: nowrap;
}

.add-slot-btn--loading {
  opacity: 0.6;
  cursor: not-allowed;
}

/* ─── Score classes ─── */
.score--balanced { color: var(--md3-primary); }
.score--unbalanced { color: var(--md3-error); }
.score--neutral { color: var(--md3-on-surface-variant); }

/* ─── Mobile view ─── */
.mobile-view {
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-3);
}

.day-tabs {
  display: flex;
  gap: var(--md3-space-1);
  overflow-x: auto;
  padding-bottom: var(--md3-space-1);
  scrollbar-width: none;
}

.day-tabs::-webkit-scrollbar {
  display: none;
}

.day-tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--md3-space-1);
  padding: var(--md3-space-2) var(--md3-space-3);
  border: none;
  background: var(--md3-surface-container-low);
  border-radius: var(--md3-rounded-md);
  cursor: pointer;
  flex-shrink: 0;
  transition: background var(--md3-transition-fast);
}

.day-tab--active {
  background: var(--md3-primary-container);
}

.day-tab__short {
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-md);
  font-weight: var(--md3-weight-semibold);
  text-transform: uppercase;
  letter-spacing: var(--md3-label-tracking);
  color: var(--md3-on-surface-variant);
}

.day-tab--active .day-tab__short {
  color: var(--md3-on-primary-container);
}

.day-tab__number {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--md3-font-headline);
  font-size: var(--md3-body-md);
  font-weight: var(--md3-weight-bold);
  color: var(--md3-on-surface);
  border-radius: var(--md3-rounded-full);
}

.day-tab__number--today {
  background: var(--md3-primary);
  color: var(--md3-on-primary);
}

/* ─── Day panel (mobile) ─── */
.day-panel {
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-3);
}

.day-panel[hidden] {
  display: none;
}

.meal-row {
  display: flex;
  align-items: center;
  gap: var(--md3-space-3);
  padding: var(--md3-space-3);
  background: var(--md3-surface-container-lowest);
  border-radius: var(--md3-rounded-md);
  box-shadow: var(--md3-shadow-soft);
  min-height: 64px;
}

.meal-row__meta {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--md3-space-1);
  min-width: 52px;
}

.meal-row__icon {
  font-size: 1.5rem;
  color: var(--md3-on-surface-variant);
}

.meal-row--desayuno .meal-row__icon { color: var(--md3-tertiary); }
.meal-row--comida .meal-row__icon { color: var(--md3-primary); }
.meal-row--cena .meal-row__icon { color: var(--md3-secondary); }

.meal-row__name {
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-sm);
  font-weight: var(--md3-weight-semibold);
  text-transform: uppercase;
  letter-spacing: var(--md3-label-tracking);
  color: var(--md3-on-surface-variant);
}

/* ─── Plate row chip (mobile) ─── */
.plate-row-chip {
  display: flex;
  align-items: center;
  gap: var(--md3-space-2);
  flex: 1;
  padding: var(--md3-space-2) var(--md3-space-3);
  background: var(--md3-surface-container);
  border-radius: var(--md3-rounded-sm);
}

.plate-row-chip__score .material-symbols-outlined {
  font-size: 1.125rem;
}

.plate-row-chip__name {
  flex: 1;
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-md);
  font-weight: var(--md3-weight-medium);
  color: var(--md3-on-surface);
}

.plate-row-chip__remove {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  color: var(--md3-on-surface-variant);
  border-radius: var(--md3-rounded-full);
  cursor: pointer;
  transition: background var(--md3-transition-fast), color var(--md3-transition-fast);
}

.plate-row-chip__remove:hover {
  background: var(--md3-error-container);
  color: var(--md3-error);
}

.plate-row-chip__remove .material-symbols-outlined {
  font-size: 1rem;
}

.plate-row-chip--loading {
  opacity: 0.6;
  pointer-events: none;
}

/* ─── Add row button (mobile) ─── */
.add-row-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--md3-space-2);
  flex: 1;
  padding: var(--md3-space-2) var(--md3-space-3);
  border: 1.5px dashed var(--md3-outline-variant);
  border-radius: var(--md3-rounded-sm);
  background: transparent;
  color: var(--md3-on-surface-variant);
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-lg);
  font-weight: var(--md3-weight-medium);
  cursor: pointer;
  transition: border-color var(--md3-transition-fast), background var(--md3-transition-fast), color var(--md3-transition-fast);
}

.add-row-btn:hover {
  border-color: var(--md3-primary);
  background: var(--md3-surface-container-low);
  color: var(--md3-primary);
}

.add-row-btn .material-symbols-outlined {
  font-size: 1.25rem;
}

/* ─── Summary section ─── */
.summary-section {
  background: var(--md3-surface-container-lowest);
  border-radius: var(--md3-rounded-md);
  padding: var(--md3-space-6);
  box-shadow: var(--md3-shadow-soft);
}

.summary-title {
  display: flex;
  align-items: center;
  gap: var(--md3-space-2);
  margin: 0 0 var(--md3-space-4);
  font-family: var(--md3-font-headline);
  font-size: var(--md3-headline-sm);
  font-weight: var(--md3-weight-bold);
  color: var(--md3-on-surface);
}

.summary-title__icon {
  font-size: 1.5rem;
  color: var(--md3-primary);
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--md3-space-3);
}

@media (max-width: 480px) {
  .summary-grid {
    grid-template-columns: 1fr;
  }
}

.summary-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--md3-space-2);
  padding: var(--md3-space-4) var(--md3-space-3);
  border-radius: var(--md3-rounded-md);
  text-align: center;
}

.summary-card--balanced {
  background: var(--md3-primary-container);
}

.summary-card--total {
  background: var(--md3-surface-container);
}

.summary-card--empty {
  background: var(--md3-surface-container-high);
}

.summary-card__value {
  font-family: var(--md3-font-headline);
  font-size: var(--md3-headline-lg);
  font-weight: var(--md3-weight-bold);
  color: var(--md3-on-surface);
  line-height: 1;
}

.summary-card--balanced .summary-card__value {
  color: var(--md3-on-primary-container);
}

.summary-card__icon {
  font-size: 1.5rem;
}

.summary-card--balanced .summary-card__icon { color: var(--md3-primary); }
.summary-card--total .summary-card__icon { color: var(--md3-on-surface-variant); }
.summary-card--empty .summary-card__icon { color: var(--md3-outline); }

.summary-card__label {
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-md);
  font-weight: var(--md3-weight-medium);
  color: var(--md3-on-surface-variant);
}

.summary-card--balanced .summary-card__label {
  color: var(--md3-on-primary-container);
}

/* ─── Dialog / Plate picker ─── */
.dialog-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(11, 15, 15, 0.4);
  backdrop-filter: var(--md3-glass-blur-sm);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 1000;
  padding: 0;
}

@media (min-width: 600px) {
  .dialog-backdrop {
    align-items: center;
    padding: var(--md3-space-6);
  }
}

.dialog {
  width: 100%;
  max-width: 480px;
  max-height: 70vh;
  background: var(--md3-surface-container-lowest);
  border-radius: var(--md3-rounded-lg) var(--md3-rounded-lg) 0 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: var(--md3-shadow-ambient);
}

@media (min-width: 600px) {
  .dialog {
    border-radius: var(--md3-rounded-lg);
    max-height: 80vh;
  }
}

.dialog__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--md3-space-4) var(--md3-space-6);
  border-bottom: 1.5px solid var(--md3-outline-variant);
  flex-shrink: 0;
}

.dialog__title {
  margin: 0;
  font-family: var(--md3-font-headline);
  font-size: var(--md3-title-lg);
  font-weight: var(--md3-weight-semibold);
  color: var(--md3-on-surface);
}

.dialog__close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  background: transparent;
  color: var(--md3-on-surface-variant);
  border-radius: var(--md3-rounded-full);
  cursor: pointer;
  transition: background var(--md3-transition-fast);
}

.dialog__close:hover {
  background: var(--md3-surface-container-low);
}

.dialog__close .material-symbols-outlined {
  font-size: 1.25rem;
}

/* ─── Picker states ─── */
.picker-loading,
.picker-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--md3-space-3);
  padding: var(--md3-space-12) var(--md3-space-6);
  color: var(--md3-on-surface-variant);
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-md);
}

.picker-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--md3-surface-container-high);
  border-top-color: var(--md3-primary);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

.picker-empty__icon {
  font-size: 3rem;
  color: var(--md3-outline);
}

.picker-empty__link {
  display: inline-flex;
  padding: 0.5rem 1.25rem;
  background: var(--md3-primary);
  color: var(--md3-on-primary);
  border-radius: var(--md3-rounded-full);
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-lg);
  font-weight: var(--md3-weight-semibold);
  text-decoration: none;
  transition: background var(--md3-transition-fast);
}

.picker-empty__link:hover {
  background: var(--md3-primary-dim);
}

/* ─── Picker plate list ─── */
.picker-list {
  list-style: none;
  margin: 0;
  padding: 0;
  overflow-y: auto;
  flex: 1;
}

.picker-item {
  display: flex;
  flex-direction: column;
  border-bottom: 1px solid var(--md3-surface-container-low);
  transition: background var(--md3-transition-fast);
}

.picker-item:last-child {
  border-bottom: none;
}

.picker-item--expanded {
  background: var(--md3-surface-container-low);
}

.picker-item__header {
  display: flex;
  align-items: center;
  gap: var(--md3-space-3);
  padding: var(--md3-space-3) var(--md3-space-6);
  cursor: pointer;
  transition: background var(--md3-transition-fast);
}

.picker-item__header:hover {
  background: var(--md3-surface-container-low);
}

.picker-item__score {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.picker-item__score .material-symbols-outlined {
  font-size: 1.25rem;
}

.picker-item__name {
  flex: 1;
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-md);
  font-weight: var(--md3-weight-medium);
  color: var(--md3-on-surface);
}

.picker-item__meta {
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-sm);
  color: var(--md3-on-surface-variant);
  flex-shrink: 0;
}

.picker-item__arrow {
  font-size: 1.25rem;
  color: var(--md3-outline);
  flex-shrink: 0;
  transition: transform var(--md3-transition-fast);
}

.picker-item__arrow--open {
  transform: rotate(180deg);
}

/* ─── Picker detail (expanded) ─── */
.picker-item__detail {
  padding: 0 var(--md3-space-6) var(--md3-space-4);
}

.picker-food-list {
  list-style: none;
  margin: 0 0 var(--md3-space-3) 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-1);
}

.picker-food-item {
  display: flex;
  align-items: center;
  gap: var(--md3-space-2);
  padding: var(--md3-space-1) 0;
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-sm);
  color: var(--md3-on-surface-variant);
}

.picker-food-item__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.picker-food-item__dot--astringent {
  background: var(--md3-error, #ba1a1a);
}

.picker-food-item__dot--laxative {
  background: var(--md3-tertiary, #006c4c);
}

.picker-food-item__dot--neutral {
  background: var(--md3-outline, #73796e);
}

.picker-food-item__name {
  flex: 1;
}

.picker-food-item__group {
  font-size: var(--md3-label-sm);
  color: var(--md3-outline);
}

.picker-food-empty {
  margin: 0 0 var(--md3-space-3) 0;
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-sm);
  color: var(--md3-outline);
}

.picker-select-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--md3-space-2);
  width: 100%;
  padding: var(--md3-space-2) var(--md3-space-4);
  background: var(--md3-primary);
  color: var(--md3-on-primary);
  border: none;
  border-radius: var(--md3-rounded-full);
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-lg);
  font-weight: var(--md3-weight-semibold);
  cursor: pointer;
  transition: background var(--md3-transition-fast);
}

.picker-select-btn:hover {
  background: var(--md3-primary-dim);
}

.picker-select-btn .material-symbols-outlined {
  font-size: 1.125rem;
}

/* ─── Dialog transition ─── */
.dialog-fade-enter-active,
.dialog-fade-leave-active {
  transition: opacity var(--md3-transition-normal);
}

.dialog-fade-enter-from,
.dialog-fade-leave-to {
  opacity: 0;
}

.dialog-fade-enter-active .dialog,
.dialog-fade-leave-active .dialog {
  transition: transform var(--md3-transition-normal);
}

.dialog-fade-enter-from .dialog {
  transform: translateY(20px);
}

.dialog-fade-leave-to .dialog {
  transform: translateY(20px);
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ─── Serve button ─── */
.serve-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--md3-space-1);
  width: 100%;
  padding: var(--md3-space-1) var(--md3-space-2);
  border: 1.5px solid var(--md3-outline-variant);
  border-radius: var(--md3-rounded-sm);
  background: transparent;
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-sm);
  font-weight: var(--md3-weight-semibold);
  cursor: pointer;
  transition: all var(--md3-transition-fast);
  margin-top: var(--md3-space-1);
}

.serve-btn__icon {
  font-size: 0.875rem;
}

.serve-btn__spinner {
  width: 14px;
  height: 14px;
  border: 2px solid var(--md3-outline-variant);
  border-top-color: currentColor;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

/* Ready state: primary outline */
.serve-btn--ready {
  color: var(--md3-primary);
  border-color: var(--md3-primary);
}

.serve-btn--ready:hover:not(:disabled) {
  background: var(--md3-primary-container);
}

/* Served state: filled, secondary */
.serve-btn--served {
  color: var(--md3-on-secondary);
  background: var(--md3-secondary);
  border-color: var(--md3-secondary);
}

.serve-btn--served:hover:not(:disabled) {
  background: var(--md3-secondary-dim, var(--md3-secondary));
  opacity: 0.9;
}

.serve-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Mobile serve button adjustments */
.serve-btn--mobile {
  margin-top: var(--md3-space-2);
  padding: var(--md3-space-2) var(--md3-space-3);
}

/* ─── Confirmation dialog styles ─── */
.dialog--confirm {
  max-width: 360px;
  text-align: center;
}

.dialog__header--confirm {
  flex-direction: column;
  gap: var(--md3-space-3);
  padding-bottom: var(--md3-space-3);
  border-bottom: none;
}

.dialog__confirm-icon {
  font-size: 2.5rem;
  color: var(--md3-tertiary);
}

.dialog__body {
  padding: 0 var(--md3-space-6) var(--md3-space-4);
}

.dialog__text {
  margin: 0;
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-md);
  color: var(--md3-on-surface-variant);
  line-height: 1.5;
}

.dialog__actions {
  display: flex;
  gap: var(--md3-space-2);
  padding: var(--md3-space-3) var(--md3-space-6) var(--md3-space-6);
  justify-content: flex-end;
}

.dialog__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--md3-space-2) var(--md3-space-4);
  border: none;
  border-radius: var(--md3-rounded-full);
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-lg);
  font-weight: var(--md3-weight-semibold);
  cursor: pointer;
  transition: background var(--md3-transition-fast);
}

.dialog__btn--secondary {
  background: transparent;
  color: var(--md3-on-surface-variant);
}

.dialog__btn--secondary:hover {
  background: var(--md3-surface-container-low);
}

.dialog__btn--primary {
  background: var(--md3-primary);
  color: var(--md3-on-primary);
}

.dialog__btn--primary:hover {
  background: var(--md3-primary-dim);
}
</style>
