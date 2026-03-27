<template>
  <div class="plate-detail-page">
    <!-- Loading -->
    <div v-if="loading" class="state-center" aria-live="polite">
      <div class="spinner" aria-hidden="true" />
      <p>Cargando plato...</p>
    </div>

    <!-- Error / Not found -->
    <div v-else-if="!plate" class="state-center error-state" role="alert">
      <span aria-hidden="true">⚠️</span>
      <p>Plato no encontrado.</p>
      <RouterLink to="/plates" class="back-link">← Volver a mis platos</RouterLink>
    </div>

    <template v-else>
      <!-- Header -->
      <div class="detail-header">
        <RouterLink to="/plates" class="back-btn" aria-label="Volver a mis platos">
          ← Mis platos
        </RouterLink>
        <div class="header-actions">
          <button class="icon-btn btn-edit" title="Editar plato" aria-label="Editar plato" @click="goEdit">
            ✏️ Editar
          </button>
          <button
            class="icon-btn btn-delete"
            title="Eliminar plato"
            aria-label="Eliminar plato"
            @click="handleDelete"
          >
            🗑️
          </button>
        </div>
      </div>

      <!-- Plate title -->
      <div class="plate-title-row">
        <h1 class="plate-title">{{ plate.name }}</h1>
        <span class="plate-date">{{ formatDate(plate.createdAt) }}</span>
      </div>

      <!-- Medical disclaimer (REQ-AL-02) -->
      <div class="disclaimer-banner" role="note">
        <span aria-hidden="true">⚕️</span>
        <span>Esta información es orientativa. Consultá siempre con tu pediatra.</span>
      </div>

      <!-- Balance indicator -->
      <section class="section" aria-label="Equilibrio A/L">
        <BalanceIndicator :balance="plateBalance" />
      </section>

      <!-- Items by group -->
      <section class="section" aria-label="Alimentos por grupo">
        <h2 class="section-title">Alimentos ({{ plate.groupCount }} grupos)</h2>

        <div class="groups-grid">
          <div
            v-for="group in activeGroups"
            :key="group"
            class="group-block"
            :style="{ '--group-color': groupColor(group) }"
          >
            <div class="group-header">
              <span aria-hidden="true">{{ groupIcon(group) }}</span>
              <span>{{ FOOD_GROUP_LABELS[group] }}</span>
            </div>

            <ul
              v-if="itemsByGroup[group]?.length"
              class="items-list"
              :aria-label="`Alimentos en ${FOOD_GROUP_LABELS[group]}`"
            >
              <li
                v-for="item in itemsByGroup[group]"
                :key="item.id"
                class="item-row"
              >
                <span
                  class="al-dot"
                  :class="alDotClass(item.food?.alClassification ?? 'NEUTRAL')"
                  :title="alLabel(item.food?.alClassification ?? 'NEUTRAL')"
                />
                <span class="item-name">{{ item.food?.name ?? item.foodId }}</span>
                <span v-if="item.food?.isAllergen" class="allergen-tag" title="Alérgeno">⚠️</span>
              </li>
            </ul>

            <p v-else class="empty-group">Sin alimentos en este grupo</p>
          </div>
        </div>
      </section>

      <!-- Export button -->
      <div class="export-area">
        <button class="export-btn" :disabled="exporting" @click="handleExport">
          <span v-if="exporting" class="btn-spinner" aria-hidden="true" />
          <span v-else aria-hidden="true">📷</span>
          {{ exporting ? 'Exportando...' : 'Exportar como imagen' }}
        </button>
        <p v-if="!authStore.isPro" class="watermark-note">
          Las imágenes tendrán marca de agua CFA. <RouterLink to="/pricing">Actualizá a Pro</RouterLink> para exportar sin marca.
        </p>
      </div>
    </template>

    <!-- Delete confirmation modal -->
    <div v-if="showDeleteModal" class="modal-overlay" @click.self="showDeleteModal = false">
      <div class="modal" role="dialog" aria-modal="true" aria-label="Confirmar eliminación">
        <h3 class="modal-title">¿Eliminar plato?</h3>
        <p class="modal-body">
          Vas a eliminar <strong>{{ plate?.name }}</strong>. Esta acción no se puede deshacer.
        </p>
        <div class="modal-actions">
          <button class="modal-btn btn-cancel" @click="showDeleteModal = false">Cancelar</button>
          <button class="modal-btn btn-confirm-delete" :disabled="deleting" @click="confirmDelete">
            <span v-if="deleting" class="btn-spinner" aria-hidden="true" />
            {{ deleting ? 'Eliminando...' : 'Sí, eliminar' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { Plate, FoodGroup, ALClassification, BalanceResult } from '@cfa/shared'
import { FOOD_GROUP_LABELS, BASE_GROUPS, OPTIONAL_GROUPS, BALANCE_THRESHOLD, IMBALANCE_THRESHOLD } from '@cfa/shared'
import { usePlateStore } from '@/shared/stores/plateStore.js'
import { useAuthStore } from '@/shared/stores/authStore.js'
import BalanceIndicator from './components/BalanceIndicator.vue'

const route = useRoute()
const router = useRouter()
const plateStore = usePlateStore()
const authStore = useAuthStore()

const plate = ref<Plate | null>(null)
const loading = ref(true)
const exporting = ref(false)
const deleting = ref(false)
const showDeleteModal = ref(false)

onMounted(async () => {
  const id = route.params.id as string
  plate.value = await plateStore.loadPlate(id)
  loading.value = false
})

/** Groups active on this plate */
const activeGroups = computed<FoodGroup[]>(() => {
  if (!plate.value) return [...BASE_GROUPS]
  const groups: FoodGroup[] = [...BASE_GROUPS]
  if (plate.value.groupCount === 5) groups.push(...OPTIONAL_GROUPS)
  return groups
})

/** Items grouped by food group from plate.items */
const itemsByGroup = computed(() => {
  type PlateItemArr = NonNullable<Plate['items']>
  const items = plate.value?.items
  if (!items) return {} as Partial<Record<FoodGroup, PlateItemArr>>
  const grouped: Partial<Record<FoodGroup, PlateItemArr>> = {}
  for (const item of items) {
    if (!grouped[item.groupAssignment]) grouped[item.groupAssignment] = []
    grouped[item.groupAssignment]!.push(item)
  }
  return grouped
})

/** Reconstruct BalanceResult from stored plate data */
const plateBalance = computed((): BalanceResult | null => {
  if (!plate.value) return null
  const { balanceScore, astringentCount, laxativeCount, neutralCount } = plate.value
  const total = astringentCount + laxativeCount + neutralCount
  if (total === 0) return null

  const abs = Math.abs(balanceScore)
  let label: BalanceResult['label'] = 'balanced'
  if (abs > BALANCE_THRESHOLD) label = balanceScore > 0 ? 'astringent' : 'laxative'

  let labelEs = 'Equilibrado'
  if (abs > BALANCE_THRESHOLD && abs <= IMBALANCE_THRESHOLD)
    labelEs = balanceScore > 0 ? 'Más astringente' : 'Más laxante'
  else if (abs > IMBALANCE_THRESHOLD)
    labelEs = balanceScore > 0 ? 'Muy astringente' : 'Muy laxante'

  return {
    score: balanceScore,
    astringent: astringentCount,
    laxative: laxativeCount,
    neutral: neutralCount,
    total,
    label,
    labelEs,
  }
})

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

const GROUP_COLORS: Record<FoodGroup, string> = {
  FRUIT: '#F59E0B',
  VEGETABLE: '#10B981',
  PROTEIN: '#F43F5E',
  CEREAL_TUBER: '#D97706',
  HEALTHY_FAT: '#8B5CF6',
}

const GROUP_ICONS: Record<FoodGroup, string> = {
  FRUIT: '🍎',
  VEGETABLE: '🥦',
  PROTEIN: '🥩',
  CEREAL_TUBER: '🌽',
  HEALTHY_FAT: '🥑',
}

function groupColor(group: FoodGroup): string {
  return GROUP_COLORS[group]
}

function groupIcon(group: FoodGroup): string {
  return GROUP_ICONS[group]
}

function alDotClass(al: ALClassification): string {
  switch (al) {
    case 'ASTRINGENT':
      return 'dot-astringent'
    case 'LAXATIVE':
      return 'dot-laxative'
    default:
      return 'dot-neutral'
  }
}

function alLabel(al: ALClassification): string {
  switch (al) {
    case 'ASTRINGENT':
      return 'Astringente'
    case 'LAXATIVE':
      return 'Laxante'
    default:
      return 'Neutro'
  }
}

function goEdit() {
  // Navigate to plate builder with plate ID for editing
  router.push({ name: 'plate-builder', query: { edit: plate.value?.id } })
}

function handleDelete() {
  showDeleteModal.value = true
}

async function confirmDelete() {
  if (!plate.value) return
  deleting.value = true
  try {
    await plateStore.deletePlate(plate.value.id)
    router.push({ name: 'plates' })
  } catch {
    // Handle error silently — store sets error
  } finally {
    deleting.value = false
    showDeleteModal.value = false
  }
}

async function handleExport() {
  exporting.value = true
  try {
    // Use html2canvas on the detail view
    const { default: html2canvas } = await import('html2canvas')
    const canvas = await html2canvas(document.querySelector('.plate-detail-page') as HTMLElement, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      ignoreElements: (el) =>
        el.classList.contains('modal-overlay') ||
        el.classList.contains('export-area') ||
        el.classList.contains('disclaimer-banner'),
    })
    const dataUrl = canvas.toDataURL('image/png')
    const link = document.createElement('a')
    link.href = dataUrl
    link.download = `${plate.value?.name ?? 'plato'}-cfa.png`
    link.click()
  } catch {
    // silent
  } finally {
    exporting.value = false
  }
}
</script>

<style scoped>
.plate-detail-page {
  max-width: 600px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
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

.back-link {
  color: #10b981;
  text-decoration: none;
  font-size: 0.875rem;
}

/* Header */
.detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.back-btn {
  color: #6b7280;
  text-decoration: none;
  font-size: 0.875rem;
  padding: 0.25rem 0.5rem;
  border-radius: 0.5rem;
  transition: background 0.15s;
}

.back-btn:hover {
  background: #f3f4f6;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
}

.icon-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.4rem 0.75rem;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 600;
  transition: all 0.15s;
}

.btn-edit {
  background: #ecfdf5;
  color: #10b981;
}

.btn-edit:hover {
  background: #d1fae5;
}

.btn-delete {
  background: #fff1f2;
  color: #f43f5e;
}

.btn-delete:hover {
  background: #ffe4e6;
}

/* Title */
.plate-title-row {
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.plate-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
}

.plate-date {
  font-size: 0.8rem;
  color: #9ca3af;
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

/* Section */
.section {
  background: white;
  border-radius: 1rem;
  padding: 1rem;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  border: 1px solid #f3f4f6;
}

.section-title {
  margin: 0 0 0.875rem;
  font-size: 0.95rem;
  font-weight: 700;
  color: #374151;
}

/* Groups grid */
.groups-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
}

@media (min-width: 480px) {
  .groups-grid {
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  }
}

.group-block {
  border: 2px solid color-mix(in srgb, var(--group-color) 30%, transparent);
  border-radius: 0.875rem;
  padding: 0.625rem;
  background: color-mix(in srgb, var(--group-color) 6%, white);
}

.group-header {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--group-color);
  margin-bottom: 0.5rem;
  padding-bottom: 0.35rem;
  border-bottom: 1px solid color-mix(in srgb, var(--group-color) 20%, transparent);
}

