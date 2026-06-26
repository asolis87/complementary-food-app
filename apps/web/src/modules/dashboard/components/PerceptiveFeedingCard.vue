<template>
  <section
    class="dashboard-card perceptive-feeding-card"
    role="region"
    aria-label="Alimentación perceptiva"
  >
    <!-- Card Header (clickable to expand/collapse) -->
    <button
      class="card-header"
      :aria-expanded="isExpanded"
      aria-controls="principles-content"
      @click="toggle"
    >
      <div class="header-title-group">
        <span class="material-symbols-outlined header-icon" aria-hidden="true">favorite</span>
        <h2 class="card-title">Alimentación perceptiva</h2>
      </div>
      <!-- Expand icon -->
      <span class="expand-icon material-symbols-outlined" aria-hidden="true">
        {{ isExpanded ? 'expand_less' : 'expand_more' }}
      </span>
    </button>

    <!-- Principles list (collapsible) -->
    <Transition name="expand">
      <div
        v-show="isExpanded"
        id="principles-content"
        class="principles-content"
      >
        <ul class="principles-list" role="list">
          <li
            v-for="(principle, idx) in principles"
            :key="idx"
            class="principle-item"
            role="listitem"
          >
            <span class="material-symbols-outlined principle-icon" aria-hidden="true">done</span>
            <span class="principle-text">{{ principle }}</span>
          </li>
        </ul>
      </div>
    </Transition>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { safeGetItem, safeSetItem } from '@/shared/utils/safeStorage'

const SESSION_STORAGE_KEY = 'perceptive-feeding-expanded'

// WHO 5 principles — Mexican Spanish (TUTEO)
const principles = [
  'Identifica las señales de hambre y saciedad de tu bebé.',
  'Alimenta despacio y con paciencia, sin forzar.',
  'Experimenta con diversas combinaciones, sabores, texturas y métodos.',
  'Minimiza las distracciones durante las horas de comida.',
  'Mantén contacto visual.',
]

const isExpanded = ref(false)

onMounted(() => {
  // Check if we have a saved preference in sessionStorage (safe access)
  const savedState = safeGetItem(sessionStorage, SESSION_STORAGE_KEY)
  if (savedState !== null) {
    isExpanded.value = savedState === 'true'
  } else {
    // Default: collapsed on mobile, expanded on desktop (>= 768px)
    const isDesktop = window.matchMedia('(min-width: 768px)').matches
    isExpanded.value = isDesktop
  }
})

function toggle(): void {
  isExpanded.value = !isExpanded.value
  // Persist state in sessionStorage (safe write)
  safeSetItem(sessionStorage, SESSION_STORAGE_KEY, String(isExpanded.value))
}
</script>

<style scoped>
.perceptive-feeding-card {
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-3);
}

/* ── Card header (clickable) ──────────────────────────────────────── */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0;
  background: transparent;
  border: none;
  cursor: pointer;
  width: 100%;
  text-align: left;
  font: inherit;
  color: inherit;
  border-bottom: 1px solid var(--md3-surface-container-high);
  padding-bottom: var(--md3-space-3);
  transition: opacity var(--md3-transition-fast);
}

.card-header:hover {
  opacity: 0.8;
}

.card-header:focus-visible {
  outline: 2px solid var(--md3-primary);
  outline-offset: 2px;
}

.header-title-group {
  display: flex;
  align-items: center;
  gap: var(--md3-space-2);
}

.header-icon {
  color: var(--md3-primary);
  font-size: 1.5rem !important;
}

.card-title {
  margin: 0;
  font-family: var(--md3-font-headline);
  font-size: var(--md3-title-lg);
  font-weight: var(--md3-weight-semibold);
  color: var(--md3-on-surface);
}

.expand-icon {
  font-size: 1.25rem;
  color: var(--md3-on-surface-variant);
  flex-shrink: 0;
  transition: transform var(--md3-transition-fast);
}

/* ── Principles list ──────────────────────────────────────────────── */
.principles-content {
  padding-top: var(--md3-space-2);
}

.principles-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-3);
}

.principle-item {
  display: flex;
  align-items: flex-start;
  gap: var(--md3-space-2);
}

.principle-icon {
  color: var(--md3-primary);
  font-size: 1.15rem !important;
  margin-top: 2px;
  flex-shrink: 0;
}

.principle-text {
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-md);
  color: var(--md3-on-surface-variant);
  line-height: 1.5;
}

/* ── Transition animation ─────────────────────────────────────────── */
.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
