<template>
  <div class="auth-layout" :class="`auth-layout--${variant}`">
    <!-- Illustration panel (left on desktop, top on mobile) -->
    <div class="auth-illustration" aria-hidden="true">
      <!-- Background image with overlay for text legibility -->
      <div class="auth-illustration__overlay" />

      <!-- Logo + brand -->
      <div class="auth-brand">
        <div class="auth-brand-icon">
          <span class="material-symbols-outlined">eco</span>
        </div>
        <span class="auth-brand-name">Pakulab</span>
      </div>

      <!-- Tagline (desktop only) -->
      <div class="auth-tagline">
        <h1 class="auth-tagline-headline">
          {{ headline }}
        </h1>
        <p class="auth-tagline-sub">
          {{ tagline }}
        </p>
      </div>
    </div>

    <!-- Form content panel -->
    <div class="auth-content">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  /** Controls the illustration color and messaging */
  variant: 'login' | 'signup'
}>()

const headline = computed(() =>
  props.variant === 'login'
    ? 'Bienvenido de vuelta'
    : 'Empezá tu camino',
)

const tagline = computed(() =>
  props.variant === 'login'
    ? 'Registrá la alimentación de tu bebé con confianza y cariño.'
    : 'Guiá la alimentación complementaria de tu bebé con ciencia y amor.',
)
</script>

<style scoped>
/* ─── Layout shell ─── */
.auth-layout {
  display: grid;
  min-height: 100vh;
  /* Mobile: single column stacked */
  grid-template-rows: 28vh 1fr;
  grid-template-columns: 1fr;
  grid-template-areas:
    'illustration'
    'content';
}

/* Desktop: side-by-side 40/60 split */
@media (min-width: 768px) {
  .auth-layout {
    grid-template-rows: 1fr;
    grid-template-columns: 40% 60%;
    grid-template-areas: 'illustration content';
  }
}

/* ─── Illustration panel ─── */
.auth-illustration {
  grid-area: illustration;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: var(--md3-space-6);
  background-image: url('/images/login-bg.jpeg');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

/* ─── Semi-transparent overlay for text legibility ─── */
.auth-illustration__overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    rgba(0, 0, 0, 0.35) 0%,
    rgba(0, 0, 0, 0.15) 50%,
    rgba(0, 0, 0, 0.4) 100%
  );
  pointer-events: none;
}

/* ─── Brand ─── */
.auth-brand {
  display: flex;
  align-items: center;
  gap: var(--md3-space-2);
  z-index: 1;
  position: relative;
}

.auth-brand-icon {
  width: 40px;
  height: 40px;
  border-radius: var(--md3-rounded-full);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--md3-shadow-card);
  background: rgba(255, 255, 255, 0.95);
  color: var(--md3-primary);
}

.auth-brand-icon .material-symbols-outlined {
  font-size: 1.4rem !important;
}

.auth-brand-name {
  font-family: var(--md3-font-headline);
  font-size: var(--md3-headline-sm);
  font-weight: var(--md3-weight-bold);
  letter-spacing: var(--md3-headline-tracking);
  color: #ffffff;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
}

/* ─── Tagline — desktop only ─── */
.auth-tagline {
  display: none;
  flex-direction: column;
  gap: var(--md3-space-2);
  text-align: center;
  max-width: 280px;
  z-index: 1;
  position: relative;
}

@media (min-width: 768px) {
  .auth-tagline { display: flex; }

  .auth-brand {
    position: absolute;
    top: var(--md3-space-6);
    left: var(--md3-space-6);
  }
}

.auth-tagline-headline {
  margin: 0;
  font-family: var(--md3-font-headline);
  font-size: var(--md3-headline-md);
  font-weight: var(--md3-weight-bold);
  line-height: var(--md3-headline-line-height);
  letter-spacing: var(--md3-headline-tracking);
  color: #ffffff;
  text-shadow: 0 1px 6px rgba(0, 0, 0, 0.4);
}

.auth-tagline-sub {
  margin: 0;
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-md);
  line-height: var(--md3-body-line-height);
  color: rgba(255, 255, 255, 0.9);
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
}

/* ─── Form content panel ─── */
.auth-content {
  grid-area: content;
  background: var(--md3-surface-container-lowest);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--md3-space-6) var(--md3-space-4);
  /* Rounded top corners on mobile (over the illustration) */
  border-radius: var(--md3-rounded-lg) var(--md3-rounded-lg) 0 0;
  box-shadow: var(--md3-shadow-ambient);
  /* Allow scrolling if form is tall on mobile */
  overflow-y: auto;
}

@media (min-width: 768px) {
  .auth-content {
    border-radius: 0;
    box-shadow: none;
    padding: var(--md3-space-8) var(--md3-space-12);
  }
}
</style>
