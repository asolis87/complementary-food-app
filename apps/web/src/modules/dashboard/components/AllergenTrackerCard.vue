<template>
  <section
    v-if="showCard"
    class="dashboard-card allergen-tracker-card"
    role="region"
    aria-label="Alérgenos prioritarios"
  >
    <!-- Card header (always shown) -->
    <div class="card-header">
      <h2 class="card-title">Alérgenos prioritarios</h2>
    </div>

    <!-- TierGate: PRO content or upgrade prompt -->
    <TierGate required-tier="PRO" feature-name="Seguimiento de alérgenos">
      <!-- Loading state -->
      <div v-if="loading" class="loading-skeleton">
        <div class="skeleton-line skeleton-line-short" />
        <div class="skeleton-line skeleton-line-medium" />
      </div>

      <!-- Loaded content -->
      <template v-else-if="allergenData">
        <!-- Exposure reminder banner (specific allergen) -->
        <div
          v-if="showExposureReminder && firstPendingAllergen"
          class="exposure-reminder-banner"
          role="alert"
        >
          <span class="banner-icon" aria-hidden="true">⚠️</span>
          <span class="banner-text">
            Ofrece {{ firstPendingAllergen.name }} esta semana, ventana cerrándose
          </span>
        </div>

        <!-- Closing window banner (count-based) -->
        <div
          v-if="showClosingWindowBanner"
          class="closing-window-banner"
          role="alert"
        >
          <span class="banner-icon" aria-hidden="true">⚠️</span>
          <span class="banner-text">
            {{ pendingCount }} alérgenos sin introducir, ventana cerrándose
          </span>
        </div>

        <!-- Allergen list -->
        <div class="allergen-list">
          <div
            v-for="allergen in allergenData.allergens"
            :key="allergen.type"
            class="allergen-chip"
            :class="`allergen-chip--${allergen.status}`"
          >
            <div class="allergen-chip-content">
              <span class="allergen-name">{{ allergen.name }}</span>
              <span v-if="allergen.exposureCount > 0" class="exposure-count">
                {{ allergen.exposureCount }} exposiciones
              </span>
            </div>
          </div>
        </div>
      </template>
    </TierGate>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { apiClient } from '@/shared/api/client.js'
import TierGate from '@/shared/components/TierGate.vue'
import type { AllergenStatusResponse } from '@pakulab/shared'

const props = defineProps<{
  babyAgeMonths: number
  tier: 'FREE' | 'PRO'
  babyProfileId: string
}>()

const loading = ref(false)
const allergenData = ref<AllergenStatusResponse | null>(null)

const showCard = computed(() => props.babyAgeMonths >= 6)

const pendingCount = computed(() => {
  if (!allergenData.value) return 0
  return allergenData.value.allergens.filter(a => a.status !== 'introduced').length
})

const showClosingWindowBanner = computed(() => {
  if (!allergenData.value) return false
  return allergenData.value.closingWindow && pendingCount.value > 0
})

const pendingAllergens = computed(() => {
  if (!allergenData.value) return []
  return allergenData.value.allergens.filter(a => a.status === 'pending')
})

const showExposureReminder = computed(() => {
  return allergenData.value?.closingWindow && pendingAllergens.value.length > 0
})

const firstPendingAllergen = computed(() => {
  return pendingAllergens.value[0] || null
})

async function fetchAllergenStatus() {
  if (!showCard.value || props.tier !== 'PRO') return

  loading.value = true
  try {
    allergenData.value = await apiClient.get<AllergenStatusResponse>(
      `/allergens/status?babyProfileId=${props.babyProfileId}`
    )
  } catch (error) {
    console.error('Failed to fetch allergen status:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchAllergenStatus()
})
</script>

<style scoped>
.allergen-tracker-card {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.5rem;
  background: var(--card-bg);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.loading-skeleton {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.skeleton-line {
  height: 1rem;
  background: var(--skeleton-bg);
  border-radius: var(--radius-sm);
  animation: pulse 1.5s ease-in-out infinite;
}

.skeleton-line-short {
  width: 40%;
}

.skeleton-line-medium {
  width: 60%;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.exposure-reminder-banner,
.closing-window-banner {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: #fef3c7;
  border: 1px solid #fbbf24;
  border-radius: var(--radius-md);
  color: #78350f;
  font-size: 0.875rem;
}

.banner-icon {
  font-size: 1.25rem;
  line-height: 1;
}

.banner-text {
  font-weight: 500;
}

.allergen-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 0.75rem;
}

.allergen-chip {
  padding: 0.75rem 1rem;
  border-radius: var(--radius-md);
  border: 2px solid;
  transition: all 0.2s ease;
}

.allergen-chip--introduced {
  background: #dcfce7;
  border-color: #16a34a;
  color: #14532d;
}

.allergen-chip--in_window {
  background: #fef9c3;
  border-color: #eab308;
  color: #713f12;
}

.allergen-chip--pending {
  background: #fee2e2;
  border-color: #dc2626;
  color: #7f1d1d;
}

.allergen-chip-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.allergen-name {
  font-weight: 600;
  font-size: 0.875rem;
}

.exposure-count {
  font-size: 0.75rem;
  opacity: 0.8;
}
</style>
