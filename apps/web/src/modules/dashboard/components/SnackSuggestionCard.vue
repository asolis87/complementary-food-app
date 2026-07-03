<template>
  <section
    v-if="showCard && snackData?.available"
    class="dashboard-card snack-suggestion-card"
    role="region"
    aria-label="Ideas para la colación"
  >
    <!-- Card header -->
    <div class="card-header">
      <h2 class="card-title">Ideas para la colación</h2>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="loading-skeleton">
      <div v-for="n in 3" :key="n" class="skeleton-item">
        <div class="skeleton-icon" />
        <div class="skeleton-content">
          <div class="skeleton-line skeleton-line-short" />
          <div class="skeleton-line skeleton-line-medium" />
        </div>
      </div>
    </div>

    <!-- Suggestion list -->
    <div v-else-if="snackData?.suggestions" class="suggestion-list">
      <button
        v-for="food in snackData.suggestions"
        :key="food.foodId"
        class="suggestion-item"
        :aria-label="`${food.name} — ${food.benefit}`"
        @click="$emit('viewFood', food.foodId)"
      >
        <!-- Food icon wrapper -->
        <div class="suggestion-icon-wrapper">
          <span class="food-emoji" aria-hidden="true">
            {{ getFoodEmoji(food.group) }}
          </span>
        </div>

        <!-- Food content -->
        <div class="suggestion-content">
          <h3 class="suggestion-name">{{ food.name }}</h3>
          <p class="suggestion-benefit">{{ food.benefit }}</p>
          <div class="suggestion-footer">
            <span class="age-tag">{{ food.ageMonths }}+ meses</span>
            <span class="group-tag">{{ getGroupLabel(food.group) }}</span>
          </div>
        </div>
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { apiClient } from '@/shared/api/client.js'
import type { SnackSuggestionResponse, FoodGroup } from '@pakulab/shared'

const props = defineProps<{
  babyAgeMonths: number
  babyProfileId: string
}>()

defineEmits<{
  viewFood: [foodId: string]
}>()

const loading = ref(false)
const snackData = ref<SnackSuggestionResponse | null>(null)

// Card visibility: only show if baby has snack slots (10+ months per getMealSlotsForAge)
const showCard = computed(() => props.babyAgeMonths >= 10)

async function fetchSnackSuggestions() {
  if (!showCard.value) return

  loading.value = true
  try {
    snackData.value = await apiClient.get<SnackSuggestionResponse>(
      `/dashboard/snack-suggestions?babyProfileId=${props.babyProfileId}`
    )
  } catch (error) {
    console.error('Failed to fetch snack suggestions:', error)
    snackData.value = { available: false, reason: 'SNACKS_NOT_YET' }
  } finally {
    loading.value = false
  }
}

function getFoodEmoji(group: FoodGroup): string {
  const emojiMap: Record<FoodGroup, string> = {
    FRUIT: '🍎',
    VEGETABLE: '🥕',
    CEREAL_TUBER: '🌾',
    PROTEIN: '🥛',
    HEALTHY_FAT: '🥑',
  }
  return emojiMap[group] || '🍽️'
}

function getGroupLabel(group: FoodGroup): string {
  const labelMap: Record<FoodGroup, string> = {
    FRUIT: 'Fruta',
    VEGETABLE: 'Verdura',
    CEREAL_TUBER: 'Cereal',
    PROTEIN: 'Proteína',
    HEALTHY_FAT: 'Grasa saludable',
  }
  return labelMap[group] || group
}

onMounted(() => {
  fetchSnackSuggestions()
})
</script>

<style scoped>
.snack-suggestion-card {
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
  gap: 0.75rem;
}

.skeleton-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  background: var(--surface-container-low);
  border-radius: var(--radius-md);
}

.skeleton-icon {
  width: 48px;
  height: 48px;
  background: var(--skeleton-bg);
  border-radius: var(--radius-md);
  animation: pulse 1.5s ease-in-out infinite;
}

.skeleton-content {
  flex: 1;
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

.suggestion-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.suggestion-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1rem;
  background: var(--surface-container-low);
  border: 1px solid var(--outline-variant);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
}

.suggestion-item:hover {
  background: var(--surface-container);
  border-color: var(--primary);
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

.suggestion-item:active {
  transform: translateY(0);
}

.suggestion-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background: var(--surface-container);
  border-radius: var(--radius-md);
}

.food-emoji {
  font-size: 1.75rem;
  line-height: 1;
}

.suggestion-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.suggestion-name {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.suggestion-benefit {
  font-size: 0.8125rem;
  color: var(--text-secondary);
  margin: 0;
}

.suggestion-footer {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.25rem;
}

.age-tag,
.group-tag {
  font-size: 0.75rem;
  padding: 0.125rem 0.5rem;
  border-radius: var(--radius-full);
  background: var(--surface-container);
  color: var(--text-secondary);
  font-weight: 500;
}

.age-tag {
  background: #e0f2fe;
  color: #075985;
}

.group-tag {
  background: #f0fdf4;
  color: #15803d;
}
</style>
