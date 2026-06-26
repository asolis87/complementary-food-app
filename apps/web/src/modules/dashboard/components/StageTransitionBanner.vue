<template>
  <section
    v-if="transition"
    class="dashboard-card transition-banner"
    role="region"
    aria-label="Transición de etapa alimentaria"
  >
    <!-- Header with emoji icon -->
    <div class="banner-header">
      <span class="banner-emoji" aria-hidden="true">🎉</span>
      <h2 class="banner-title">{{ bannerCopy.title }}</h2>
    </div>

    <!-- Body message -->
    <p class="banner-message">{{ bannerCopy.message }}</p>

    <!-- CTA buttons -->
    <div class="banner-actions">
      <button
        class="banner-btn banner-btn-primary"
        @click="$emit('show-texture-guide')"
      >
        Ver guía de texturas
      </button>
      <button
        class="banner-btn banner-btn-secondary"
        @click="$emit('dismiss')"
      >
        No mostrar de nuevo
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { AgeStage } from '@pakulab/shared'

const props = defineProps<{
  transition: AgeStage
}>()

defineEmits<{
  'show-texture-guide': []
  'dismiss': []
}>()

interface BannerCopy {
  title: string
  message: string
}

const bannerCopy = computed<BannerCopy>(() => {
  switch (props.transition) {
    case 'TEN_TO_TWELVE_MONTHS':
      return {
        title: '¡Tu bebé cumplió 10 meses!',
        message:
          'Tu bebé ya tiene 10 a 12 meses. Ahora puedes ofrecerle alimentos con texturas más variadas y trozos más pequeños. Revisa la guía de texturas para esta etapa.',
      }
    case 'THIRTEEN_TO_SEVENTEEN_MONTHS':
      return {
        title: '¡Tu bebé cumplió 13 meses!',
        message:
          'Tu bebé ya tiene 13 a 17 meses. Ahora puedes ofrecerle comida familiar adaptada con texturas más complejas. Revisa la guía de texturas para esta nueva etapa.',
      }
    default:
      return {
        title: '',
        message: '',
      }
  }
})
</script>

<style scoped>
/* ═══════════════════════════════════════════════════════════════════════
   StageTransitionBanner — Contextual banner for age milestone transitions
   ═══════════════════════════════════════════════════════════════════════ */

.transition-banner {
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-3);
  padding: var(--md3-space-4);
  background: linear-gradient(
    135deg,
    var(--md3-primary-container) 0%,
    var(--md3-secondary-container) 100%
  );
  border: 1px solid var(--md3-primary);
  border-radius: var(--md3-rounded-lg);
}

/* ── Header ────────────────────────────────────────────────── */
.banner-header {
  display: flex;
  align-items: center;
  gap: var(--md3-space-2);
}

.banner-emoji {
  font-size: 1.5rem;
  line-height: 1;
}

.banner-title {
  margin: 0;
  font-family: var(--md3-font-headline);
  font-size: var(--md3-title-lg);
  font-weight: var(--md3-weight-bold);
  color: var(--md3-on-primary-container);
}

/* ── Body message ──────────────────────────────────────────── */
.banner-message {
  margin: 0;
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-md);
  color: var(--md3-on-primary-container);
  line-height: 1.5;
}

/* ── CTA buttons ───────────────────────────────────────────── */
.banner-actions {
  display: flex;
  gap: var(--md3-space-2);
  flex-wrap: wrap;
}

.banner-btn {
  padding: var(--md3-space-2) var(--md3-space-4);
  border: none;
  border-radius: var(--md3-rounded-md);
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-md);
  font-weight: var(--md3-weight-semibold);
  cursor: pointer;
  transition: opacity var(--md3-transition-fast), transform var(--md3-transition-fast);
  white-space: nowrap;
}

.banner-btn:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

.banner-btn:active {
  transform: translateY(0);
}

.banner-btn-primary {
  background: var(--md3-primary);
  color: var(--md3-on-primary);
}

.banner-btn-secondary {
  background: transparent;
  color: var(--md3-on-primary-container);
  border: 1px solid var(--md3-outline-variant);
}

/* ── Responsive ──────────────────────────────────────────────── */
@media (max-width: 768px) {
  .banner-actions {
    flex-direction: column;
  }

  .banner-btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
