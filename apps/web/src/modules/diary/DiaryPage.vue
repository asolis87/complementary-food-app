<template>
  <div class="diary-page">

    <!-- ══ PAGE HEADER ═══════════════════════════════════════════════════ -->
    <header class="page-header">
      <div class="header-icon-wrap">
        <span class="material-symbols-outlined header-icon" aria-hidden="true">auto_stories</span>
      </div>
      <div class="header-text">
        <h1 class="page-title">Bitácora del Bebé</h1>
        <p class="page-subtitle">
          <span class="material-symbols-outlined subtitle-icon" aria-hidden="true">child_care</span>
          {{ profileStore.activeProfile?.name ?? 'Tu bebé' }} · explorando sabores
        </p>
      </div>
    </header>

    <!-- ══ DATE NAVIGATION ═══════════════════════════════════════════════ -->
    <nav class="date-nav" aria-label="Seleccionar fecha">
      <div class="date-chip-row" role="group" aria-label="Últimos 7 días">
        <button
          v-for="day in last7Days"
          :key="day.iso"
          class="date-chip"
          :class="{ 'date-chip--active': diaryStore.selectedDate === day.iso }"
          :aria-pressed="diaryStore.selectedDate === day.iso"
          @click="selectDate(day.iso)"
        >
          <span class="material-symbols-outlined date-chip-icon" aria-hidden="true">{{ day.icon }}</span>
          {{ day.label }}
        </button>
      </div>
      <p class="date-display" aria-live="polite">
        <span class="material-symbols-outlined date-display-icon" aria-hidden="true">event</span>
        {{ activeDateLabel }}
      </p>
    </nav>

    <!-- ══ LOADING STATE ════════════════════════════════════════════════ -->
    <div v-if="diaryStore.loading" aria-live="polite">
      <LoadingSkeleton shape="card" :rows="3" aria-label="Cargando entradas del diario..." />
    </div>

    <template v-else>

      <!-- ══ DAILY SUMMARY CARD ════════════════════════════════════════ -->
      <section
        v-if="entriesForDate.length > 0"
        class="summary-card"
        aria-label="Resumen del día"
      >
        <div class="summary-row">
          <!-- Meals count -->
          <div class="summary-stat">
            <span class="material-symbols-outlined summary-icon" aria-hidden="true">restaurant</span>
            <div class="summary-stat-text">
              <span class="summary-number">{{ entriesForDate.length }}</span>
              <span class="summary-label">{{ entriesForDate.length === 1 ? 'comida' : 'comidas' }}</span>
            </div>
          </div>

          <!-- Foods count -->
          <div class="summary-stat">
            <span class="material-symbols-outlined summary-icon" aria-hidden="true">nutrition</span>
            <div class="summary-stat-text">
              <span class="summary-number">{{ entriesForDate.length }}</span>
              <span class="summary-label">alimentos registrados</span>
            </div>
          </div>

          <!-- Allergen alert -->
          <div v-if="hasAllergenAlert" class="summary-alert">
            <span class="material-symbols-outlined alert-icon" aria-hidden="true">warning</span>
            <span class="summary-label">Revisar alérgeno</span>
          </div>
        </div>

        <!-- Food group dots -->
        <div class="summary-groups" aria-label="Grupos alimenticios del día">
          <span class="groups-label">Grupos cubiertos</span>
          <div class="group-dots">
            <span
              v-for="group in coveredGroups"
              :key="group"
              class="group-dot"
              :class="`group-dot--${groupKey(group)}`"
              :title="groupLabel(group)"
              role="img"
              :aria-label="groupLabel(group)"
            />
          </div>
        </div>

        <!-- Allergen alert badges -->
        <div v-if="hasAllergenAlert" class="allergen-alerts" aria-live="assertive">
          <div
            v-for="entry in allergenEntries"
            :key="entry.id"
            class="allergen-alert-badge"
          >
            <span class="material-symbols-outlined allergen-badge-icon" aria-hidden="true">warning</span>
            Alérgeno en {{ mealTypeLabel(entry.mealType) }}:
            <strong>{{ allergenFoodsInEntry(entry).join(', ') }}</strong>
          </div>
        </div>
      </section>

      <!-- ══ MEAL TIMELINE ═════════════════════════════════════════════ -->
      <section
        v-if="entriesForDate.length > 0"
        class="timeline"
        aria-label="Línea del tiempo de comidas"
      >
        <div class="timeline-label">
          <span class="material-symbols-outlined timeline-label-icon" aria-hidden="true">format_list_bulleted</span>
          Registro del día
        </div>

        <div class="timeline-list">

          <!-- ── Plate groups (T-5.3) ────────────────────────────────── -->
          <template v-if="groupedEntries.plateGroups.length > 0">
            <article
              v-for="(group, gIdx) in groupedEntries.plateGroups"
              :key="group.plateId"
              class="meal-card plate-group-card"
            >
              <!-- Timeline connector -->
              <div class="timeline-connector" aria-hidden="true">
                <div class="connector-dot" :class="`connector-dot--${mealTypeKey(group.mealType)}`" />
                <div
                  v-if="gIdx < groupedEntries.plateGroups.length - 1 || groupedEntries.standalone.length > 0"
                  class="connector-line"
                />
              </div>

              <!-- Card content -->
              <div class="meal-card-body">
                <!-- Card header: meal type + time + balance badge -->
                <div class="meal-card-header">
                  <span class="meal-type-badge" :class="`meal-badge--${mealTypeKey(group.mealType)}`">
                    <span class="material-symbols-outlined meal-badge-icon" aria-hidden="true">{{ mealTypeIcon(group.mealType) }}</span>
                    {{ mealTypeLabel(group.mealType) }}
                  </span>
                  <span v-if="group.time" class="meal-time">
                    <span class="material-symbols-outlined time-icon" aria-hidden="true">schedule</span>
                    {{ group.time }}
                  </span>
                  <!-- Plate balance badge -->
                  <span
                    v-if="group.balanceLabel"
                    class="balance-badge"
                    :class="`balance-badge--${balanceLabelKey(group.balanceLabel)}`"
                    :title="balanceLabelText(group.balanceLabel)"
                    role="img"
                    :aria-label="balanceLabelText(group.balanceLabel)"
                  >
                    {{ balanceLabelText(group.balanceLabel) }}
                  </span>
                </div>

                <!-- Food items as chips -->
                <div class="food-chips plate-food-chips" aria-label="Alimentos del plato">
                  <div
                    v-for="entry in group.entries"
                    :key="entry.id"
                    class="plate-food-item"
                  >
                    <!-- Food chip -->
                    <span
                      v-if="entry.food"
                      class="food-chip"
                      :class="{ 'food-chip--allergen': entry.food.isAllergen }"
                    >
                      <span
                        class="material-symbols-outlined food-chip-icon"
                        aria-hidden="true"
                      >{{ entry.food.isAllergen ? 'warning' : 'nutrition' }}</span>
                      {{ entry.food.name }}
                      <span
                        v-if="entry.food.group"
                        class="food-group-dot"
                        :class="`food-group-dot--${groupKey(entry.food.group)}`"
                        :title="groupLabel(entry.food.group)"
                        aria-hidden="true"
                      />
                      <!-- Status badge: sin revisar or reaction -->
                      <span
                        v-if="entry.reaction === null || entry.reaction === undefined"
                        class="status-badge status-badge--unreviewed"
                        title="Sin revisar"
                      >Sin revisar</span>
                      <span
                        v-else
                        class="status-badge"
                        :class="`status-badge--${reactionKey(entry.reaction)}`"
                        :title="reactionLabel(entry.reaction)"
                      >{{ reactionEmoji(entry.reaction) }}</span>
                      <!-- Accepted indicator -->
                      <span
                        v-if="entry.accepted === true"
                        class="accepted-indicator accepted-indicator--yes"
                        title="Lo aceptó"
                        aria-label="Lo aceptó"
                      >
                        <span class="material-symbols-outlined" aria-hidden="true">check_circle</span>
                      </span>
                      <span
                        v-else-if="entry.accepted === false"
                        class="accepted-indicator accepted-indicator--no"
                        title="No lo aceptó"
                        aria-label="No lo aceptó"
                      >
                        <span class="material-symbols-outlined" aria-hidden="true">cancel</span>
                      </span>
                    </span>

                    <!-- Edit button -->
                    <button
                      class="edit-btn"
                      :aria-label="`Editar ${entry.food?.name ?? 'entrada'}`"
                      title="Editar"
                      @click="openEdit(entry)"
                    >
                      <span class="material-symbols-outlined" aria-hidden="true">edit</span>
                    </button>
                    <!-- Delete button -->
                    <button
                      class="delete-btn"
                      :aria-label="`Eliminar ${entry.food?.name ?? 'entrada'}`"
                      title="Eliminar"
                      @click="confirmDelete(entry.id)"
                    >
                      <span class="material-symbols-outlined" aria-hidden="true">delete</span>
                    </button>
                  </div>
                </div>
              </div>
            </article>
          </template>

          <!-- ── Standalone entries (T-5.3) ─────────────────────────── -->
          <article
            v-for="(entry, idx) in groupedEntries.standalone"
            :key="entry.id"
            class="meal-card"
            :class="{ 'meal-card--allergen': entryHasAllergen(entry) }"
          >
            <!-- Timeline connector -->
            <div class="timeline-connector" aria-hidden="true">
              <div class="connector-dot" :class="`connector-dot--${mealTypeKey(entry.mealType)}`" />
              <div v-if="idx < groupedEntries.standalone.length - 1" class="connector-line" />
            </div>

            <!-- Card content -->
            <div class="meal-card-body">
              <!-- Card header row -->
              <div class="meal-card-header">
                <span class="meal-type-badge" :class="`meal-badge--${mealTypeKey(entry.mealType)}`">
                  <span class="material-symbols-outlined meal-badge-icon" aria-hidden="true">{{ mealTypeIcon(entry.mealType) }}</span>
                  {{ mealTypeLabel(entry.mealType) }}
                </span>
                <span v-if="entry.time" class="meal-time">
                  <span class="material-symbols-outlined time-icon" aria-hidden="true">schedule</span>
                  {{ entry.time }}
                </span>
                <span
                  v-if="entryHasAllergen(entry)"
                  class="allergen-flag"
                  title="Alérgeno detectado"
                  role="img"
                  aria-label="Alérgeno detectado"
                >
                  <span class="material-symbols-outlined" aria-hidden="true">warning</span>
                </span>
                <!-- Edit button -->
                <button
                  class="edit-btn"
                  :aria-label="`Editar ${entry.food?.name ?? 'entrada'}`"
                  title="Editar"
                  @click="openEdit(entry)"
                >
                  <span class="material-symbols-outlined" aria-hidden="true">edit</span>
                </button>
                <!-- Delete button -->
                <button
                  class="delete-btn"
                  :aria-label="`Eliminar entrada de ${mealTypeLabel(entry.mealType)}`"
                  title="Eliminar"
                  @click="confirmDelete(entry.id)"
                >
                  <span class="material-symbols-outlined" aria-hidden="true">delete</span>
                </button>
              </div>

              <!-- Food chip (single food per standalone entry) -->
              <div class="food-chips" aria-label="Alimento registrado">
                <span
                  v-if="entry.food"
                  class="food-chip"
                  :class="{ 'food-chip--allergen': entry.food.isAllergen }"
                >
                  <span
                    class="material-symbols-outlined food-chip-icon"
                    aria-hidden="true"
                  >{{ entry.food.isAllergen ? 'warning' : 'nutrition' }}</span>
                  {{ entry.food.name }}
                  <span
                    v-if="entry.food.group"
                    class="food-group-dot"
                    :class="`food-group-dot--${groupKey(entry.food.group)}`"
                    :title="groupLabel(entry.food.group)"
                    aria-hidden="true"
                  />
                  <!-- Status badge -->
                  <span
                    v-if="entry.reaction === null || entry.reaction === undefined"
                    class="status-badge status-badge--unreviewed"
                    title="Sin revisar"
                  >Sin revisar</span>
                  <span
                    v-else
                    class="status-badge"
                    :class="`status-badge--${reactionKey(entry.reaction)}`"
                    :title="reactionLabel(entry.reaction)"
                  >{{ reactionEmoji(entry.reaction) }}</span>
                  <!-- Accepted indicator -->
                  <span
                    v-if="entry.accepted === true"
                    class="accepted-indicator accepted-indicator--yes"
                    title="Lo aceptó"
                    aria-label="Lo aceptó"
                  >
                    <span class="material-symbols-outlined" aria-hidden="true">check_circle</span>
                  </span>
                  <span
                    v-else-if="entry.accepted === false"
                    class="accepted-indicator accepted-indicator--no"
                    title="No lo aceptó"
                    aria-label="No lo aceptó"
                  >
                    <span class="material-symbols-outlined" aria-hidden="true">cancel</span>
                  </span>
                </span>
              </div>

              <!-- Reaction row (full chip, only if reviewed) -->
              <div
                v-if="entry.reaction"
                class="reaction-row"
                :aria-label="`Reacción: ${reactionLabel(entry.reaction)}`"
              >
                <span
                  class="reaction-chip"
                  :class="`reaction-chip--${reactionKey(entry.reaction)}`"
                >
                  <span class="material-symbols-outlined reaction-icon" aria-hidden="true">{{ reactionIcon(entry.reaction) }}</span>
                  {{ reactionLabel(entry.reaction) }}
                </span>
              </div>

              <!-- Notes -->
              <p v-if="entry.notes" class="meal-notes">
                <span class="material-symbols-outlined notes-icon" aria-hidden="true">format_quote</span>
                {{ entry.notes }}
              </p>
            </div>
          </article>

        </div>
      </section>

      <!-- ══ EMPTY STATE ═══════════════════════════════════════════════ -->
      <div v-else class="empty-state" role="status" aria-live="polite">
        <div class="empty-icon-wrap">
          <span class="material-symbols-outlined empty-icon" aria-hidden="true">no_meals</span>
        </div>
        <p class="empty-title">Sin registros para este día</p>
        <p class="empty-body">
          Aún no hay comidas anotadas para esta fecha. ¡Empezá registrando la primera aventura gastronómica!
        </p>
        <button
          class="cta-btn"
          aria-label="Registrar primera comida del día"
          @click="showAddModal = true"
        >
          <span class="material-symbols-outlined" aria-hidden="true">add_circle</span>
          Registrar primera comida
        </button>
      </div>

    </template>

    <!-- ══ FAB ════════════════════════════════════════════════════════════ -->
    <button
      class="fab"
      aria-label="Añadir nueva entrada al diario"
      title="Añadir entrada"
      @click="showAddModal = true"
    >
      <span class="material-symbols-outlined fab-icon" aria-hidden="true">add</span>
    </button>

    <!-- ══ MODALS ═════════════════════════════════════════════════════════ -->
    <AddMealModal
      v-model="showAddModal"
      :baby-profile-id="activeProfileId"
      @logged="onLogged"
    />

    <EditLogModal
      v-if="editingEntry"
      :entry="editingEntry"
      :open="showEditModal"
      @update:open="showEditModal = $event"
      @updated="onEntryUpdated"
    />

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { FoodGroup } from '@pakulab/shared'
import { FOOD_GROUP_LABELS, MealType, ReactionType } from '@pakulab/shared'
import type { MealLog } from '@pakulab/shared'
import { useDiaryStore } from '../../shared/stores/diaryStore.js'
import { useProfileStore } from '../../shared/stores/profileStore.js'
import { useUiStore } from '../../shared/stores/uiStore.js'
import LoadingSkeleton from '../../shared/components/LoadingSkeleton.vue'
import AddMealModal from './components/AddMealModal.vue'
import EditLogModal from './components/EditLogModal.vue'

