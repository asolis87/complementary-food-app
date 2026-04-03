<template>
  <!-- Hidden export canvas target (rendered off-screen) -->
  <div ref="exportRef" class="export-frame" aria-hidden="true">
    <div class="export-header">
      <span class="export-logo">Pakulab</span>
      <span class="export-title">{{ plateName }}</span>
      <span class="export-date">{{ formattedDate }}</span>
    </div>

    <!-- Plate visualization snapshot -->
    <slot name="visualization" />

    <!-- Balance summary -->
    <div v-if="balance" class="export-balance">
      <span class="export-balance-label" :class="balanceClass">{{ balance.labelEs }}</span>
      <span class="export-counts">
        A {{ balance.astringent }} ast. &nbsp;
        N {{ balance.neutral }} neut. &nbsp;
        L {{ balance.laxative }} lax.
      </span>
    </div>

    <!-- Disclaimer -->
    <p class="export-disclaimer">
      Información orientativa. Consultá siempre con tu pediatra.
    </p>

    <!-- Watermark (free / anonymous) -->
    <div v-if="showWatermark" class="watermark" aria-hidden="true">Pakulab</div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { BalanceResult } from '@pakulab/shared'

const props = defineProps<{
  plateName: string
  balance: BalanceResult | null
  showWatermark: boolean
}>()

const emit = defineEmits<{
  done: [dataUrl: string]
  error: [message: string]
}>()

const exportRef = ref<HTMLElement | null>(null)

const formattedDate = computed(() => {
  return new Date().toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
})

const balanceClass = computed(() => {
  if (!props.balance) return ''
  switch (props.balance.label) {
    case 'balanced':
      return 'text-green'
    case 'astringent':
      return 'text-red'
    case 'laxative':
      return 'text-orange'
    default:
      return ''
  }
})

/** Called externally to trigger the export */
async function capture(): Promise<void> {
  if (!exportRef.value) {
    emit('error', 'Elemento de exportación no disponible')
    return
  }
  try {
    // Dynamic import to avoid increasing initial bundle
    const { default: html2canvas } = await import('html2canvas')
    const canvas = await html2canvas(exportRef.value, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    })
    const dataUrl = canvas.toDataURL('image/png')
    emit('done', dataUrl)
  } catch (err) {
    emit('error', err instanceof Error ? err.message : 'Error al exportar')
  }
}

defineExpose({ capture })
</script>

<style scoped>
/* The export-frame is positioned off-screen so it doesn't affect layout */
.export-frame {
  position: fixed;
  top: -9999px;
  left: -9999px;
  width: 400px;
  background: var(--md3-surface-container-lowest);
  padding: var(--md3-space-6);
  border-radius: var(--md3-rounded-md);
  font-family: var(--md3-font-body);
}

.export-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: var(--md3-space-3);
  padding-bottom: 0.75rem;
  border-bottom: 2px solid var(--md3-outline-variant);
}

.export-logo {
  font-family: var(--md3-font-headline);
  font-size: var(--md3-body-lg);
  font-weight: var(--md3-weight-bold);
  color: var(--md3-primary);
}

.export-title {
  flex: 1;
  font-weight: var(--md3-weight-semibold);
  font-size: var(--md3-body-lg);
  color: var(--md3-on-surface);
}

.export-date {
  font-size: var(--md3-body-sm);
  color: var(--md3-on-surface-variant);
}

.export-balance {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: var(--md3-space-3);
  padding: 0.75rem;
  background: var(--md3-surface-container-low);
  border-radius: var(--md3-rounded-sm);
}

.export-balance-label {
  font-weight: var(--md3-weight-bold);
  font-size: var(--md3-body-lg);
}

.text-green {
  color: var(--md3-primary);
}

.text-red {
  color: var(--md3-error);
}

.text-orange {
  color: var(--md3-tertiary);
}

.export-counts {
  font-size: var(--md3-body-sm);
  color: var(--md3-on-surface-variant);
}

.export-disclaimer {
  margin: 0.75rem 0 0;
  font-size: var(--md3-label-sm);
  color: var(--md3-on-surface-variant);
  text-align: center;
}

/* Watermark */
.watermark {
  position: absolute;
  bottom: 1rem;
  right: 1rem;
  font-size: 3rem;
  font-weight: 900;
  color: var(--md3-surface-dim);
  letter-spacing: 0.1em;
  pointer-events: none;
  user-select: none;
  transform: rotate(-15deg);
}
</style>
