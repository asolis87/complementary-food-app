<template>
  <div class="plate-wrap">
    <!-- Plate container: relative so overlay buttons can position absolutely -->
    <div
      class="plate-ring"
      role="img"
      :aria-label="plateAriaLabel"
    >
      <!-- SVG plate — purely visual, NO click handlers anywhere -->
      <svg
        class="plate-svg"
        viewBox="0 0 400 400"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        style="pointer-events: none"
      >
        <!-- Background circle (plate surface) -->
        <circle cx="200" cy="200" r="196" fill="#fafafa" stroke="#e5e7eb" stroke-width="2" />

        <!-- Each sector: colored path + foreignObject with food content (display only) -->
        <g v-for="(sector, i) in sectors" :key="sector.group">
          <!-- Colored pie sector — visual only -->
          <path
            :d="sector.path"
            :fill="sector.color"
            :fill-opacity="hoveredGroup === sector.group ? 0.45 : sectionHasItems(sector.group) ? 0.28 : 0.12"
            stroke="white"
            stroke-width="3"
            class="sector"
            :class="{ 'sector-filled': sectionHasItems(sector.group) }"
          />

          <!-- HTML content inside the sector — display only, no interactive elements -->
          <foreignObject
            :x="sector.fo.x"
            :y="sector.fo.y"
            :width="sector.fo.w"
            :height="sector.fo.h"
            style="pointer-events: none"
          >
            <div xmlns="http://www.w3.org/1999/xhtml" class="sector-content">
              <!-- Group label -->
              <div class="sector-label">
                <span class="sector-emoji">{{ sector.icon }}</span>
                <span>{{ sector.shortLabel }}</span>
              </div>

              <!-- Food item — read-only display (only ONE per zone) -->
              <div v-if="groupItems(sector.group).length > 0" class="sector-items">
                <div
                  v-for="item in groupItems(sector.group)"
                  :key="item.id"
                  class="food-tag"
                  :class="alClass(item)"
                >
                  <span class="al-dot" />
                  <span class="food-name">{{ item.food.name }}</span>
                  <span v-if="item.food.isAllergen" class="allergen-icon">⚠️</span>
                </div>
              </div>

              <!-- Empty state — display only hint -->
              <div v-else class="sector-empty-hint">
                + Agregar
              </div>
            </div>
          </foreignObject>
        </g>

        <!-- Center circle (decoration) -->
        <circle cx="200" cy="200" r="36" fill="white" stroke="#e5e7eb" stroke-width="1.5" />
        <text x="200" y="205" text-anchor="middle" font-size="22" dominant-baseline="middle">
          🍽️
        </text>
      </svg>

      <!-- ─────────────────────────────────────────────────────────────────── -->
      <!-- Invisible click overlay buttons — positioned on top of each sector  -->
      <!-- These are plain HTML elements: 100% reliable click detection        -->
      <!-- ─────────────────────────────────────────────────────────────────── -->
      <button
        v-for="sector in sectors"
        :key="'overlay-' + sector.group"
        class="zone-overlay"
        :class="sector.overlayClass"
        :aria-label="`Agregar alimento a ${FOOD_GROUP_LABELS[sector.group]}`"
        @click="emit('select-group', sector.group)"
        @mouseenter="hoveredGroup = sector.group"
        @mouseleave="hoveredGroup = null"
        @focus="hoveredGroup = sector.group"
        @blur="hoveredGroup = null"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { FoodGroup } from '@cfa/shared'
import { FOOD_GROUP_LABELS, BASE_GROUPS, OPTIONAL_GROUPS } from '@cfa/shared'
import type { PlateItemDraft } from '@/shared/stores/plateStore.js'

const props = defineProps<{
  items: PlateItemDraft[]
  groupCount: 4 | 5
}>()

const emit = defineEmits<{
  'remove-item': [itemId: string]
  'select-group': [group: FoodGroup]
}>()

const hoveredGroup = ref<FoodGroup | null>(null)

