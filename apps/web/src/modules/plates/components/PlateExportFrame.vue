<template>
  <div ref="exportRef" class="export-frame" aria-hidden="true">
    <div class="export-bg-gradient"></div>

    <div class="export-content">
      <!-- Header -->
      <div class="export-header">
        <div class="brand">
          <span class="brand-logo">Pakulab</span>
          <span v-if="isPro" class="brand-badge">PRO</span>
        </div>
        <div class="title-area">
          <h1 class="plate-title">{{ plateName || 'Mi Plato' }}</h1>
          <p v-if="babyName" class="baby-name">Preparado para {{ babyName }}</p>
        </div>
      </div>

      <!-- Main Layout: Plate on top, Details below -->
      <div class="export-body">
        
        <!-- Main Plate Visualization (ILLUSTRATIVE ONLY) -->
        <div class="plate-illustrative-container">
          <PlateVisualization
            :items="items"
            :group-count="groupCount"
            :times-offered-by-food-id="timesOfferedByFoodId"
          />
        </div>

        <!-- Details List (Flat List) -->
        <div class="export-details" v-if="flatItems.length > 0">
          <ul class="detail-food-list">
            <li v-for="item in flatItems" :key="item.food.id" class="detail-food-item">
              <!-- Circle with icon and A/L colored border -->
              <div class="food-icon-circle" :class="`al-border--${item.food.alClassification?.toLowerCase() || 'neutral'}`">
                <span class="material-symbols-outlined" :class="item.groupColorClass">{{ item.groupIcon }}</span>
              </div>
              
              <span class="food-name">{{ item.food.name }}</span>
              
              <span v-if="item.food.isAllergen" class="allergen-badge">
                <span class="material-symbols-outlined">warning</span> Alérgeno
              </span>
              <span v-if="timesOfferedByFoodId && timesOfferedByFoodId[item.food.id] !== undefined && timesOfferedByFoodId[item.food.id] < 3" class="exposure-badge">
                NUEVO
              </span>
            </li>
          </ul>
        </div>

      </div>

      <!-- Footer / Info -->
      <div class="export-footer">
        <div class="balance-info">
          <span v-if="balanceLabel" class="balance-tag">{{ balanceLabel }}</span>
        </div>
        
        <div class="disclaimer-area">
          <p v-if="!isPro" class="watermark">Creado con pakulab.app</p>
          <p class="disclaimer">Información orientativa. Consulta con tu pediatra.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import PlateVisualization from './PlateVisualization.vue'
import { fixHtml2CanvasColors } from '@/shared/utils/exportUtils.js'

const props = defineProps<{
  plateName: string
  items: any[]
  groupCount: 4 | 5
  timesOfferedByFoodId?: Record<string, number | null>
  babyName?: string
  isPro?: boolean
  balanceLabel?: string
}>()

const emit = defineEmits<{
  done: [dataUrl: string]
  error: [message: string]
}>()

const exportRef = ref<HTMLElement | null>(null)

const GROUP_CONFIG: Record<string, { label: string; icon: string; colorClass: string }> = {
  FRUIT: { label: 'Frutas', icon: 'nutrition', colorClass: 'text-primary' },
  VEGETABLE: { label: 'Verduras', icon: 'eco', colorClass: 'text-tertiary' },
  CEREAL_TUBER: { label: 'Cereales', icon: 'bakery_dining', colorClass: 'text-secondary' },
  PROTEIN: { label: 'Proteínas', icon: 'water_drop', colorClass: 'text-neutral' },
  FAT: { label: 'Grasas', icon: 'opacity', colorClass: 'text-fat' },
}

const flatItems = computed(() => {
  if (!props.items) return []
  
  // Create a flat array enriched with group icons and colors
  const items = props.items.map(item => {
    const key = item.groupAssignment
    const config = GROUP_CONFIG[key] || { label: key, icon: 'restaurant', colorClass: 'text-neutral' }
    return {
      ...item,
      groupIcon: config.icon,
      groupColorClass: config.colorClass
    }
  })

  // Sort them so they are logically ordered by group
  const order = ['FRUIT', 'VEGETABLE', 'CEREAL_TUBER', 'PROTEIN', 'FAT']
  return items.sort((a, b) => {
    return order.indexOf(a.groupAssignment) - order.indexOf(b.groupAssignment)
  })
})

async function capture(): Promise<void> {
  if (!exportRef.value) {
    emit('error', 'Elemento no encontrado para exportar')
    return
  }

  try {
    const el = exportRef.value
    const restoreColors = fixHtml2CanvasColors(el)

    const { default: html2canvas } = await import('html2canvas')
    const canvas = await html2canvas(el, {
      scale: 2,
      useCORS: true,
      backgroundColor: null,
      logging: false,
    })

    restoreColors()

    const dataUrl = canvas.toDataURL('image/png')
    emit('done', dataUrl)
  } catch (err) {
    emit('error', err instanceof Error ? err.message : 'Error al capturar imagen')
  }
}

defineExpose({ capture })
</script>

<style scoped>
/* Hidden absolute off-screen. Expanded to 1920x1080 for Landscape HD */
.export-frame {
  position: fixed;
  top: -9999px;
  left: -9999px;
  width: 1920px;
  height: 1080px;
  overflow: hidden;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
  display: flex;
  align-items: center;
  justify-content: center;
}