// ── Stores ─────────────────────────────────────────────────────────────────

const diaryStore = useDiaryStore()
const profileStore = useProfileStore()
const uiStore = useUiStore()

// ── Local state ────────────────────────────────────────────────────────────

const showAddModal = ref(false)

// ── Edit modal state ───────────────────────────────────────────────────────

const editingEntry = ref<MealLog | null>(null)
const showEditModal = computed({
  get: () => editingEntry.value !== null,
  set: (v: boolean) => { if (!v) editingEntry.value = null },
})

function openEdit(entry: MealLog) {
  editingEntry.value = entry
}

function onEntryUpdated() {
  editingEntry.value = null
  // entries are already updated in store by updateEntry()
}

// ── Derived ────────────────────────────────────────────────────────────────

const activeProfileId = computed(() => profileStore.activeProfile?.id ?? '')

const entriesForDate = computed(() =>
  [...diaryStore.entriesForDate].sort((a, b) => {
    if (!a.time || !b.time) return 0
    return a.time.localeCompare(b.time)
  }),
)

// ── Grouped entries (T-5.2) ────────────────────────────────────────────────

interface PlateGroup {
  plateId: string
  mealType: MealType
  time?: string
  balanceLabel: string | null
  entries: MealLog[]
}

const groupedEntries = computed(() => {
  const forDate = entriesForDate.value
  const plateMap = new Map<string, MealLog[]>()
  const standalone: MealLog[] = []

  for (const entry of forDate) {
    if (entry.plateId) {
      const group = plateMap.get(entry.plateId) ?? []
      group.push(entry)
      plateMap.set(entry.plateId, group)
    } else {
      standalone.push(entry)
    }
  }

  const plateGroups: PlateGroup[] = [...plateMap.entries()].map(([plateId, entries]) => ({
    plateId,
    mealType: entries[0].mealType,
    time: entries[0].time ?? undefined,
    balanceLabel: entries[0].plateBalanceLabel ?? null,
    entries,
  }))

  return { plateGroups, standalone }
})

