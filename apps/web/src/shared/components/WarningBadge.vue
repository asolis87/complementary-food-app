<script setup lang="ts">
/**
 * WarningBadge.vue — Reusable warning badge component (T-04-11).
 * Shows ⚠️ red icon + tooltip with warning tag descriptions.
 * Copy: es-MX tuteo.
 */

import { computed } from 'vue'
import type { WarningTag } from '@pakulab/shared'
import { WARNING_TAG_LABELS, WARNING_DISCLAIMER } from '@pakulab/shared'

interface Props {
  tags?: readonly WarningTag[]
}

const props = withDefaults(defineProps<Props>(), {
  tags: () => [],
})

const showBadge = computed(() => props.tags.length > 0)

const tooltipText = computed(() => {
  if (props.tags.length === 0) return ''

  const descriptions = props.tags.map((tag) => WARNING_TAG_LABELS[tag])
  return [...descriptions, WARNING_DISCLAIMER].join('\n\n')
})
</script>

<template>
  <span
    v-if="showBadge"
    class="warning-badge"
    :title="tooltipText"
  >
    ⚠️
  </span>
</template>

<style scoped>
.warning-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  color: #dc2626;
  cursor: help;
  margin-left: 0.25rem;
}
</style>
