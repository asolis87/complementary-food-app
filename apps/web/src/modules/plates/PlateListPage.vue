<template>
  <div class="plate-list-page">
    <!-- Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Mis Platos</h1>
        <p class="page-subtitle">
          <span :class="{ 'limit-reached': atLimit }">
            {{ plateStore.savedPlates.length }} / {{ plateLimit }} platos
          </span>
          <span v-if="atLimit" class="limit-warn"> — límite alcanzado</span>
        </p>
      </div>
      <RouterLink
        to="/plate/new"
        class="fab-btn"
        :class="{ disabled: atLimit }"
        :aria-disabled="atLimit"
        :title="atLimit ? 'Límite de platos alcanzado. Actualizá a Pro.' : 'Crear nuevo plato'"
      >
        <span aria-hidden="true">+</span>
        Nuevo Plato
      </RouterLink>
    </div>

    <!-- Medical disclaimer (REQ-AL-02) -->
    <div class="disclaimer-banner" role="note">
      <span aria-hidden="true">⚕️</span>
      <span>Esta información es orientativa. Consultá siempre con tu pediatra.</span>
    </div>

    <!-- Loading -->
    <div v-if="plateStore.loading" class="state-center" aria-live="polite">
      <div class="spinner" aria-hidden="true" />
      <p>Cargando platos...</p>
    </div>

    <!-- Error -->
    <div v-else-if="plateStore.error" class="state-center error-state" role="alert">
      <span aria-hidden="true">⚠️</span>
      <p>{{ plateStore.error }}</p>
      <button class="retry-btn" @click="plateStore.fetchSavedPlates()">Reintentar</button>
    </div>

    <!-- Empty state -->
    <div
      v-else-if="plateStore.savedPlates.length === 0"
      class="empty-state"
      role="status"
    >
      <span class="empty-icon" aria-hidden="true">🍽️</span>
      <h2 class="empty-title">No tenés platos guardados</h2>
      <p class="empty-subtitle">¡Creá tu primer plato y descubrí el equilibrio A/L de los alimentos de tu bebé!</p>
      <RouterLink to="/plate/new" class="create-btn">Crear mi primer plato</RouterLink>
    </div>

    <!-- Plate cards -->
    <ul v-else class="plate-grid" role="list" aria-label="Mis platos guardados">
      <li v-for="plate in plateStore.savedPlates" :key="plate.id" role="listitem">
        <RouterLink :to="`/plates/${plate.id}`" class="plate-card">
          <!-- Balance dot -->
          <span
            class="balance-dot"
            :class="balanceDotClass(plate.balanceScore)"
            :title="`Balance: ${balanceLabelEs(plate.balanceScore)}`"
            :aria-label="`Balance: ${balanceLabelEs(plate.balanceScore)}`"
          />

          <!-- Card body -->
          <div class="card-body">
            <h3 class="card-name">{{ plate.name }}</h3>
            <p class="card-meta">
              <span class="card-date">{{ formatDate(plate.createdAt) }}</span>
              <span class="separator" aria-hidden="true">·</span>
              <span class="card-items">{{ (plate.items?.length ?? 0) }} alimentos</span>
              <span class="separator" aria-hidden="true">·</span>
              <span class="card-groups">{{ plate.groupCount }} grupos</span>
            </p>
            <!-- A/L mini-counts -->
            <div class="card-counts">
              <span class="count-chip chip-a">A {{ plate.astringentCount }}</span>
              <span class="count-chip chip-n">N {{ plate.neutralCount }}</span>
              <span class="count-chip chip-l">L {{ plate.laxativeCount }}</span>
            </div>
          </div>

          <span class="card-arrow" aria-hidden="true">›</span>
        </RouterLink>
      </li>
    </ul>

    <!-- Pro upsell if at limit -->
    <div v-if="atLimit && !authStore.isPro" class="upsell-banner" role="complementary">
      <span aria-hidden="true">⭐</span>
      <div>
        <strong>Límite de platos alcanzado</strong>
        <p>Con Pro guardás platos ilimitados y mucho más.</p>
      </div>
      <RouterLink to="/pricing" class="upsell-btn">Ver Pro</RouterLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { usePlateStore } from '@/shared/stores/plateStore.js'
import { useAuthStore } from '@/shared/stores/authStore.js'
import { PLATE_LIMITS, BALANCE_THRESHOLD, IMBALANCE_THRESHOLD } from '@cfa/shared'

const plateStore = usePlateStore()
const authStore = useAuthStore()

const plateLimit = computed(() => PLATE_LIMITS[authStore.tier])
const atLimit = computed(
  () => plateStore.savedPlates.length >= plateLimit.value,
)

