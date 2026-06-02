<template>
  <header class="dashboard-header" role="banner">
    <!-- Left side: Greeting -->
    <h1 class="greeting-title">
      <span class="greeting-word" :class="greetingClass">{{ greetingText }}</span>, <span class="user-name">{{ userName }}</span>
    </h1>

    <!-- Right side: Baby profile capsule -->
    <div class="baby-capsule">
      <div class="baby-avatar">
        <span class="baby-emoji" aria-hidden="true">👶</span>
        <span class="baby-name">{{ babyName }}</span>
      </div>
      <span class="separator">·</span>
      <span class="baby-meta">{{ babyAgeMonths }} meses</span>
      <span class="separator">·</span>
      <span class="baby-meta">{{ daysInAC }} días en AC</span>
      <span v-if="isPro" class="pro-badge" aria-label="Plan Pro activo">
        Pro
      </span>
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
  if (hour < 12) return { text: 'Buenos días', class: 'greeting-word--morning' }
  if (hour < 19) return { text: 'Buenas tardes', class: 'greeting-word--afternoon' }
  return { text: 'Buenas noches', class: 'greeting-word--night' }
})

const greetingText = computed(() => greeting.value.text)
const greetingClass = computed(() => greeting.value.class)
const isPro = computed(() => props.userTier === 'PRO')
</script>

<style scoped>
/* ═══════════════════════════════════════════════════════════════════════
   DashboardHeader — Nurture & Growth redesign
   Matches screen.png exactly: horizontal layout with greeting on the left
   and beautiful baby profile pill capsule on the right.
   ═══════════════════════════════════════════════════════════════════════ */

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--md3-space-4) 0;
  width: 100%;
}

/* ─── Greeting Section ─────────────────────────────────── */
.greeting-title {
  margin: 0;
  font-family: var(--md3-font-headline);
  font-size: 24px;
  font-weight: 700;
  color: var(--md3-on-surface);
}

.greeting-word {
  transition: color var(--md3-transition-fast);
}

.greeting-word--morning {
  color: #d85c41; /* Warm sunrise coral */
}

.greeting-word--afternoon {
  color: #c27803; /* Golden afternoon amber */
}

.greeting-word--night {
  color: #3b508f; /* Night sky indigo */
}

.user-name {
  font-weight: 700;
}

/* ─── Baby Pill Capsule ────────────────────────────────── */
.baby-capsule {
  display: inline-flex;
  align-items: center;
  gap: var(--md3-space-3);
  padding: 8px 18px;
  background: var(--md3-surface-container-low);
  border-radius: 9999px;
}

.baby-avatar {
  display: flex;
  align-items: center;
  gap: var(--md3-space-2);
}

.baby-emoji {
  font-size: 16px;
}

.baby-name {
  font-family: var(--md3-font-headline);
  font-size: var(--md3-body-md);
  font-weight: 600;
  color: var(--md3-on-surface);
}

.separator {
  color: var(--md3-outline-variant);
  font-weight: bold;
}

.baby-meta {
  font-family: var(--md3-font-body);
  font-size: var(--md3-label-lg);
  color: var(--md3-on-surface-variant);
}

.pro-badge {
  display: inline-flex;
  align-items: center;
  font-family: var(--md3-font-label);
  font-size: 10px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 9999px;
  background: #fd9d1a; /* Gold/Orange from screen.png */
  color: #ffffff;
  text-transform: uppercase;
  margin-left: var(--md3-space-1);
}

/* ─── Responsive ──────────────────────────────────────────── */
@media (max-width: 767px) {
  .dashboard-header {
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: var(--md3-space-2);
    padding: var(--md3-space-3) 0;
  }

  .greeting-title {
    font-size: 20px;
    font-weight: 600;
  }

  .user-name {
    font-weight: 600;
  }

  .baby-capsule {
    width: auto;
    justify-content: center;
    padding: 5px 14px;
    gap: var(--md3-space-2);
  }

  .baby-name {
    font-size: var(--md3-body-sm);
  }

  .baby-meta {
    font-size: var(--md3-label-md);
  }
}
</style>