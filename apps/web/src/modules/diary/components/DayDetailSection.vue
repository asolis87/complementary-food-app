<template>
  <!-- Pure presentational block — no store reads, no fetches.
       Reused by DiaryPage (expandable) AND the PDF template (off-screen mount).
       Hard constraints (Design § 6 / REQ-C4):
         - NO position: fixed / sticky
         - NO transform: translate(...)
         - System font stack
         - Unicode emoji for symptom icons (no SVG)
  -->
  <div
    class="day-detail"
    :style="{ fontFamily: 'system-ui, -apple-system, \'Segoe UI\', Roboto, sans-serif' }"
  >

    <!-- ── Header: baby name + age + date ─────────────────────────── -->
    <header class="detail-header">
      <div class="detail-baby">
        <span class="detail-baby-name">{{ babyProfile.name }}</span>
        <span class="detail-baby-age">· {{ ageLabel }}</span>
      </div>
      <p class="detail-date">{{ formattedDate }}</p>
    </header>

    <!-- ── Meals grouped by mealType ─────────────────────────────── -->
    <section v-if="groupedMeals.length > 0" class="detail-meals">
      <div
        v-for="group in groupedMeals"
        :key="group.mealType"
        class="detail-meal-group"
      >
        <h3 class="meal-group-title">
          {{ MEAL_TYPE_LABELS[group.mealType] }}
        </h3>

        <div
          v-for="entry in group.entries"
          :key="entry.id"
          class="detail-entry"
        >
          <!-- Food name + reaction -->
          <div class="entry-row">
            <span class="entry-food">{{ entry.food?.name ?? '—' }}</span>
            <span
              v-if="entry.reaction"
              class="entry-reaction"
            >{{ reactionEmoji(entry.reaction) }} {{ REACTION_LABELS[entry.reaction] }}</span>
            <span v-else class="entry-reaction entry-reaction--none">Sin reacción</span>
          </div>

          <!-- Per-entry notes -->
          <p v-if="entry.notes" class="entry-notes">{{ entry.notes }}</p>
        </div>
      </div>
    </section>

    <p v-else class="detail-no-meals">Sin comidas registradas este día.</p>

    <!-- ── Day observation block ─────────────────────────────────── -->
    <section class="detail-observation">
      <h3 class="obs-section-title">Observación del día</h3>

      <template v-if="observation">
        <!-- Stool -->
        <div v-if="observation.stool" class="obs-row">
          <span class="obs-icon" aria-hidden="true">{{ stoolEmoji(observation.stool) }}</span>
          <span class="obs-label">Deposición: {{ STOOL_LABELS[observation.stool] }}</span>
        </div>

        <!-- Symptoms -->
        <div v-if="observation.symptoms.length > 0" class="obs-symptoms">
          <span class="obs-label-title">Síntomas: </span>
          <span
            v-for="sym in observation.symptoms"
            :key="sym"
            class="obs-symptom-chip"
          >{{ symptomEmoji(sym) }} {{ SYMPTOM_LABELS[sym] }}</span>
        </div>

        <!-- Notes -->
        <p v-if="observation.notes" class="obs-notes">{{ observation.notes }}</p>

        <p
          v-if="!observation.stool && observation.symptoms.length === 0 && !observation.notes"
          class="obs-empty"
        >Observación registrada sin datos.</p>
      </template>

      <p v-else class="obs-empty">Sin observación registrada para este día.</p>
    </section>

    <!-- ── Footer disclaimer ──────────────────────────────────────── -->
    <footer class="detail-footer">
      <p class="disclaimer">
        Este registro es informativo y no reemplaza la consulta con un profesional pediatra.
      </p>
    </footer>

  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { MealLog, DayObservation, StoolType, SymptomType } from '@pakulab/shared'
import { MealType, ReactionType, STOOL_LABELS, SYMPTOM_LABELS } from '@pakulab/shared'
import type { BabyProfile } from '@pakulab/shared'

// ── Props ─────────────────────────────────────────────────────────────────

const props = defineProps<{
  logs: MealLog[]
  observation: DayObservation | null
  babyProfile: BabyProfile
  date: string  // YYYY-MM-DD
}>()

// ── Constants ─────────────────────────────────────────────────────────────

const MEAL_TYPE_LABELS: Record<MealType, string> = {
  [MealType.BREAKFAST]: 'Desayuno',
  [MealType.LUNCH]:     'Comida',
  [MealType.DINNER]:    'Cena',
  [MealType.SNACK]:     'Colación',
  [MealType.SNACK_1]:   'Colación 1',
  [MealType.SNACK_2]:   'Colación 2',
}

const REACTION_LABELS: Record<ReactionType, string> = {
  [ReactionType.LIKED]:    'Le gustó',
  [ReactionType.DISLIKED]: 'No le gustó',
  [ReactionType.NEUTRAL]:  'Neutral',
  [ReactionType.REJECTED]: 'Lo rechazó',
}

// Meal type sort order for display
const MEAL_ORDER: MealType[] = [
  MealType.BREAKFAST,
  MealType.LUNCH,
  MealType.SNACK,
  MealType.SNACK_1,
  MealType.SNACK_2,
  MealType.DINNER,
]

// ── Computed ──────────────────────────────────────────────────────────────

interface MealGroup {
  mealType: MealType
  entries: MealLog[]
}

const groupedMeals = computed<MealGroup[]>(() => {
  const map = new Map<MealType, MealLog[]>()
  for (const entry of props.logs) {
    const group = map.get(entry.mealType) ?? []
    group.push(entry)
    map.set(entry.mealType, group)
  }
  return MEAL_ORDER
    .filter((mt) => map.has(mt))
    .map((mt) => ({ mealType: mt, entries: map.get(mt)! }))
})

