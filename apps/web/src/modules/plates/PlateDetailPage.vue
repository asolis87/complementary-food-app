<template>
  <div class="plate-detail-page">
    <!-- Loading -->
    <div v-if="loading" class="state-center" aria-live="polite">
      <div class="spinner" aria-hidden="true" />
      <p>Cargando plato...</p>
    </div>

    <!-- Error / Not found -->
    <div v-else-if="!plate" class="state-center error-state" role="alert">
      <span class="material-symbols-outlined" aria-hidden="true">warning</span>
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
            <span class="material-symbols-outlined" aria-hidden="true">edit</span>
            Editar
          </button>
          <button
            class="icon-btn btn-delete"
            title="Eliminar plato"
            aria-label="Eliminar plato"
            @click="handleDelete"
          >
            <span class="material-symbols-outlined" aria-hidden="true">delete</span>
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
        <span class="material-symbols-outlined disclaimer-icon" aria-hidden="true">health_and_safety</span>
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
              <span class="material-symbols-outlined group-header-icon" aria-hidden="true">{{ groupIcon(group) }}</span>
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
                <span v-if="item.food?.isAllergen" class="material-symbols-outlined allergen-tag" title="Alérgeno" aria-label="Alérgeno">warning</span>
              </li>
            </ul>

            <p v-else class="empty-group">Sin alimentos en este grupo</p>
          </div>
        </div>
      </section>

      <!-- Log meal button -->
      <div class="log-area">
        <button
          class="log-btn"
          :disabled="!profileStore.activeProfile"
          :title="!profileStore.activeProfile ? 'Crea un perfil de bebé primero' : 'Registrar este plato en la bitácora'"
          :aria-label="!profileStore.activeProfile ? 'Crea un perfil de bebé primero' : 'Dar este plato'"
          @click="showQuickLog = true"
        >
          <span class="material-symbols-outlined" aria-hidden="true">restaurant</span>
          Dar este plato
        </button>
        <p v-if="!profileStore.activeProfile" class="log-hint">
          <RouterLink to="/profile">Crea un perfil de bebé</RouterLink> para registrar comidas.
        </p>
      </div>

      <!-- Export button -->
      <div class="export-area">
        <button class="export-btn" :disabled="exporting" @click="handleExport">
          <span v-if="exporting" class="btn-spinner" aria-hidden="true" />
          <span v-else class="material-symbols-outlined" aria-hidden="true">photo_camera</span>
          {{ exporting ? 'Exportando...' : 'Exportar como imagen' }}
        </button>
        <p v-if="!authStore.isPro" class="watermark-note">
          Las imágenes tendrán marca de agua Pakulab. <RouterLink to="/pricing">Actualizá a Pro</RouterLink> para exportar sin marca.
        </p>
      </div>
    </template>

    <!-- Quick Log Modal -->
    <QuickLogModal
      v-if="plate"
      v-model="showQuickLog"
      :plate="plate"
      :baby-profile-id="profileStore.activeProfile?.id ?? ''"
      @logged="onMealLogged"
    />

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
import type { Plate, FoodGroup, ALClassification, BalanceResult } from '@pakulab/shared'
import { FOOD_GROUP_LABELS, BASE_GROUPS, OPTIONAL_GROUPS, BALANCE_THRESHOLD, IMBALANCE_THRESHOLD } from '@pakulab/shared'
import { usePlateStore } from '@/shared/stores/plateStore.js'
import { useAuthStore } from '@/shared/stores/authStore.js'
import { useProfileStore } from '@/shared/stores/profileStore.js'
import { useUiStore } from '@/shared/stores/uiStore.js'
import BalanceIndicator from './components/BalanceIndicator.vue'
import QuickLogModal from '@/modules/diary/components/QuickLogModal.vue'

const route = useRoute()
const router = useRouter()
const plateStore = usePlateStore()
const authStore = useAuthStore()
const profileStore = useProfileStore()
const uiStore = useUiStore()

const plate = ref<Plate | null>(null)
const loading = ref(true)
const exporting = ref(false)
const deleting = ref(false)
const showDeleteModal = ref(false)
const showQuickLog = ref(false)

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

