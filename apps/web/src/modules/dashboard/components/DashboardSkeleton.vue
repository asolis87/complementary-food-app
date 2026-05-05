<template>
  <div class="dashboard-skeleton" role="status" aria-label="Cargando dashboard" aria-busy="true">
    <!-- Header skeleton -->
    <div class="skeleton-header">
      <div class="skeleton-line skeleton-line-short skeleton-line--large" />
      <div class="skeleton-line skeleton-line-medium" />
    </div>

    <!-- Bento Grid skeleton -->
    <div class="skeleton-bento">
      <!-- Col 1: Registros de Hoy -->
      <div class="skeleton-card skeleton-col-1">
        <div class="skeleton-card-title">
          <div class="skeleton-line skeleton-line-short" />
        </div>
        <div class="skeleton-slots">
          <div v-for="n in 4" :key="n" class="skeleton-slot">
            <div class="skeleton-line skeleton-line-icon" />
            <div class="skeleton-line skeleton-line-medium" />
          </div>
        </div>
      </div>

      <!-- Col 2: Sugeridos + Alérgenos -->
      <div class="skeleton-col-2">
        <div class="skeleton-card">
          <div class="skeleton-card-title">
            <div class="skeleton-line skeleton-line-short" />
          </div>
          <div class="skeleton-suggestions">
            <div v-for="n in 3" :key="n" class="skeleton-suggestion-chip">
              <div class="skeleton-line skeleton-line-icon" />
              <div class="skeleton-line skeleton-line-long" />
            </div>
          </div>
        </div>

        <div class="skeleton-card">
          <div class="skeleton-card-title">
            <div class="skeleton-line skeleton-line-short" />
          </div>
          <div class="skeleton-allergens">
            <div v-for="n in 2" :key="n" class="skeleton-allergen-item">
              <div class="skeleton-line skeleton-line-icon" />
              <div class="skeleton-line skeleton-line-medium" />
            </div>
          </div>
        </div>
      </div>

      <!-- Col 3: Roadmap -->
      <div class="skeleton-card skeleton-col-3">
        <div class="skeleton-card-title">
          <div class="skeleton-line skeleton-line-short" />
        </div>
        <div class="skeleton-roadmap">
          <div v-for="n in 5" :key="n" class="skeleton-roadmap-item">
            <div class="skeleton-line skeleton-line-icon" />
            <div class="skeleton-roadmap-bar">
              <div class="skeleton-line skeleton-line-full" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Full width: Insight -->
    <div class="skeleton-card skeleton-insight">
      <div class="skeleton-insight-row">
        <div class="skeleton-line skeleton-line-medium" />
        <div class="skeleton-line skeleton-line-short" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// No logic needed — presentation-only skeleton with shimmer animation (CSS)
</script>

<style scoped>
.dashboard-skeleton {
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-4);
}

/* ─── Shimmer animation ──────────────────────────────────────── */
.skeleton-line {
  height: 14px;
  border-radius: var(--md3-rounded-sm);
  background: linear-gradient(
    90deg,
    var(--md3-surface-container) 25%,
    var(--md3-surface-container-high) 50%,
    var(--md3-surface-container) 75%
  );
  background-size: 800px 100%;
  animation: shimmer 1.4s infinite linear;
}

.skeleton-line--large {
  height: 20px;
}

.skeleton-line-short {
  width: 40%;
}

.skeleton-line-medium {
  width: 65%;
}

.skeleton-line-long {
  width: 80%;
}

.skeleton-line-full {
  width: 100%;
}

.skeleton-line-icon {
  width: 28px;
  height: 28px;
  border-radius: 50%;
}

@keyframes shimmer {
  0% {
    background-position: -400px 0;
  }
  100% {
    background-position: 400px 0;
  }
}

/* ─── Header skeleton ───────────────────────────────────────── */
.skeleton-header {
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-2);
  padding: var(--md3-space-3) 0;
}

/* ─── Bento Grid skeleton ───────────────────────────────────── */
.skeleton-bento {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--md3-space-4);
}

/* Tablet: 2-column */
@media (min-width: 768px) and (max-width: 1023px) {
  .skeleton-bento {
    grid-template-columns: 1fr 1fr;
  }

  .skeleton-col-1 {
    grid-column: 1;
  }

  .skeleton-col-2 {
    grid-column: 2;
  }

  .skeleton-col-3 {
    grid-column: 1 / -1;
  }
}

/* Desktop: 3-column Bento */
@media (min-width: 1024px) {
  .skeleton-bento {
    grid-template-columns: 1fr 1fr 1fr;
  }

  .skeleton-col-1 {
    grid-column: 1;
  }

  .skeleton-col-2 {
    grid-column: 2;
    display: flex;
    flex-direction: column;
    gap: var(--md3-space-4);
  }

  .skeleton-col-3 {
    grid-column: 3;
  }
}

/* ─── Shared card skeleton ──────────────────────────────────── */
.skeleton-card {
  background: var(--md3-surface-container-low);
  border-radius: var(--md3-rounded-lg);
  padding: var(--md3-space-4);
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-3);
}

.skeleton-card-title {
  padding-bottom: var(--md3-space-1);
}

/* ─── Slots skeleton ────────────────────────────────────────── */
.skeleton-slots {
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-2);
}

.skeleton-slot {
  display: flex;
  align-items: center;
  gap: var(--md3-space-2);
  background: var(--md3-surface-container);
  border-radius: var(--md3-rounded-md);
  padding: var(--md3-space-2) var(--md3-space-3);
}

/* ─── Suggestions skeleton ──────────────────────────────────── */
.skeleton-suggestions {
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-2);
}

.skeleton-suggestion-chip {
  display: flex;
  align-items: center;
  gap: var(--md3-space-2);
  background: var(--md3-surface-container);
  border-radius: var(--md3-rounded-md);
  padding: var(--md3-space-2) var(--md3-space-3);
}

/* ─── Allergens skeleton ────────────────────────────────────── */
.skeleton-allergens {
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-2);
}

.skeleton-allergen-item {
  display: flex;
  align-items: center;
  gap: var(--md3-space-2);
  background: var(--md3-surface-container);
  border-radius: var(--md3-rounded-md);
  padding: var(--md3-space-2) var(--md3-space-3);
}

/* ─── Roadmap skeleton ──────────────────────────────────────── */
.skeleton-roadmap {
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-2);
}

.skeleton-roadmap-item {
  display: flex;
  align-items: center;
  gap: var(--md3-space-2);
  background: var(--md3-surface-container);
  border-radius: var(--md3-rounded-md);
  padding: var(--md3-space-2) var(--md3-space-3);
}

.skeleton-roadmap-bar {
  flex: 1;
}

/* ─── Insight skeleton ──────────────────────────────────────── */
.skeleton-insight {
  /* full width card */
}

.skeleton-insight-row {
  display: flex;
  gap: var(--md3-space-3);
  align-items: center;
}

/* ─── Responsive spacing ───────────────────────────────────── */
@media (max-width: 767px) {
  .dashboard-skeleton {
    gap: var(--md3-space-3);
  }
}
</style>