// ── Date navigation ────────────────────────────────────────────────────────

const DAYS_BACK = 7

const last7Days = computed(() => {
  const days: { iso: string; label: string; icon: string }[] = []
  for (let i = 0; i < DAYS_BACK; i++) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const iso = d.toISOString().split('T')[0]

    let label: string
    let icon: string

    if (i === 0) {
      label = 'Hoy'
      icon = 'today'
    } else if (i === 1) {
      label = 'Ayer'
      icon = 'history'
    } else {
      label = d.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric' })
      icon = 'calendar_month'
    }
    days.push({ iso, label, icon })
  }
  return days
})

const activeDateLabel = computed(() => {
  const targetIso = diaryStore.selectedDate
  const d = new Date(targetIso + 'T00:00:00')
  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

  const formatted = d.toLocaleDateString('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  if (targetIso === today) return `Hoy · ${formatted}`
  if (targetIso === yesterday) return `Ayer · ${formatted}`
  return formatted
})

async function selectDate(iso: string) {
  diaryStore.setSelectedDate(iso)
  if (activeProfileId.value) {
    await diaryStore.fetchEntries(activeProfileId.value, iso)
  }
}

// ── Summary computed ───────────────────────────────────────────────────────

// Each entry represents one food, so count is just the number of entries
const totalFoodsToday = computed(() => entriesForDate.value.length)

const coveredGroups = computed<string[]>(() => {
  const groups = new Set<string>()
  entriesForDate.value.forEach((e) => {
    if (e.food?.group) groups.add(e.food.group)
  })
  return Array.from(groups)
})

function entryHasAllergen(entry: MealLog): boolean {
  return entry.food?.isAllergen ?? false
}

const hasAllergenAlert = computed(() =>
  entriesForDate.value.some(entryHasAllergen),
)

const allergenEntries = computed(() =>
  entriesForDate.value.filter(entryHasAllergen),
)

function allergenFoodsInEntry(entry: MealLog): string[] {
  return entry.food?.isAllergen ? [entry.food.name] : []
}

// ── Lifecycle ─────────────────────────────────────────────────────────────

onMounted(async () => {
  if (profileStore.profiles.length === 0) {
    await profileStore.fetchProfiles()
  }
  if (activeProfileId.value) {
    await diaryStore.fetchEntries(activeProfileId.value)
  }
})

// ── Event handlers ─────────────────────────────────────────────────────────

function onLogged() {
  uiStore.addToast('Comida registrada', 'success')
  // Re-fetch to ensure the timeline is up to date for current date
  if (activeProfileId.value) {
    diaryStore.fetchEntries(activeProfileId.value, diaryStore.selectedDate)
  }
}

async function confirmDelete(id: string) {
  // Simple confirm — no custom dialog for now
  if (!confirm('¿Eliminar esta entrada del diario?')) return
  try {
    await diaryStore.deleteEntry(id)
    uiStore.addToast('Entrada eliminada', 'info')
  } catch {
    uiStore.addToast('Error al eliminar la entrada', 'error')
  }
}

// ── Helper functions ───────────────────────────────────────────────────────

const MEAL_TYPE_LABELS: Record<MealType, string> = {
  [MealType.BREAKFAST]: 'Desayuno',
  [MealType.LUNCH]:     'Comida',
  [MealType.DINNER]:    'Cena',
  [MealType.SNACK]:     'Colación',
  [MealType.SNACK_1]:   'Colación 1',
  [MealType.SNACK_2]:   'Colación 2',
}

const MEAL_TYPE_ICONS: Record<MealType, string> = {
  [MealType.BREAKFAST]: 'wb_sunny',
  [MealType.LUNCH]:     'lunch_dining',
  [MealType.DINNER]:    'bedtime',
  [MealType.SNACK]:     'apple',
  [MealType.SNACK_1]:   'apple',
  [MealType.SNACK_2]:   'apple',
}

const REACTION_LABELS_ES: Record<ReactionType, string> = {
  [ReactionType.LIKED]:    'Le gustó',
  [ReactionType.DISLIKED]: 'Lo rechazó',
  [ReactionType.ALLERGIC]: 'Reacción alérgica',
  [ReactionType.NEUTRAL]:  'Sin reacción',
  [ReactionType.GAS]:      'Gases leves',
  [ReactionType.RASH]:     'Sarpullido',
}

const REACTION_ICONS: Record<ReactionType, string> = {
  [ReactionType.LIKED]:    'sentiment_very_satisfied',
  [ReactionType.DISLIKED]: 'sentiment_dissatisfied',
  [ReactionType.ALLERGIC]: 'emergency',
  [ReactionType.NEUTRAL]:  'sentiment_neutral',
  [ReactionType.GAS]:      'air',
  [ReactionType.RASH]:     'healing',
}

// Lowercase key for CSS class names
const REACTION_CSS_KEYS: Record<ReactionType, string> = {
  [ReactionType.LIKED]:    'liked',
  [ReactionType.DISLIKED]: 'disliked',
  [ReactionType.ALLERGIC]: 'allergic',
  [ReactionType.NEUTRAL]:  'neutral',
  [ReactionType.GAS]:      'gas',
  [ReactionType.RASH]:     'rash',
}

const MEAL_TYPE_CSS_KEYS: Record<MealType, string> = {
  [MealType.BREAKFAST]: 'breakfast',
  [MealType.LUNCH]:     'lunch',
  [MealType.DINNER]:    'dinner',
  [MealType.SNACK]:     'snack',
  [MealType.SNACK_1]:   'snack',
  [MealType.SNACK_2]:   'snack',
}

function mealTypeLabel(type: MealType): string {
  return MEAL_TYPE_LABELS[type]
}

function mealTypeIcon(type: MealType): string {
  return MEAL_TYPE_ICONS[type]
}

function mealTypeKey(type: MealType): string {
  return MEAL_TYPE_CSS_KEYS[type] ?? 'breakfast'
}

function reactionLabel(r: ReactionType): string {
  return REACTION_LABELS_ES[r]
}

function reactionIcon(r: ReactionType): string {
  return REACTION_ICONS[r]
}

function reactionKey(r: ReactionType): string {
  return REACTION_CSS_KEYS[r] ?? 'neutral'
}

function groupLabel(group: string): string {
  return FOOD_GROUP_LABELS[group as FoodGroup] ?? group
}

// ── Balance label helpers (T-5.3) ──────────────────────────────────────────

const BALANCE_LABEL_TEXTS: Record<string, string> = {
  BALANCED:            'Equilibrado',
  SLIGHTLY_ASTRINGENT: 'Lev. astringente',
  VERY_ASTRINGENT:     'Muy astringente',
  SLIGHTLY_LAXATIVE:   'Lev. laxante',
  VERY_LAXATIVE:       'Muy laxante',
}

const BALANCE_LABEL_CSS_KEYS: Record<string, string> = {
  BALANCED:            'balanced',
  SLIGHTLY_ASTRINGENT: 'slightly-astringent',
  VERY_ASTRINGENT:     'very-astringent',
  SLIGHTLY_LAXATIVE:   'slightly-laxative',
  VERY_LAXATIVE:       'very-laxative',
}

function balanceLabelText(label: string): string {
  return BALANCE_LABEL_TEXTS[label] ?? label
}

function balanceLabelKey(label: string): string {
  return BALANCE_LABEL_CSS_KEYS[label] ?? 'balanced'
}

// ── Reaction emoji helper (T-5.3) ──────────────────────────────────────────

const REACTION_EMOJIS: Record<ReactionType, string> = {
  [ReactionType.LIKED]:    '😊',
  [ReactionType.DISLIKED]: '😣',
  [ReactionType.ALLERGIC]: '🤧',
  [ReactionType.NEUTRAL]:  '😐',
  [ReactionType.GAS]:      '💨',
  [ReactionType.RASH]:     '🔴',
}

function reactionEmoji(r: ReactionType): string {
  return REACTION_EMOJIS[r] ?? '•'
}

const GROUP_CSS_KEYS: Record<string, string> = {
  FRUIT:         'fruit',
  VEGETABLE:     'vegetable',
  PROTEIN:       'protein',
  CEREAL_TUBER:  'cereal',
  HEALTHY_FAT:   'fat',
}

function groupKey(group: string): string {
  return GROUP_CSS_KEYS[group] ?? 'default'
}
</script>

<style scoped>
/* ═══════════════════════════════════════════════════════════════════════
   DiaryPage — Bitácora del Bebé
   Pakulab Nursery Design System · No-Line Rule · MD3 tokens only
   ═══════════════════════════════════════════════════════════════════════ */

/* ─── Page layout ──────────────────────────────────────────────────── */
.diary-page {
  max-width: 720px;
  margin: 0 auto;
  padding: 1.5rem 1rem 6rem;
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-8);
  position: relative;
}

