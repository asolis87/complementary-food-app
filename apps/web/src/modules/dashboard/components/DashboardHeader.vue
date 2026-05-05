<template>
  <header class="dashboard-header" role="banner">
    <div class="header-greeting">
      <span class="greeting-emoji" aria-hidden="true">{{ greetingEmoji }}</span>
      <h1 class="greeting-text">
        {{ greetingText }}, <strong>{{ userName }}</strong>
      </h1>
    </div>

    <div class="header-baby-info">
      <span class="baby-name" aria-label="Nombre del bebé">
        <span class="baby-icon" aria-hidden="true">👶</span>
        {{ babyName }}
      </span>
      <span class="baby-meta" aria-label="Edad del bebé">
        {{ babyAgeMonths }} meses
      </span>
      <span
        v-if="daysInAC > 0"
        class="baby-meta"
        :aria-label="`${daysInAC} días en alimentación complementaria`"
      >
        · {{ daysInAC }} días en AC
      </span>

      <span
        v-if="isPro"
        class="pro-badge"
        aria-label="Plan Pro activo"
      >Pro</span>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  userName: string
  babyName: string
  babyAgeMonths: number
  daysInAC: number
  userTier: 'FREE' | 'PRO'
}>()

// ── Time-based greeting ─────────────────────────────────────────────────
const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 12) return { emoji: '🌅', text: 'Buenos días' }
  if (hour < 19) return { emoji: '☀️', text: 'Buenas tardes' }
  return { emoji: '🌙', text: 'Buenas noches' }
})

const greetingEmoji = computed(() => greeting.value.emoji)
const greetingText = computed(() => greeting.value.text)
const isPro = computed(() => props.userTier === 'PRO')
</script>

<style scoped>
.dashboard-header {
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-1);
  padding: var(--md3-space-3) 0 var(--md3-space-2);
}

.header-greeting {
  display: flex;
  align-items: baseline;
  gap: var(--md3-space-2);
  min-width: 0; /* Allow flex shrinking */
}

.greeting-emoji {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.greeting-text {
  margin: 0;
  font-family: var(--md3-font-headline);
  font-size: var(--md3-headline-sm);
  font-weight: var(--md3-weight-regular);
  letter-spacing: var(--md3-headline-tracking);
  line-height: var(--md3-headline-line-height);
  color: var(--md3-on-surface);
  word-wrap: break-word; /* Prevent long names from overflowing */
  overflow-wrap: break-word;
}

.greeting-text strong {
  font-weight: var(--md3-weight-bold);
}

.header-baby-info {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--md3-space-2);
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-md);
  line-height: var(--md3-body-line-height);
  color: var(--md3-on-surface-variant);
  min-width: 0; /* Allow flex shrinking */
}

.baby-icon {
  margin-right: 0.25rem;
}

.baby-name {
  font-weight: var(--md3-weight-semibold);
  color: var(--md3-on-surface);
}

.baby-meta {
  white-space: nowrap;
}

.pro-badge {
  display: inline-flex;
  align-items: center;
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-sm);
  font-weight: var(--md3-weight-bold);
  padding: 0.15rem 0.5rem;
  border-radius: var(--md3-rounded-full);
  background: var(--md3-tertiary-container);
  color: var(--md3-on-tertiary-container);
  letter-spacing: var(--md3-label-tracking);
  margin-left: var(--md3-space-1);
}

/* ── Responsive ──────────────────────────────────────────────── */
@media (min-width: 768px) {
  .dashboard-header {
    flex-direction: row;
    align-items: baseline;
    justify-content: space-between;
  }

  .greeting-text {
    font-size: var(--md3-headline-md);
  }
}
</style>
