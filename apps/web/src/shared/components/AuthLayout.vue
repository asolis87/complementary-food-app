<template>
  <div class="auth-layout" :class="`auth-layout--${variant}`">
    <!-- Illustration panel (left on desktop, top on mobile) -->
    <div class="auth-illustration" aria-hidden="true">
      <!-- Decorative blobs -->
      <div class="blob blob-1" />
      <div class="blob blob-2" />
      <div class="blob blob-3" />

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

      <!-- Decorative food icons (desktop only) -->
      <div class="auth-deco">
        <span class="material-symbols-outlined deco-icon deco-1">nutrition</span>
        <span class="material-symbols-outlined deco-icon deco-2">restaurant</span>
        <span class="material-symbols-outlined deco-icon deco-3">local_florist</span>
        <span class="material-symbols-outlined deco-icon deco-4">grass</span>
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
}

/* Login variant → mint green (primary-container based) */
.auth-layout--login .auth-illustration {
  background: linear-gradient(
    145deg,
    var(--md3-primary-container) 0%,
    #7bf5c2 50%,
    var(--md3-group-vegetable) 100%
  );
}

/* Signup variant → warm coral (secondary-container based) */
.auth-layout--signup .auth-illustration {
  background: linear-gradient(
    145deg,
    var(--md3-secondary-container) 0%,
    #ffb49a 50%,
    var(--md3-group-protein) 100%
  );
}

/* ─── Decorative blobs ─── */
.blob {
  position: absolute;
  border-radius: var(--md3-rounded-full);
  opacity: 0.25;
  pointer-events: none;
}

.auth-layout--login .blob { background: var(--md3-on-primary-container); }
.auth-layout--signup .blob { background: var(--md3-on-secondary-container); }

.blob-1 {
  width: 280px;
  height: 280px;
  top: -80px;
  right: -60px;
}

.blob-2 {
  width: 160px;
  height: 160px;
  bottom: -40px;
  left: -30px;
}

.blob-3 {
  width: 100px;
  height: 100px;
  bottom: 30%;
  right: 10%;
  opacity: 0.15;
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
}

.auth-layout--login .auth-brand-icon {
  background: var(--md3-on-primary-container);
  color: var(--md3-primary-container);
}

.auth-layout--signup .auth-brand-icon {
  background: var(--md3-on-secondary-container);
  color: var(--md3-secondary-container);
}

.auth-brand-icon .material-symbols-outlined {
  font-size: 1.4rem !important;
}

.auth-brand-name {
  font-family: var(--md3-font-headline);
  font-size: var(--md3-headline-sm);
  font-weight: var(--md3-weight-bold);
  letter-spacing: var(--md3-headline-tracking);
}

.auth-layout--login .auth-brand-name { color: var(--md3-on-primary-container); }
.auth-layout--signup .auth-brand-name { color: var(--md3-on-secondary-container); }

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
}

.auth-layout--login .auth-tagline-headline { color: var(--md3-on-primary-container); }
.auth-layout--signup .auth-tagline-headline { color: var(--md3-on-secondary-container); }

.auth-tagline-sub {
  margin: 0;
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-md);
  line-height: var(--md3-body-line-height);
  opacity: 0.8;
}

.auth-layout--login .auth-tagline-sub { color: var(--md3-on-primary-container); }
.auth-layout--signup .auth-tagline-sub { color: var(--md3-on-secondary-container); }

/* ─── Decorative icons — desktop only ─── */
.auth-deco {
  display: none;
  position: absolute;
  inset: 0;
  pointer-events: none;
}

@media (min-width: 768px) {
  .auth-deco { display: block; }
}

.deco-icon {
  position: absolute;
  font-size: 2.5rem !important;
  opacity: 0.12;
}

.auth-layout--login .deco-icon { color: var(--md3-on-primary-container); }
.auth-layout--signup .deco-icon { color: var(--md3-on-secondary-container); }

.deco-1 { bottom: 15%; left: 8%; font-size: 3rem !important; }
.deco-2 { bottom: 10%; right: 12%; font-size: 2rem !important; }
.deco-3 { top: 30%; left: 5%; font-size: 2.5rem !important; opacity: 0.08; }
.deco-4 { top: 25%; right: 8%; font-size: 2rem !important; opacity: 0.1; }

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
