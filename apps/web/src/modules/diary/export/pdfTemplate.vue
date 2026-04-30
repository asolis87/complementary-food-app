<template>
  <!-- A4 off-screen PDF template.
       Hard constraints (Design § 6 / REQ-C4):
         - NO position: fixed / sticky
         - NO transform: translate(...)
         - System font stack
         - Background #ffffff
         - Unicode emoji for symptom icons (no SVG, no PNG)
       Width = 794px @ 96dpi (A4 portrait).
  -->
  <div
    ref="rootEl"
    class="pdf-template-root"
    :style="{
      width: '794px',
      background: '#ffffff',
      fontFamily: 'system-ui, -apple-system, \'Segoe UI\', Roboto, sans-serif',
    }"
  >
    <DayDetailSection
      :logs="logs"
      :observation="observation"
      :baby-profile="babyProfile"
      :date="date"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { MealLog, DayObservation, BabyProfile } from '@pakulab/shared'
import DayDetailSection from '../components/DayDetailSection.vue'

// ── Props ──────────────────────────────────────────────────────────────────

defineProps<{
  logs: MealLog[]
  observation: DayObservation | null
  babyProfile: BabyProfile
  date: string // YYYY-MM-DD
}>()

// ── Expose root element so the caller can pass it to html2canvas ───────────

const rootEl = ref<HTMLDivElement | null>(null)

defineExpose({ rootEl })
</script>