/** Short label for inside the sector (keeps it compact) */
const GROUP_SHORT_LABELS: Record<FoodGroup, string> = {
  FRUIT: 'Frutas',
  VEGETABLE: 'Verduras',
  PROTEIN: 'Proteínas',
  CEREAL_TUBER: 'Cereales',
  HEALTHY_FAT: 'Grasas',
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

/** SVG constants — viewBox is 400×400, center at (200,200), radius 196 */
const CX = 200
const CY = 200
const R = 196

/** ForeignObject box for each sector, calculated from its mid-angle */
interface ForeignObjectBox { x: number; y: number; w: number; h: number }

/** Build SVG pie sector path */
function buildSectorPath(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number,
): string {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const x1 = cx + r * Math.cos(toRad(startAngle))
  const y1 = cy + r * Math.sin(toRad(startAngle))
  const x2 = cx + r * Math.cos(toRad(endAngle))
  const y2 = cy + r * Math.sin(toRad(endAngle))
  const largeArc = endAngle - startAngle > 180 ? 1 : 0
  return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`
}

/**
 * Compute a foreignObject bounding box that fits inside a pie sector.
 * We position a rectangle centered at the sector's "visual centroid" —
 * a point at ~55% of the radius along the mid-angle direction.
 */
function computeForeignObject(
  midAngleDeg: number,
  angleSpanDeg: number,
): ForeignObjectBox {
  const toRad = (deg: number) => (deg * Math.PI) / 180

  // Visual centroid: distance from center along mid-angle
  // Push farther out to maximize the usable text area within each sector.
  const centroidR = R * 0.57

  const midRad = toRad(midAngleDeg)
  const centroidX = CX + centroidR * Math.cos(midRad)
  const centroidY = CY + centroidR * Math.sin(midRad)

  // Box size: chord at centroidR for the angular span, but capped generously.
  // We want the box to stay within the sector shape.
  // A safe inscribed width ≈ 2 * centroidR * sin(span/2) * 0.82 (safety margin)
  const halfSpanRad = toRad(angleSpanDeg / 2)
  const maxW = Math.min(2 * centroidR * Math.sin(halfSpanRad) * 0.82, 170)
  // Height is constrained so the box stays between center and edge
  const maxH = Math.min((R - centroidR) * 1.8, 160)

  // Final dimensions — minimum 100px wide so text always has room
  const w = Math.max(maxW, 100)
  const h = Math.max(maxH, 88)

  return {
    x: Math.round(centroidX - w / 2),
    y: Math.round(centroidY - h / 2),
    w: Math.round(w),
    h: Math.round(h),
  }
}

/**
 * Compute CSS class for the HTML overlay button based on sector position.
 *
 * For 4 sectors (quadrants): top-left, top-right, bottom-right, bottom-left
 * For 5 sectors: we use simple percentage-based clip-path approach with
 * rectangular regions that roughly cover each sector — good enough.
 *
 * Sectors start at -90° (top), go clockwise.
 * Index 0 → top, 1 → right (or top-right), 2 → bottom-right, 3 → bottom-left (or left)
 */
function computeOverlayClass(index: number, total: number): string {
  if (total === 4) {
    // 4 quadrants: each is exactly 90°, starting top-left (index 0 = top, 1 = right, 2 = bottom, 3 = left)
    // Angles: 0 = -90°→0° (top-right quadrant), 1 = 0°→90° (bottom-right), etc.
    // Starting at -90° (top), going clockwise:
    // sector 0: -90° to 0°   → top-right quadrant  → zone-top-right
    // sector 1:  0° to 90°   → bottom-right         → zone-bottom-right
    // sector 2:  90° to 180° → bottom-left          → zone-bottom-left
    // sector 3:  180° to 270° → top-left            → zone-top-left
    const map4 = ['zone-top-right', 'zone-bottom-right', 'zone-bottom-left', 'zone-top-left']
    return map4[index] ?? 'zone-generic'
  }
  // 5 sectors — use index-based named positions
  const map5 = ['zone-5-0', 'zone-5-1', 'zone-5-2', 'zone-5-3', 'zone-5-4']
  return map5[index] ?? 'zone-generic'
}

interface Sector {
  group: FoodGroup
  color: string
  icon: string
  shortLabel: string
  path: string
  fo: ForeignObjectBox
  overlayClass: string
}

const activeGroups = computed<FoodGroup[]>(() => {
  const groups: FoodGroup[] = [...BASE_GROUPS]
  if (props.groupCount === 5) groups.push(...OPTIONAL_GROUPS)
  return groups
})

const sectors = computed<Sector[]>(() => {
  const groups = activeGroups.value
  const count = groups.length
  const angleStep = 360 / count
  const startOffset = -90 // Start from top

  return groups.map((group, i) => {
    const startAngle = startOffset + i * angleStep
    const endAngle = startOffset + (i + 1) * angleStep
    const midAngle = (startAngle + endAngle) / 2

    return {
      group,
      color: GROUP_COLORS[group],
      icon: GROUP_ICONS[group],
      shortLabel: GROUP_SHORT_LABELS[group],
      path: buildSectorPath(CX, CY, R, startAngle, endAngle),
      fo: computeForeignObject(midAngle, angleStep),
      overlayClass: computeOverlayClass(i, count),
    }
  })
})

function groupItems(group: FoodGroup): PlateItemDraft[] {
  return props.items.filter((item) => item.groupAssignment === group)
}

function sectionHasItems(group: FoodGroup): boolean {
  return groupItems(group).length > 0
}

function alClass(item: PlateItemDraft): string {
  switch (item.food.alClassification) {
    case 'ASTRINGENT': return 'astringent'
    case 'LAXATIVE': return 'laxative'
    default: return 'neutral'
  }
}

const plateAriaLabel = computed(() => {
  const totalItems = props.items.length
  if (totalItems === 0) return `Plato vacío con ${props.groupCount} grupos de alimentos`
  const groupSummary = sectors.value
    .map((s) => {
      const count = groupItems(s.group).length
      return count > 0 ? `${FOOD_GROUP_LABELS[s.group]}: ${count}` : null
    })
    .filter(Boolean)
    .join(', ')
  return `Plato con ${totalItems} alimentos — ${groupSummary}`
})
</script>

<style scoped>
/* ── Wrapper ─────────────────────────────────────────────────────────────── */
.plate-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* ── Plate ring: MUST be position relative for overlay buttons ───────────── */
.plate-ring {
  width: 100%;
  max-width: 450px;
  margin: 0 auto;
  aspect-ratio: 1 / 1;
  position: relative; /* Required: overlay buttons use position: absolute */
}

.plate-svg {
  width: 100%;
  height: 100%;
  display: block;
}

.sector {
  transition: fill-opacity 0.2s ease;
}

.sector-filled {
  filter: drop-shadow(0 1px 3px rgba(0, 0, 0, 0.12));
}

/* ── Zone overlay buttons — invisible HTML divs for click detection ──────── */
/*
 * These buttons sit ON TOP of the SVG (z-index: 10) and handle ALL click events.
 * The SVG is purely visual. These are plain HTML → 100% reliable click detection
 * on all browsers and touch devices.
 */
.zone-overlay {
  position: absolute;
  background: transparent;
  border: none;
  cursor: pointer;
  z-index: 10;
  padding: 0;
  margin: 0;
  /* No visual appearance — purely a click target */
}

.zone-overlay:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: -2px;
  border-radius: inherit;
}

/* ── 4-sector quadrant overlays ──────────────────────────────────────────── */
/* Plate starts at -90° (top), sectors go clockwise:
   sector 0 (FRUIT):        -90° →  0°  = top-right quadrant
   sector 1 (VEGETABLE):     0° → 90°  = bottom-right quadrant
   sector 2 (PROTEIN):      90° → 180° = bottom-left quadrant
   sector 3 (CEREAL_TUBER): 180° → 270° = top-left quadrant
*/
.zone-top-right {
  top: 0;
  right: 0;
  width: 50%;
  height: 50%;
  border-radius: 0 100% 0 0;
}

.zone-bottom-right {
  bottom: 0;
  right: 0;
  width: 50%;
  height: 50%;
  border-radius: 0 0 100% 0;
}

.zone-bottom-left {
  bottom: 0;
  left: 0;
  width: 50%;
  height: 50%;
  border-radius: 0 0 0 100%;
}

.zone-top-left {
  top: 0;
  left: 0;
  width: 50%;
  height: 50%;
  border-radius: 100% 0 0 0;
}

/* ── 5-sector overlays ───────────────────────────────────────────────────── */
/*
 * 5 sectors of 72° each, starting at -90° (top):
 * sector 0: -90° → -18°  (top, slightly right)
 * sector 1: -18° →  54°  (right)
 * sector 2:  54° → 126°  (bottom-right)
 * sector 3: 126° → 198°  (bottom-left)
 * sector 4: 198° → 270°  (left)
 *
 * We use clip-path polygon to approximate each sector's coverage area.
 * The values are percentages relative to the 100%×100% container.
 * Center is at 50%,50%. Polygons start at center, go to the arc.
 */

/* sector 0: top center → top-right area */
.zone-5-0 {
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  clip-path: polygon(50% 50%, 50% 0%, 100% 0%, 100% 34%);
}

/* sector 1: right side */
.zone-5-1 {
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  clip-path: polygon(50% 50%, 100% 34%, 100% 100%, 79% 100%);
}

/* sector 2: bottom-right */
.zone-5-2 {
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  clip-path: polygon(50% 50%, 79% 100%, 21% 100%);
}

/* sector 3: bottom-left */
.zone-5-3 {
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  clip-path: polygon(50% 50%, 21% 100%, 0% 100%, 0% 34%);
}

/* sector 4: left side */
.zone-5-4 {
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  clip-path: polygon(50% 50%, 0% 34%, 0% 0%, 50% 0%);
}

/* ── Generic fallback ────────────────────────────────────────────────────── */
.zone-generic {
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}
</style>

<!-- Global styles for foreignObject HTML content (scoped doesn't reach xhtml namespace) -->
<style>
.sector-content {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4px;
  box-sizing: border-box;
  overflow: hidden;
  /* Fully pass-through: SVG has pointer-events: none, overlays handle clicks */
  pointer-events: none;
  font-family: system-ui, -apple-system, sans-serif;
}

.sector-label {
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #374151;
  margin-bottom: 5px;
  text-align: center;
  line-height: 1.2;
}

.sector-emoji {
  font-size: 13px;
  line-height: 1;
}

.sector-items {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 3px;
  width: 100%;
  /* Single food per zone — center the tag within the sector content */
  justify-content: center;
}

.food-tag {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 6px;
  padding: 5px 6px;
  font-size: 11px;
  width: 100%;
  box-sizing: border-box;
  min-width: 0;
  border-left: 3px solid transparent;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
}

.food-tag.astringent {
  border-left-color: #ef4444;
}

.food-tag.laxative {
  border-left-color: #10b981;
}

.food-tag.neutral {
  border-left-color: #9ca3af;
}

.al-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}

.food-tag.astringent .al-dot {
  background: #ef4444;
}

.food-tag.laxative .al-dot {
  background: #10b981;
}

.food-tag.neutral .al-dot {
  background: #9ca3af;
}

.food-name {
  width: 100%;
  min-width: 0;
  white-space: normal;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-align: center;
  color: #111827;
  font-weight: 500;
  font-size: 10px;
  line-height: 1.3;
}

.allergen-icon {
  font-size: 10px;
  flex-shrink: 0;
  line-height: 1;
}

.sector-empty-hint {
  font-size: 10px;
  color: rgba(0, 0, 0, 0.38);
  pointer-events: none;
}
</style>