/* ─── Page Header ──────────────────────────────────────────────────── */
.page-header {
  display: flex;
  align-items: flex-start;
  gap: var(--md3-space-3);
}

.header-icon-wrap {
  flex-shrink: 0;
  width: 52px;
  height: 52px;
  background: var(--md3-primary-container);
  border-radius: var(--md3-rounded-lg);
  display: flex;
  align-items: center;
  justify-content: center;
}

.header-icon {
  font-size: 1.75rem;
  color: var(--md3-on-primary-container);
}

.header-text {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  padding-top: 0.25rem;
}

.page-title {
  font-family: var(--md3-font-headline);
  font-size: var(--md3-headline-md);
  font-weight: var(--md3-weight-bold);
  color: var(--md3-on-surface);
  margin: 0;
  letter-spacing: var(--md3-headline-tracking);
  line-height: var(--md3-headline-line-height);
}

.page-subtitle {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-md);
  color: var(--md3-on-surface-variant);
  margin: 0;
  line-height: var(--md3-body-line-height);
}

.subtitle-icon {
  font-size: 1rem;
  color: var(--md3-primary);
}

/* ─── Date Navigation ──────────────────────────────────────────────── */
.date-nav {
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-2);
}

.date-chip-row {
  display: flex;
  gap: var(--md3-space-2);
  overflow-x: auto;
  scrollbar-width: none;
  padding-bottom: 2px;
}