// Colors match MD3 food group tokens: --md3-group-{fruit,vegetable,protein,cereal,fat}
const GROUP_COLORS: Record<FoodGroup, string> = {
  FRUIT: '#ffc5a7',       // --md3-group-fruit
  VEGETABLE: '#7eefc0',   // --md3-group-vegetable
  PROTEIN: '#feb289',     // --md3-group-protein
  CEREAL_TUBER: '#8cfece', // --md3-group-cereal
  HEALTHY_FAT: '#d3bcfd', // --md3-group-fat
}

// Material Symbols Outlined icon names for each food group
const GROUP_ICONS: Record<FoodGroup, string> = {
  FRUIT: 'nutrition',
  VEGETABLE: 'eco',
  PROTEIN: 'egg',
  CEREAL_TUBER: 'bakery_dining',
  HEALTHY_FAT: 'water_drop',
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

function onMealLogged(): void {
  showQuickLog.value = false
  // Toast is already shown by QuickLogModal — no duplicate needed
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
    link.download = `${plate.value?.name ?? 'plato'}-pakulab.png`
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
  gap: var(--md3-space-3);
}

/* States */
.state-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 3rem 0;
  font-family: var(--md3-font-body);
  color: var(--md3-on-surface-variant);
}

.error-state {
  color: var(--md3-error);
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--md3-outline-variant);
  border-top-color: var(--md3-primary);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.back-link {
  color: var(--md3-primary);
  text-decoration: none;
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-md);
}

/* Header */
.detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--md3-space-2);
}

.back-btn {
  color: var(--md3-on-surface-variant);
  text-decoration: none;
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-md);
  padding: 0.25rem var(--md3-space-2);
  border-radius: var(--md3-rounded-sm);
  transition: background var(--md3-transition-fast);
}

.back-btn:hover {
  background: var(--md3-surface-container);
}

.header-actions {
  display: flex;
  gap: var(--md3-space-2);
}

.icon-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.4rem 0.75rem;
  border: none;
  border-radius: var(--md3-rounded-sm);
  cursor: pointer;
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-lg);
  font-weight: var(--md3-weight-semibold);
  transition: all var(--md3-transition-fast);
}

.icon-btn .material-symbols-outlined {
  font-size: 1.1rem;
  line-height: 1;
}

.btn-edit {
  background: var(--md3-primary-container);
  color: var(--md3-on-primary-container);
}

.btn-edit:hover {
  background: var(--md3-primary);
  color: var(--md3-on-primary);
}

.btn-delete {
  background: var(--md3-surface-container);
  color: var(--md3-error);
}

.btn-delete:hover {
  background: var(--md3-error-container);
  color: var(--md3-on-error-container);
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
  font-family: var(--md3-font-headline);
  font-size: var(--md3-headline-sm);
  font-weight: var(--md3-weight-bold);
  color: var(--md3-on-surface);
}

.plate-date {
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-sm);
  color: var(--md3-on-surface-variant);
}

/* Disclaimer */
.disclaimer-banner {
  display: flex;
  gap: var(--md3-space-2);
  align-items: center;
  background: var(--md3-primary-container);
  border-radius: var(--md3-rounded-sm);
  padding: 0.6rem var(--md3-space-3);
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-sm);
  color: var(--md3-on-primary-container);
}

.disclaimer-icon {
  font-size: 1.1rem;
  color: var(--md3-primary);
  flex-shrink: 0;
}

/* Section card */
.section {
  background: var(--md3-surface-container-lowest);
  border-radius: var(--md3-rounded-md);
  padding: var(--md3-space-3);
  box-shadow: var(--md3-shadow-soft);
  border: 1px solid var(--md3-surface-container);
}

.section-title {
  margin: 0 0 0.875rem;
  font-family: var(--md3-font-headline);
  font-size: var(--md3-body-lg);
  font-weight: var(--md3-weight-bold);
  color: var(--md3-on-surface);
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
  border-radius: var(--md3-rounded-sm);
  padding: 0.625rem;
  background: color-mix(in srgb, var(--group-color) 8%, var(--md3-surface-container-lowest));
}