onMounted(() => {
  plateStore.fetchSavedPlates()
})

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function balanceDotClass(score: number): string {
  const abs = Math.abs(score)
  if (abs <= BALANCE_THRESHOLD) return 'dot-green'
  if (abs <= IMBALANCE_THRESHOLD) return 'dot-yellow'
  return 'dot-red'
}

function balanceLabelEs(score: number): string {
  const abs = Math.abs(score)
  if (abs <= BALANCE_THRESHOLD) return 'Equilibrado'
  if (abs <= IMBALANCE_THRESHOLD) return score > 0 ? 'Más astringente' : 'Más laxante'
  return score > 0 ? 'Muy astringente' : 'Muy laxante'
}
</script>

<style scoped>
.plate-list-page {
  max-width: 600px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* Header */
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.page-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
}

.page-subtitle {
  margin: 0.2rem 0 0;
  font-size: 0.8rem;
  color: #6b7280;
}

.limit-reached {
  color: #f59e0b;
  font-weight: 600;
}

.limit-warn {
  color: #ef4444;
}

.fab-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.65rem 1.1rem;
  background: #10b981;
  color: white;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 700;
  text-decoration: none;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.35);
  transition: background 0.15s;
  white-space: nowrap;
  flex-shrink: 0;
}

.fab-btn:hover {
  background: #059669;
}

.fab-btn.disabled {
  opacity: 0.45;
  pointer-events: none;
}

/* Disclaimer */
.disclaimer-banner {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 0.5rem;
  padding: 0.6rem 0.875rem;
  font-size: 0.8rem;
  color: #166534;
}

/* States */
.state-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 3rem 0;
  color: #6b7280;
}

.error-state {
  color: #ef4444;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e5e7eb;
  border-top-color: #10b981;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.retry-btn {
  padding: 0.5rem 1.25rem;
  background: #f3f4f6;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  font-size: 0.875rem;
}

/* Empty state */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 3rem 1rem;
  text-align: center;
  background: #f9fafb;
  border-radius: 1.5rem;
  border: 2px dashed #e5e7eb;
}

.empty-icon {
  font-size: 3.5rem;
}

.empty-title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: #374151;
}

.empty-subtitle {
  margin: 0;
  font-size: 0.875rem;
  color: #9ca3af;
  max-width: 300px;
}

.create-btn {
  display: inline-flex;
  padding: 0.7rem 1.5rem;
  background: #10b981;
  color: white;
  border-radius: 9999px;
  font-size: 0.9rem;
  font-weight: 700;
  text-decoration: none;
  margin-top: 0.5rem;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
}

/* Plate grid */
.plate-grid {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.plate-card {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  padding: 1rem 1.125rem;
  background: white;
  border-radius: 1rem;
  border: 1px solid #f3f4f6;
  text-decoration: none;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  transition: all 0.15s;
}

.plate-card:hover {
  border-color: #6ee7b7;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.12);
  transform: translateY(-1px);
}

.balance-dot {
  flex-shrink: 0;
  width: 14px;
  height: 14px;
  border-radius: 50%;
}

.dot-green {
  background: #10b981;
}

.dot-yellow {
  background: #f59e0b;
}

.dot-red {
  background: #ef4444;
}

.card-body {
  flex: 1;
  overflow: hidden;
}

.card-name {
  margin: 0 0 0.25rem;
  font-size: 0.95rem;
  font-weight: 700;
  color: #111827;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-meta {
  margin: 0 0 0.35rem;
  font-size: 0.75rem;
  color: #9ca3af;
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
  align-items: center;
}

.separator {
  color: #d1d5db;
}

.card-counts {
  display: flex;
  gap: 0.3rem;
  flex-wrap: wrap;
}

.count-chip {
  font-size: 0.65rem;
  font-weight: 600;
  padding: 0.1rem 0.4rem;
  border-radius: 9999px;
}

.chip-a {
  background: #fee2e2;
  color: #ef4444;
}

.chip-n {
  background: #f3f4f6;
  color: #6b7280;
}

.chip-l {
  background: #d1fae5;
  color: #10b981;
}

.card-arrow {
  flex-shrink: 0;
  font-size: 1.5rem;
  color: #d1d5db;
}

/* Upsell */
.upsell-banner {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  border-radius: 1rem;
  border: 1px solid #fcd34d;
  font-size: 0.875rem;
}

.upsell-banner div {
  flex: 1;
}

.upsell-banner strong {
  display: block;
  color: #92400e;
  font-weight: 700;
}

.upsell-banner p {
  margin: 0.1rem 0 0;
  color: #78350f;
  font-size: 0.8rem;
}

.upsell-btn {
  flex-shrink: 0;
  padding: 0.5rem 1rem;
  background: #f59e0b;
  color: white;
  border-radius: 0.75rem;
  font-size: 0.875rem;
  font-weight: 700;
  text-decoration: none;
  transition: background 0.15s;
}

.upsell-btn:hover {
  background: #d97706;
}
</style>