.date-chip-row::-webkit-scrollbar {
  display: none;
}

.date-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.55rem 1.125rem;
  background: var(--md3-surface-container);
  color: var(--md3-on-surface-variant);
  border: none;
  border-radius: var(--md3-rounded-full);
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-lg);
  font-weight: var(--md3-weight-medium);
  cursor: pointer;
  transition:
    background var(--md3-transition-fast),
    color var(--md3-transition-fast),
    transform var(--md3-transition-fast);
  white-space: nowrap;
  flex-shrink: 0;
}

.date-chip:hover {
  background: var(--md3-surface-container-high);
}

.date-chip--active {
  background: var(--md3-primary-container);
  color: var(--md3-on-primary-container);
  font-weight: var(--md3-weight-semibold);
}

.date-chip--active:hover {
  filter: brightness(0.96);
}

.date-chip-icon {
  font-size: 1rem;
  line-height: 1;
}

.date-display {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-sm);
  color: var(--md3-on-surface-variant);
  margin: 0;
  padding-left: 0.25rem;
  text-transform: capitalize;
}

.date-display-icon {
  font-size: 0.9rem;
  color: var(--md3-outline);
}

/* ─── Daily Summary Card ───────────────────────────────────────────── */
.summary-card {
  background: var(--md3-surface-container-lowest);
  border-radius: var(--md3-rounded-lg);
  padding: var(--md3-space-4);
  box-shadow: var(--md3-shadow-ambient);
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-3);
}