.group-header {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-md);
  font-weight: var(--md3-weight-bold);
  text-transform: uppercase;
  letter-spacing: var(--md3-label-tracking);
  color: color-mix(in srgb, var(--group-color) 80%, var(--md3-on-surface));
  margin-bottom: 0.5rem;
  padding-bottom: 0.35rem;
  border-bottom: 1px solid color-mix(in srgb, var(--group-color) 25%, transparent);
}

.group-header-icon {
  font-size: 1rem;
  flex-shrink: 0;
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
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-sm);
}

.al-dot {
  flex-shrink: 0;
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.dot-astringent {
  background: var(--md3-error);
}

.dot-laxative {
  background: var(--md3-primary);
}

.dot-neutral {
  background: var(--md3-outline-variant);
}

.item-name {
  flex: 1;
  color: var(--md3-on-surface);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.allergen-tag {
  flex-shrink: 0;
  font-size: 0.875rem;
  color: var(--md3-error);
}

.empty-group {
  margin: 0;
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-sm);
  color: var(--md3-outline-variant);
  font-style: italic;
}

/* Log meal area */
.log-area {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  align-items: flex-start;
}

.log-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.75rem var(--md3-space-5);
  background: var(--md3-primary);
  color: var(--md3-on-primary);
  border: none;
  border-radius: var(--md3-rounded-full);
  cursor: pointer;
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-lg);
  font-weight: var(--md3-weight-semibold);
  transition: background var(--md3-transition-fast), opacity var(--md3-transition-fast);
  box-shadow: var(--md3-shadow-card);
}

.log-btn .material-symbols-outlined {
  font-size: 1.2rem;
  line-height: 1;
}

.log-btn:not(:disabled):hover {
  opacity: 0.88;
}

.log-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.log-hint {
  margin: 0;
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-sm);
  color: var(--md3-on-surface-variant);
}

.log-hint a {
  color: var(--md3-primary);
  text-decoration: none;
}

@media (max-width: 768px) {
  .log-btn {
    width: 100%;
    justify-content: center;
  }
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
  padding: 0.65rem var(--md3-space-4);
  background: var(--md3-secondary);
  color: var(--md3-on-secondary);
  border: none;
  border-radius: var(--md3-rounded-full);
  cursor: pointer;
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-lg);
  font-weight: var(--md3-weight-semibold);
  transition: background var(--md3-transition-fast);
  box-shadow: var(--md3-shadow-card);
}

.export-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.export-btn:not(:disabled):hover {
  background: var(--md3-secondary-dim);
}

.watermark-note {
  margin: 0;
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-sm);
  color: var(--md3-on-surface-variant);
}

.watermark-note a {
  color: var(--md3-tertiary);
  text-decoration: none;
}

.btn-spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: var(--md3-on-secondary);
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(11, 15, 15, 0.6); /* --md3-inverse-surface at 60% */
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  padding: var(--md3-space-3);
}

.modal {
  background: var(--md3-surface-container-lowest);
  border-radius: var(--md3-rounded-md);
  padding: var(--md3-space-6);
  max-width: 380px;
  width: 100%;
  box-shadow: var(--md3-shadow-ambient);
}

.modal-title {
  margin: 0 0 0.5rem;
  font-family: var(--md3-font-headline);
  font-size: var(--md3-headline-sm);
  font-weight: var(--md3-weight-bold);
  color: var(--md3-on-surface);
}

.modal-body {
  margin: 0 0 1.25rem;
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-md);
  color: var(--md3-on-surface-variant);
  line-height: var(--md3-body-line-height);
}

.modal-actions {
  display: flex;
  gap: var(--md3-space-2);
  justify-content: flex-end;
}

.modal-btn {
  padding: 0.55rem var(--md3-space-3);
  border-radius: var(--md3-rounded-full);
  border: none;
  cursor: pointer;
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-lg);
  font-weight: var(--md3-weight-semibold);
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  transition: background var(--md3-transition-fast);
}

.btn-cancel {
  background: var(--md3-surface-container);
  color: var(--md3-on-surface);
}

.btn-cancel:hover {
  background: var(--md3-surface-container-high);
}

.btn-confirm-delete {
  background: var(--md3-error);
  color: var(--md3-on-error);
}

.btn-confirm-delete:not(:disabled):hover {
  opacity: 0.88;
}

.btn-confirm-delete:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