.export-bg-gradient {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, #fdfbfb 0%, #f3f5f8 100%);
  z-index: 0;
}

.export-bg-gradient::before {
  content: '';
  position: absolute;
  top: -200px;
  left: -200px;
  width: 1000px;
  height: 1000px;
  background: radial-gradient(circle, rgba(126, 239, 192, 0.15) 0%, transparent 70%);
  border-radius: 50%;
}

.export-bg-gradient::after {
  content: '';
  position: absolute;
  bottom: -200px;
  right: -200px;
  width: 1200px;
  height: 1200px;
  background: radial-gradient(circle, rgba(254, 178, 137, 0.15) 0%, transparent 70%);
  border-radius: 50%;
}

.export-content {
  position: relative;
  z-index: 1;
  width: 1800px;
  height: 960px;
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(20px);
  border: 2px solid rgba(255, 255, 255, 0.9);
  border-radius: 40px;
  padding: 50px 70px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 40px rgba(0,0,0,0.05);
}

.export-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  flex-shrink: 0;
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.brand-logo {
  font-size: 36px;
  font-weight: 800;
  color: #00694b;
  letter-spacing: -0.02em;
}

.brand-badge {
  font-size: 16px;
  font-weight: 800;
  color: #fff;
  background: #1a1c18;
  padding: 6px 14px;
  border-radius: 8px;
  letter-spacing: 0.1em;
}

.title-area {
  text-align: right;
}

.plate-title {
  font-size: 54px;
  font-weight: 800;
  color: #1a1c18;
  margin: 0 0 8px 0;
  line-height: 1.1;
  letter-spacing: -0.02em;
}

.baby-name {
  font-size: 28px;
  font-weight: 600;
  color: #43483e;
  margin: 0;
}

/* Body: Plate on Left, Details on Right */
.export-body {
  flex: 1;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 80px;
  min-height: 0;
}

/* Illustrative Plate styles */
.plate-illustrative-container {
  flex: 0 0 auto;
  display: flex;
  justify-content: center;
  align-items: center;
}

:deep(.plate-outer) {
  width: 600px !important;
  height: 600px !important;
  padding: 2.5rem !important;
}

:deep(.plate-outer--five) {
  border-radius: 4rem !important;
  height: 720px !important;
}

:deep(.plate-ring) {
  border-width: 18px !important;
  gap: 0.6rem !important;
  padding: 0.6rem !important;
}

:deep(.segment-icon) {
  font-size: 3.5rem !important;
  margin-bottom: 0.5rem !important;
}

:deep(.segment-label) {
  font-size: 1.6rem !important;
  font-weight: 800 !important;
  letter-spacing: 0.05em !important;
  color: #1a1c18 !important;
}

:deep(.plate-center) {
  width: 6rem !important;
  height: 6rem !important;
  border-width: 10px !important;
}

:deep(.plate-center-icon) {
  font-size: 3rem !important;
}

/* THIS IS THE MAGIC: Hide the food chips inside the plate! */
:deep(.segment-food-name),
:deep(.segment-empty) {
  display: none !important;
}


/* Details Section - Flat List Layout */
.export-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding-right: 40px;
}

.detail-food-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.detail-food-item {
  display: flex;
  align-items: center;
  gap: 24px;
  font-size: 36px;
  color: #1a1c18;
  font-weight: 600;
}

.food-icon-circle {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border: 6px solid transparent;
  box-shadow: 0 8px 16px rgba(0,0,0,0.05);
  flex-shrink: 0;
}

.food-icon-circle .material-symbols-outlined {
  font-size: 40px;
}

/* AL Border colors */
.al-border--astringent { border-color: #ef4444; }
.al-border--laxative { border-color: #22c55e; }
.al-border--neutral { border-color: #9ca3af; }

.allergen-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #fef2f2;
  color: #ef4444;
  font-size: 20px;
  font-weight: 800;
  padding: 6px 14px;
  border-radius: 10px;
  text-transform: uppercase;
  margin-left: 10px;
}

.allergen-badge .material-symbols-outlined {
  font-size: 22px;
}

.exposure-badge {
  background: #f59e0b;
  color: white;
  font-size: 20px;
  font-weight: 800;
  padding: 6px 14px;
  border-radius: 10px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-left: 10px;
}

/* Colors for group icons */
.text-primary { color: #00694b; }
.text-secondary { color: #695e00; }
.text-tertiary { color: #3b6470; }
.text-neutral { color: #43483e; }
.text-fat { color: #eab308; }


/* Footer */
.export-footer {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  flex-shrink: 0;
}

.balance-tag {
  display: inline-block;
  background: #c2efdc;
  color: #002114;
  padding: 16px 32px;
  border-radius: 100px;
  font-size: 26px;
  font-weight: 800;
  letter-spacing: -0.01em;
}

.disclaimer-area {
  text-align: right;
}

.watermark {
  font-size: 24px;
  font-weight: 800;
  color: #00694b;
  margin: 0 0 10px 0;
}

.disclaimer {
  font-size: 18px;
  color: #73796e;
  margin: 0;
  font-style: italic;
}
</style>