.summary-row {
  display: flex;
  align-items: center;
  gap: var(--md3-space-4);
  flex-wrap: wrap;
}

.summary-stat {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.summary-icon {
  font-size: 1.5rem;
  color: var(--md3-primary);
}

.summary-stat-text {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}

.summary-number {
  font-family: var(--md3-font-headline);
  font-size: var(--md3-title-lg);
  font-weight: var(--md3-weight-bold);
  color: var(--md3-on-surface);
}

.summary-label {
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-sm);
  color: var(--md3-on-surface-variant);
  font-weight: var(--md3-weight-medium);
  text-transform: uppercase;
  letter-spacing: var(--md3-label-tracking);
}

.summary-alert {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.35rem 0.875rem;
  background: var(--md3-error-container);
  border-radius: var(--md3-rounded-full);
}

.alert-icon {
  font-size: 1rem;
  color: var(--md3-on-error-container);
}

.summary-alert .summary-label {
  color: var(--md3-on-error-container);
}

/* ─── Food Group Dots ──────────────────────────────────────────────── */
.summary-groups {
  display: flex;
  align-items: center;
  gap: var(--md3-space-2);
}

.groups-label {
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-sm);
  color: var(--md3-outline);
  font-weight: var(--md3-weight-bold);
  text-transform: uppercase;
  letter-spacing: var(--md3-label-tracking);
  white-space: nowrap;
}

.group-dots {
  display: flex;
  gap: 0.375rem;
  flex-wrap: wrap;
}

.group-dot {
  width: 14px;
  height: 14px;
  border-radius: var(--md3-rounded-full);
  background: var(--md3-surface-container-high);
  transition: transform var(--md3-transition-fast);
}

.group-dot:hover {
  transform: scale(1.2);
}

.group-dot--fruit     { background: var(--md3-group-fruit); }
.group-dot--vegetable { background: var(--md3-group-vegetable); }
.group-dot--protein   { background: var(--md3-group-protein); }
.group-dot--cereal    { background: var(--md3-group-cereal); }
.group-dot--fat       { background: var(--md3-group-fat); }

/* ─── Allergen Alert Badges ────────────────────────────────────────── */
.allergen-alerts {
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-2);
}

.allergen-alert-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem var(--md3-space-3);
  background: var(--md3-error-container);
  border-radius: var(--md3-rounded-md);
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-sm);
  color: var(--md3-on-error-container);
  line-height: var(--md3-body-line-height);
}

.allergen-badge-icon {
  font-size: 1.125rem;
  flex-shrink: 0;
}

/* ─── Timeline ─────────────────────────────────────────────────────── */
.timeline {
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-3);
}

.timeline-label {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-sm);
  font-weight: var(--md3-weight-bold);
  color: var(--md3-outline);
  text-transform: uppercase;
  letter-spacing: var(--md3-label-tracking);
}

.timeline-label-icon {
  font-size: 1rem;
}

.timeline-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}

/* ─── Meal Card ────────────────────────────────────────────────────── */
.meal-card {
  display: flex;
  gap: var(--md3-space-3);
  position: relative;
}

.meal-card--allergen .meal-card-body {
  background: var(--md3-surface-container-low);
}

/* Timeline connector (left spine) */
.timeline-connector {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
  width: 20px;
  padding-top: 1rem;
}

.connector-dot {
  width: 14px;
  height: 14px;
  border-radius: var(--md3-rounded-full);
  background: var(--md3-surface-container-high);
  flex-shrink: 0;
  z-index: 1;
}

.connector-dot--breakfast { background: var(--md3-group-cereal); }
.connector-dot--lunch     { background: var(--md3-group-vegetable); }
.connector-dot--dinner    { background: var(--md3-primary-container); }
.connector-dot--snack     { background: var(--md3-group-fruit); }

.connector-line {
  width: 2px;
  flex: 1;
  min-height: 1.5rem;
  background: var(--md3-surface-container);
  margin-top: 0.25rem;
  margin-bottom: 0;
}

/* Card body */
.meal-card-body {
  flex: 1;
  background: var(--md3-surface-container-lowest);
  border-radius: var(--md3-rounded-lg);
  padding: var(--md3-space-4);
  box-shadow: var(--md3-shadow-ambient);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: var(--md3-space-3);
  transition:
    box-shadow var(--md3-transition-normal),
    transform var(--md3-transition-normal);
}

.meal-card-body:hover {
  box-shadow: var(--md3-shadow-elevated);
  transform: translateY(-1px);
}

/* Card header row */
.meal-card-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