.items-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.item-row {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.8rem;
}

.al-dot {
  flex-shrink: 0;
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.dot-astringent {
  background: #ef4444;
}

.dot-laxative {
  background: #10b981;
}

.dot-neutral {
  background: #9ca3af;
}

.item-name {
  flex: 1;
  color: #374151;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.allergen-tag {
  flex-shrink: 0;
  font-size: 0.75rem;
}

.empty-group {
  margin: 0;
  font-size: 0.75rem;
  color: #d1d5db;
  font-style: italic;
}

/* Export area */
.export-area {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  align-items: flex-start;
}

.export-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.65rem 1.25rem;
  background: #6366f1;
  color: white;
  border: none;
  border-radius: 0.75rem;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 600;
  transition: background 0.15s;
}

.export-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.export-btn:not(:disabled):hover {
  background: #4f46e5;
}

.watermark-note {
  margin: 0;
  font-size: 0.75rem;
  color: #9ca3af;
}

.watermark-note a {
  color: #f59e0b;
  text-decoration: none;
}

.btn-spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  padding: 1rem;
}

.modal {
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  max-width: 380px;
  width: 100%;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
}

.modal-title {
  margin: 0 0 0.5rem;
  font-size: 1.1rem;
  font-weight: 700;
  color: #111827;
}

.modal-body {
  margin: 0 0 1.25rem;
  font-size: 0.875rem;
  color: #6b7280;
  line-height: 1.6;
}

.modal-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}

.modal-btn {
  padding: 0.55rem 1rem;
  border-radius: 0.625rem;
  border: none;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  transition: background 0.15s;
}

.btn-cancel {
  background: #f3f4f6;
  color: #374151;
}

.btn-cancel:hover {
  background: #e5e7eb;
}

.btn-confirm-delete {
  background: #ef4444;
  color: white;
}

.btn-confirm-delete:not(:disabled):hover {
  background: #dc2626;
}

.btn-confirm-delete:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
