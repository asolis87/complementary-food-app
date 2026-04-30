<template>
  <div class="obs-block">
    <!-- ── Populated state ──────────────────────────────────────────── -->
    <template v-if="observation">
      <div class="obs-row">
        <!-- Stool icon -->
        <span
          v-if="observation.stool"
          class="obs-stool"
          :title="STOOL_LABELS[observation.stool]"
          :aria-label="`Deposición: ${STOOL_LABELS[observation.stool]}`"
        >{{ stoolEmoji(observation.stool) }}</span>

        <!-- Symptom chips -->
        <div v-if="observation.symptoms.length > 0" class="obs-symptoms" aria-label="Síntomas del día">
          <span
            v-for="sym in observation.symptoms"
            :key="sym"
            class="symptom-chip"
            :title="SYMPTOM_LABELS[sym]"
          >
            {{ symptomEmoji(sym) }} {{ SYMPTOM_LABELS[sym] }}
          </span>
        </div>

        <!-- No symptoms placeholder when stool set but no symptoms -->
        <span v-else class="obs-no-symptoms">Sin síntomas</span>
      </div>

      <!-- Notes preview (truncated) -->
      <p v-if="observation.notes" class="obs-notes">
        {{ truncated(observation.notes) }}
        <button
          v-if="observation.notes.length > NOTE_TRUNCATE"
          class="obs-expand-btn"
          aria-label="Ver nota completa"
          @click.stop="emit('open-sheet')"
        >ver más</button>
      </p>

      <!-- Edit CTA -->
      <button class="obs-cta obs-cta--edit" @click="emit('open-sheet')">
        <span class="material-symbols-outlined obs-cta-icon" aria-hidden="true">edit_note</span>
        Editar observación
      </button>
    </template>

    <!-- ── Empty state ──────────────────────────────────────────────── -->
    <template v-else>
      <div class="obs-empty">
        <span class="obs-empty-icon" aria-hidden="true">📋</span>
        <p class="obs-empty-text">Sin observación del día</p>
      </div>
      <button class="obs-cta obs-cta--add" @click="emit('open-sheet')">
        <span class="material-symbols-outlined obs-cta-icon" aria-hidden="true">add_circle</span>
        Registrar observación del día
      </button>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { DayObservation, StoolType, SymptomType } from '@pakulab/shared'
import { STOOL_LABELS, SYMPTOM_LABELS } from '@pakulab/shared'

// ── Props & Emits ─────────────────────────────────────────────────────────

defineProps<{
  observation: DayObservation | null
}>()

const emit = defineEmits<{
  (e: 'open-sheet'): void
}>()

// ── Constants ─────────────────────────────────────────────────────────────

const NOTE_TRUNCATE = 80

// ── Helpers ───────────────────────────────────────────────────────────────

function truncated(text: string): string {
  if (text.length <= NOTE_TRUNCATE) return text
  return text.slice(0, NOTE_TRUNCATE) + '…'
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
   DayObservationBlock — read-only summary in the daily card
   ═══════════════════════════════════════════════════════════════════════ */

.obs-block {
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-2);
}

/* ─── Populated row ────────────────────────────────────────────────── */
.obs-row {
  display: flex;
  align-items: center;
  gap: var(--md3-space-2);
  flex-wrap: wrap;
}

.obs-stool {
  font-size: 1.25rem;
  line-height: 1;
  cursor: default;
}

.obs-symptoms {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
}

.symptom-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.2rem 0.6rem;
  background: var(--md3-tertiary-container);
  color: var(--md3-on-tertiary-container);
  border-radius: var(--md3-rounded-full);
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-sm);
  font-weight: var(--md3-weight-medium);
  white-space: nowrap;
}

.obs-no-symptoms {
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-sm);
  color: var(--md3-on-surface-variant);
  font-style: italic;
}

/* ─── Notes ─────────────────────────────────────────────────────────── */
.obs-notes {
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-sm);
  color: var(--md3-on-surface-variant);
  margin: 0;
  line-height: var(--md3-body-line-height);
  font-style: italic;
}

.obs-expand-btn {
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  color: var(--md3-primary);
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-sm);
  font-weight: var(--md3-weight-semibold);
  text-decoration: underline;
  text-underline-offset: 2px;
}

/* ─── Empty state ────────────────────────────────────────────────────── */
.obs-empty {
  display: flex;
  align-items: center;
  gap: var(--md3-space-2);
}

.obs-empty-icon {
  font-size: 1.25rem;
  line-height: 1;
}

.obs-empty-text {
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-sm);
  color: var(--md3-on-surface-variant);
  margin: 0;
  font-style: italic;
}

/* ─── CTA button ─────────────────────────────────────────────────────── */
.obs-cta {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.45rem 0.875rem;
  border: none;
  border-radius: var(--md3-rounded-full);
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-md);
  font-weight: var(--md3-weight-semibold);
  cursor: pointer;
  transition: all var(--md3-transition-fast);
  align-self: flex-start;
}

.obs-cta--add {
  background: var(--md3-primary-container);
  color: var(--md3-on-primary-container);
}

.obs-cta--add:hover {
  filter: brightness(0.93);
}

.obs-cta--edit {
  background: var(--md3-surface-container);
  color: var(--md3-on-surface-variant);
}

.obs-cta--edit:hover {
  background: var(--md3-surface-container-high);
}

.obs-cta-icon {
  font-size: 1rem;
  line-height: 1;
}
</style>