/* Meal type badge */
.meal-type-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.3rem 0.75rem;
  border-radius: var(--md3-rounded-full);
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-md);
  font-weight: var(--md3-weight-semibold);
  background: var(--md3-surface-container);
  color: var(--md3-on-surface-variant);
}

.meal-badge-icon {
  font-size: 0.875rem;
  line-height: 1;
}

.meal-badge--breakfast {
  background: var(--md3-group-cereal);
  color: var(--md3-group-cereal-on);
}

.meal-badge--lunch {
  background: var(--md3-group-vegetable);
  color: var(--md3-group-vegetable-on);
}

.meal-badge--dinner {
  background: var(--md3-primary-container);
  color: var(--md3-on-primary-container);
}

.meal-badge--snack {
  background: var(--md3-group-fruit);
  color: var(--md3-group-fruit-on);
}

/* Time chip */
.meal-time {
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-sm);
  font-weight: var(--md3-weight-medium);
  color: var(--md3-on-surface-variant);
  margin-left: auto;
}

.time-icon {
  font-size: 0.875rem;
}

/* Allergen flag icon */
.allergen-flag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  background: var(--md3-error-container);
  border-radius: var(--md3-rounded-full);
  color: var(--md3-on-error-container);
}

.allergen-flag .material-symbols-outlined {
  font-size: 0.875rem;
}

/* Delete button */
.delete-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--md3-on-surface-variant);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  border-radius: var(--md3-rounded-full);
  transition: all var(--md3-transition-fast);
  opacity: 0.5;
}

.meal-card-body:hover .delete-btn {
  opacity: 1;
}

.delete-btn:hover {
  background: var(--md3-error-container);
  color: var(--md3-on-error-container);
  opacity: 1;
}

.delete-btn .material-symbols-outlined {
  font-size: 1rem;
}

/* ─── Food Chips ───────────────────────────────────────────────────── */
.food-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
}

.food-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.35rem 0.75rem;
  background: var(--md3-tertiary-container);
  color: var(--md3-on-tertiary-container);
  border-radius: var(--md3-rounded-full);
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-md);
  font-weight: var(--md3-weight-medium);
  white-space: nowrap;
}

.food-chip--allergen {
  background: var(--md3-error-container);
  color: var(--md3-on-error-container);
}

.food-chip-icon {
  font-size: 0.875rem;
  line-height: 1;
}

.food-group-dot {
  width: 8px;
  height: 8px;
  border-radius: var(--md3-rounded-full);
  background: var(--md3-surface-container-high);
  flex-shrink: 0;
}

.food-group-dot--fruit     { background: var(--md3-group-fruit-on); opacity: 0.6; }
.food-group-dot--vegetable { background: var(--md3-group-vegetable-on); opacity: 0.6; }
.food-group-dot--protein   { background: var(--md3-group-protein-on); opacity: 0.6; }
.food-group-dot--cereal    { background: var(--md3-group-cereal-on); opacity: 0.6; }
.food-group-dot--fat       { background: var(--md3-group-fat-on); opacity: 0.6; }

/* ─── Reaction Chip ────────────────────────────────────────────────── */
.reaction-row {
  display: flex;
  align-items: center;
}

.reaction-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.3rem 0.75rem;
  border-radius: var(--md3-rounded-full);
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-md);
  font-weight: var(--md3-weight-medium);
  background: var(--md3-surface-container-low);
  color: var(--md3-on-surface-variant);
}

.reaction-chip--liked {
  background: var(--md3-primary-container);
  color: var(--md3-on-primary-container);
}

.reaction-chip--disliked {
  background: var(--md3-secondary-container);
  color: var(--md3-on-secondary-container);
}

.reaction-chip--allergic {
  background: var(--md3-error-container);
  color: var(--md3-on-error-container);
}

.reaction-chip--neutral {
  background: var(--md3-surface-container);
  color: var(--md3-on-surface-variant);
}

.reaction-chip--gas {
  background: var(--md3-tertiary-container);
  color: var(--md3-on-tertiary-container);
}

.reaction-chip--rash {
  background: var(--md3-error-container);
  color: var(--md3-on-error-container);
}

.reaction-icon {
  font-size: 0.875rem;
  line-height: 1;
}

/* ─── Meal Notes ───────────────────────────────────────────────────── */
.meal-notes {
  display: flex;
  align-items: flex-start;
  gap: 0.375rem;
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-sm);
  color: var(--md3-on-surface-variant);
  line-height: var(--md3-body-line-height);
  margin: 0;
  font-style: italic;
  padding: 0.5rem var(--md3-space-3);
  background: var(--md3-surface-container-low);
  border-radius: var(--md3-rounded-md);
}

.notes-icon {
  font-size: 1rem;
  color: var(--md3-outline);
  flex-shrink: 0;
  margin-top: 0.1rem;
}

/* ─── Empty State ──────────────────────────────────────────────────── */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--md3-space-3);
  padding: 4rem 1rem;
  text-align: center;
}

.empty-icon-wrap {
  width: 80px;
  height: 80px;
  background: var(--md3-surface-container-low);
  border-radius: var(--md3-rounded-full);
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-icon {
  font-size: 2.5rem;
  color: var(--md3-outline-variant);
}

.empty-title {
  font-family: var(--md3-font-headline);
  font-size: var(--md3-headline-sm);
  font-weight: var(--md3-weight-semibold);
  color: var(--md3-on-surface);
  margin: 0;
}

.empty-body {
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-md);
  color: var(--md3-on-surface-variant);
  margin: 0;
  max-width: 340px;
  line-height: var(--md3-body-line-height);
}

