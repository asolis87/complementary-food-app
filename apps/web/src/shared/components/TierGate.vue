<template>
  <!-- Render slot if user meets the tier requirement -->
  <slot v-if="hasAccess" />
  <!-- Otherwise show the upgrade prompt -->
  <UpgradePrompt v-else :feature-name="featureName" :required-tier="requiredTier" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { UserTier } from '@pakulab/shared'
import { tierAtLeast } from '@pakulab/shared'
import { useAuthStore } from '@/shared/stores/authStore.js'
import UpgradePrompt from './UpgradePrompt.vue'

const props = defineProps<{
  /** The minimum tier required to access the slot content */
  requiredTier: UserTier
  /** Human-readable feature name shown in the upgrade prompt */
  featureName: string
}>()

const authStore = useAuthStore()

const hasAccess = computed(() =>
  tierAtLeast(authStore.tier, props.requiredTier),
)
</script>