const formattedDate = computed<string>(() => {
  const d = new Date(props.date + 'T00:00:00')
  return d.toLocaleDateString('es-MX', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
})

const ageLabel = computed<string>(() => {
  if (!props.babyProfile.birthDate) return ''
  const birth = new Date(props.babyProfile.birthDate + 'T00:00:00')
  const ref = new Date(props.date + 'T00:00:00')
  const diffMs = ref.getTime() - birth.getTime()
  const diffDays = Math.floor(diffMs / 86400000)
  const months = Math.floor(diffDays / 30.44)
  if (months < 1) return `${diffDays} días`
  if (months < 24) return `${months} meses`
  const years = Math.floor(months / 12)
  const rem = months % 12
  return rem > 0 ? `${years} años y ${rem} meses` : `${years} años`
})

// ── Helpers ───────────────────────────────────────────────────────────────

function reactionEmoji(r: ReactionType): string {
  const map: Record<ReactionType, string> = {
    LIKED:    '😊',
    DISLIKED: '😣',
    NEUTRAL:  '😐',
    REJECTED: '🙅',
  }
  return map[r] ?? '•'
}

function stoolEmoji(stool: StoolType): string {
  const map: Record<StoolType, string> = {
    NORMAL: '✅',
    LOOSE:  '💧',
    HARD:   '🪨',
    NONE:   '⛔',
  }
  return map[stool] ?? '❓'
}

function symptomEmoji(sym: SymptomType): string {
  const map: Record<SymptomType, string> = {
    ALLERGY_SUSPECT: '⚠️',
    RASH:            '🔴',
    GAS:             '💨',
    VOMITING:        '🤢',
    FEVER:           '🌡️',
  }
  return map[sym] ?? '•'
}
</script>

<style scoped>
/* ═══════════════════════════════════════════════════════════════════════
   DayDetailSection — pure presentational. No position fixed/sticky,
   no transform. Safe for off-screen html2canvas PDF rendering.
   ═══════════════════════════════════════════════════════════════════════ */

.day-detail {
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-5, 1.25rem);
  padding: var(--md3-space-4, 1rem);
  background: var(--md3-surface, #fff);
  color: var(--md3-on-surface, #1a1a1a);
}

/* ─── Header ─────────────────────────────────────────────────────── */
.detail-header {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding-bottom: var(--md3-space-3, 0.75rem);
  border-bottom: 1px solid var(--md3-outline-variant, #e0e0e0);
}

.detail-baby {
  display: flex;
  align-items: baseline;
  gap: 0.375rem;
}

.detail-baby-name {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--md3-on-surface, #1a1a1a);
}

.detail-baby-age {
  font-size: 0.875rem;
  color: var(--md3-on-surface-variant, #666);
}

.detail-date {
  font-size: 0.875rem;
  color: var(--md3-on-surface-variant, #666);
  margin: 0;
  text-transform: capitalize;
}

/* ─── Meals ──────────────────────────────────────────────────────── */
.detail-meals {
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-4, 1rem);
}

.detail-meal-group {
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-2, 0.5rem);
}

.meal-group-title {
  font-size: 0.8125rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--md3-outline, #888);
  margin: 0;
}

.detail-entry {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  padding: 0.5rem 0.75rem;
  background: var(--md3-surface-container-lowest, #f9f9f9);
  border-radius: 8px;
}

.entry-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.entry-food {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--md3-on-surface, #1a1a1a);
}

.entry-reaction {
  font-size: 0.8125rem;
  color: var(--md3-on-surface-variant, #666);
}

.entry-reaction--none {
  font-style: italic;
  opacity: 0.7;
}

.entry-notes {
  font-size: 0.8125rem;
  color: var(--md3-on-surface-variant, #666);
  font-style: italic;
  margin: 0;
  padding-left: 0.25rem;
}

.detail-no-meals {
  font-size: 0.875rem;
  color: var(--md3-on-surface-variant, #666);
  font-style: italic;
  margin: 0;
}

/* ─── Observation ────────────────────────────────────────────────── */
.detail-observation {
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-2, 0.5rem);
  padding: var(--md3-space-3, 0.75rem);
  background: var(--md3-surface-container, #f5f5f5);
  border-radius: 8px;
}

.obs-section-title {
  font-size: 0.8125rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--md3-outline, #888);
  margin: 0;
}

.obs-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.obs-icon {
  font-size: 1rem;
}

.obs-label {
  font-size: 0.875rem;
  color: var(--md3-on-surface, #1a1a1a);
}

.obs-symptoms {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.375rem;
}

.obs-label-title {
  font-size: 0.875rem;
  color: var(--md3-on-surface, #1a1a1a);
  font-weight: 600;
}

.obs-symptom-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.15rem 0.5rem;
  background: var(--md3-tertiary-container, #e8f4f8);
  color: var(--md3-on-tertiary-container, #1a3a4a);
  border-radius: 100px;
  font-size: 0.8125rem;
  font-weight: 500;
}

.obs-notes {
  font-size: 0.875rem;
  color: var(--md3-on-surface-variant, #666);
  font-style: italic;
  margin: 0;
}

.obs-empty {
  font-size: 0.875rem;
  color: var(--md3-on-surface-variant, #666);
  font-style: italic;
  margin: 0;
}

/* ─── Footer ─────────────────────────────────────────────────────── */
.detail-footer {
  border-top: 1px solid var(--md3-outline-variant, #e0e0e0);
  padding-top: var(--md3-space-3, 0.75rem);
}

.disclaimer {
  font-size: 0.75rem;
  color: var(--md3-on-surface-variant, #888);
  font-style: italic;
  margin: 0;
  line-height: 1.5;
  text-align: center;
}
</style>