/* ─── CTA Button (gradient pill) ──────────────────────────────────── */
.cta-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem 1.75rem;
  background: var(--md3-gradient-cta);
  color: var(--md3-on-primary);
  border: none;
  border-radius: var(--md3-rounded-full);
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-lg);
  font-weight: var(--md3-weight-semibold);
  cursor: pointer;
  box-shadow: var(--md3-shadow-card);
  transition:
    background var(--md3-transition-fast),
    box-shadow var(--md3-transition-fast),
    transform var(--md3-transition-fast);
  margin-top: 0.5rem;
}

.cta-btn:hover {
  background: var(--md3-gradient-cta-hover);
  box-shadow: var(--md3-shadow-ambient);
  transform: translateY(-1px);
}

.cta-btn .material-symbols-outlined {
  font-size: 1.25rem;
}

/* ─── FAB ──────────────────────────────────────────────────────────── */
.fab {
  position: fixed;
  bottom: calc(var(--md3-space-8) + env(safe-area-inset-bottom, 0px));
  right: var(--md3-space-6);
  width: 56px;
  height: 56px;
  background: var(--md3-gradient-cta);
  color: var(--md3-on-primary);
  border: none;
  border-radius: var(--md3-rounded-full);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--md3-shadow-elevated);
  cursor: pointer;
  transition:
    box-shadow var(--md3-transition-fast),
    transform var(--md3-transition-fast);
  z-index: 100;
}

.fab:hover {
  box-shadow: 0 12px 40px -8px rgba(0, 105, 75, 0.4);
  transform: scale(1.05);
}

.fab:active {
  transform: scale(0.97);
}

.fab-icon {
  font-size: 1.5rem;
}

/* ─── Balance Badge ────────────────────────────────────────────────── */
.balance-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.625rem;
  border-radius: var(--md3-rounded-full);
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-sm);
  font-weight: var(--md3-weight-semibold);
  background: var(--md3-surface-container);
  color: var(--md3-on-surface-variant);
  white-space: nowrap;
  margin-left: auto;
}

.balance-badge--balanced {
  background: #d4edda;
  color: #155724;
}

.balance-badge--slightly-astringent,
.balance-badge--slightly-laxative {
  background: #fff3cd;
  color: #856404;
}

.balance-badge--very-astringent,
.balance-badge--very-laxative {
  background: var(--md3-error-container);
  color: var(--md3-on-error-container);
}

/* ─── Plate group card ──────────────────────────────────────────── */
.plate-group-card .meal-card-body {
  background: var(--md3-surface-container-lowest);
}

.plate-food-chips {
  flex-direction: column;
  gap: var(--md3-space-2);
}

.plate-food-item {
  display: flex;
  align-items: center;
  gap: var(--md3-space-2);
  flex-wrap: wrap;
}

.plate-food-item .food-chip {
  flex: 1;
  min-width: 0;
}

/* ─── Status badges ─────────────────────────────────────────────── */
.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.15rem 0.45rem;
  border-radius: var(--md3-rounded-full);
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-sm);
  font-weight: var(--md3-weight-medium);
  background: var(--md3-surface-container);
  color: var(--md3-on-surface-variant);
  white-space: nowrap;
  line-height: 1.4;
}

.status-badge--unreviewed {
  background: var(--md3-surface-container-high);
  color: var(--md3-on-surface-variant);
  font-style: italic;
}

.status-badge--liked    { background: var(--md3-primary-container); color: var(--md3-on-primary-container); }
.status-badge--disliked { background: var(--md3-secondary-container); color: var(--md3-on-secondary-container); }
.status-badge--allergic { background: var(--md3-error-container); color: var(--md3-on-error-container); }
.status-badge--neutral  { background: var(--md3-surface-container); color: var(--md3-on-surface-variant); }
.status-badge--gas      { background: var(--md3-tertiary-container); color: var(--md3-on-tertiary-container); }
.status-badge--rash     { background: var(--md3-error-container); color: var(--md3-on-error-container); }

/* ─── Accepted indicator ────────────────────────────────────────── */
.accepted-indicator {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.accepted-indicator .material-symbols-outlined {
  font-size: 1rem;
}

.accepted-indicator--yes .material-symbols-outlined {
  color: #198754;
}

.accepted-indicator--no .material-symbols-outlined {
  color: var(--md3-error);
}

/* ─── Edit button ───────────────────────────────────────────────── */
.edit-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--md3-on-surface-variant);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  border-radius: var(--md3-rounded-full);
  transition: all var(--md3-transition-fast);
  opacity: 0.5;
  flex-shrink: 0;
}

.meal-card-body:hover .edit-btn {
  opacity: 1;
}

.edit-btn:hover {
  background: var(--md3-primary-container);
  color: var(--md3-on-primary-container);
  opacity: 1;
}

.edit-btn .material-symbols-outlined {
  font-size: 1rem;
}

/* ─── Responsive ───────────────────────────────────────────────────── */
@media (max-width: 768px) {
  .diary-page {
    padding: 1rem 0.75rem 5rem;
    gap: var(--md3-space-6);
  }

  .page-title {
    font-size: var(--md3-headline-sm);
  }

  .header-icon-wrap {
    width: 44px;
    height: 44px;
  }

  .header-icon {
    font-size: 1.5rem;
  }

  .summary-card {
    padding: var(--md3-space-3);
  }

  .summary-row {
    gap: var(--md3-space-3);
  }

  .meal-card-body {
    padding: var(--md3-space-3);
  }

  .fab {
    bottom: calc(var(--md3-space-6) + env(safe-area-inset-bottom, 0px));
    right: var(--md3-space-3);
    width: 52px;
    height: 52px;
  }
}

@media (min-width: 769px) {
  .diary-page {
    padding: 2rem 1.5rem 6rem;
  }

  .timeline-list {
    padding-left: var(--md3-space-2);
  }
}
</style>
