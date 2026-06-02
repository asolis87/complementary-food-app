<template>
  <div class="dashboard-skeleton" role="status" aria-label="Cargando dashboard" aria-busy="true">
    <!-- Header skeleton -->
    <div class="skeleton-header">
      <div class="skeleton-greeting">
        <div class="skeleton-emoji" />
        <div class="skeleton-greeting-text">
          <div class="skeleton-line skeleton-line-medium" />
          <div class="skeleton-line skeleton-line-short skeleton-line--large" />
        </div>
      </div>
      <div class="skeleton-baby-info">
        <div class="skeleton-line skeleton-line-medium" />
        <div class="skeleton-badges">
          <div class="skeleton-badge" />
          <div class="skeleton-badge skeleton-badge--secondary" />
        </div>
      </div>
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
            <div class="skeleton-slot-icon" />
            <div class="skeleton-slot-content">
              <div class="skeleton-line skeleton-line-medium" />
              <div class="skeleton-line skeleton-line-short" />
            </div>
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
            <div v-for="n in 3" :key="n" class="skeleton-suggestion-item">
              <div class="skeleton-suggestion-icon" />
              <div class="skeleton-suggestion-content">
                <div class="skeleton-line skeleton-line-medium" />
                <div class="skeleton-line skeleton-line-long" />
                <div class="skeleton-line skeleton-line-short" />
              </div>
            </div>
          </div>
        </div>

        <div class="skeleton-card skeleton-card--warning">
          <div class="skeleton-card-title">
            <div class="skeleton-line skeleton-line-medium" />
          </div>
          <div class="skeleton-line skeleton-line-long" />
          <div class="skeleton-line skeleton-line-medium" />
        </div>
      </div>

      <!-- Col 3: Roadmap -->
      <div class="skeleton-card skeleton-col-3">
        <div class="skeleton-card-title">
          <div class="skeleton-line skeleton-line-short" />
        </div>
        <div class="skeleton-roadmap">
          <div v-for="n in 5" :key="n" class="skeleton-roadmap-item">
            <div class="skeleton-roadmap-icon" />
            <div class="skeleton-roadmap-content">
              <div class="skeleton-line skeleton-line-short" />
              <div class="skeleton-roadmap-bar">
                <div class="skeleton-roadmap-fill" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Full width: Insight -->
    <div class="skeleton-card skeleton-insight">
      <div class="skeleton-insight-row">
        <div class="skeleton-insight-icon" />
        <div class="skeleton-insight-content">
          <div class="skeleton-line skeleton-line-medium" />
          <div class="skeleton-line skeleton-line-long" />
        </div>
        <div class="skeleton-line skeleton-line-short" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// No logic needed — presentation-only skeleton with shimmer animation (CSS)
</script>

<style scoped>
/* ═══════════════════════════════════════════════════════════════════════
   DashboardSkeleton — Nurture & Growth redesign
   Updated to match new card styling, spacing, and visual hierarchy.
   ═══════════════════════════════════════════════════════════════════════ */

.dashboard-skeleton {
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-5);
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
  height: 32px;
}

.skeleton-line-short { width: 40%; }
.skeleton-line-medium { width: 55%; }
.skeleton-line-long { width: 80%; }

@keyframes shimmer {
  0% { background-position: -400px 0; }
  100% { background-position: 400px 0; }
}

/* ─── Header skeleton ───────────────────────────────────────── */
.skeleton-header {
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-4);
  padding: var(--md3-space-4) 0;
}

.skeleton-greeting {
  display: flex;
  align-items: center;
  gap: var(--md3-space-4);
}

.skeleton-emoji {
  width: 48px;
  height: 48px;
  border-radius: var(--md3-rounded-lg);
  background: var(--md3-surface-container);
}

.skeleton-greeting-text {
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-2);
}

.skeleton-baby-info {
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-2);
  padding-left: var(--md3-space-2);
}

.skeleton-badges {
  display: flex;
  gap: var(--md3-space-2);
}

.skeleton-badge {
  height: 28px;
  width: 100px;
  border-radius: var(--md3-rounded-full);
  background: var(--md3-surface-container);
}

.skeleton-badge--secondary {
  background: var(--md3-surface-container-high);
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

  .skeleton-col-1 { grid-column: 1; }
  .skeleton-col-2 { grid-column: 2; }
  .skeleton-col-3 { grid-column: 1 / -1; }
}

/* Desktop: 3-column Bento */
@media (min-width: 1024px) {
  .skeleton-bento {
    grid-template-columns: 1fr 1fr 1fr;
  }

  .skeleton-col-1 { grid-column: 1; }
  .skeleton-col-2 { grid-column: 2; display: flex; flex-direction: column; gap: var(--md3-space-4); }
  .skeleton-col-3 { grid-column: 3; }
}

/* ─── Shared card skeleton ──────────────────────────────────── */
.skeleton-card {
  background: var(--md3-surface-container-low);
  border-radius: var(--md3-rounded-lg);
  padding: var(--md3-space-5);
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-4);
  box-shadow: var(--md3-shadow-ambient);
  border: 1px solid var(--md3-outline-variant);
}

.skeleton-card--warning {
  background: color-mix(in srgb, var(--md3-error-container) 15%, transparent);
  border-color: color-mix(in srgb, var(--md3-error-container) 40%, transparent);
}

.skeleton-card-title {
  margin-bottom: var(--md3-space-2);
}

/* ─── Slots skeleton ────────────────────────────────────────── */
.skeleton-slots {
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-3);
}

.skeleton-slot {
  display: flex;
  align-items: center;
  gap: var(--md3-space-3);
  padding: var(--md3-space-4);
  background: var(--md3-surface-container-low);
  border-radius: var(--md3-rounded-lg);
  border: 1px dashed var(--md3-outline-variant);
}

.skeleton-slot-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--md3-rounded-lg);
  background: var(--md3-surface-container);
  flex-shrink: 0;
}

.skeleton-slot-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-2);
}

/* ─── Suggestions skeleton ──────────────────────────────────── */
.skeleton-suggestions {
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-3);
}

.skeleton-suggestion-item {
  display: flex;
  align-items: center;
  gap: var(--md3-space-3);
  padding: var(--md3-space-3);
  background: var(--md3-surface-container-low);
  border: 1px solid var(--md3-outline-variant);
  border-radius: var(--md3-rounded-lg);
}

.skeleton-suggestion-icon {
  width: 52px;
  height: 52px;
  border-radius: var(--md3-rounded-lg);
  background: var(--md3-surface-container);
  flex-shrink: 0;
}

.skeleton-suggestion-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-2);
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
  gap: var(--md3-space-3);
  padding: var(--md3-space-3);
  background: var(--md3-surface-container-low);
  border: 1px solid var(--md3-outline-variant);
  border-radius: var(--md3-rounded-lg);
}

.skeleton-roadmap-icon {
  width: 40px;
  height: 40px;
  border-radius: var(--md3-rounded-md);
  background: var(--md3-surface-container);
  flex-shrink: 0;
}

.skeleton-roadmap-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-1);
}

.skeleton-roadmap-bar {
  height: 8px;
  background: var(--md3-surface-container-high);
  border-radius: var(--md3-rounded-full);
  overflow: hidden;
}

.skeleton-roadmap-fill {
  height: 100%;
  width: 60%;
  background: var(--md3-surface-container-highest);
  border-radius: var(--md3-rounded-full);
}

/* ─── Insight skeleton ──────────────────────────────────────── */
.skeleton-insight {
  background: var(--md3-gradient-balance-green);
  border-color: color-mix(in srgb, var(--md3-primary) 20%, transparent);
}

.skeleton-insight-row {
  display: flex;
  align-items: center;
  gap: var(--md3-space-4);
}

.skeleton-insight-icon {
  width: 56px;
  height: 56px;
  border-radius: var(--md3-rounded-lg);
  background: var(--md3-surface-container-lowest);
  flex-shrink: 0;
}

.skeleton-insight-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-2);
}

/* ─── Responsive spacing ───────────────────────────────────── */
@media (max-width: 767px) {
  .dashboard-skeleton {
    gap: var(--md3-space-4);
  }
  
  .skeleton-insight-row {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>