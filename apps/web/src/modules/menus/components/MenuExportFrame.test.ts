/**
 * MenuExportFrame tests — Phase 3: Export functionality
 *
 * Tests for:
 * - Rendering with complete data (header, grid, footer)
 * - Empty plate slots showing "Sin plato"
 * - Empty snack slots showing "Sin colación"
 * - Snack slots rendering name + foods without A/L dots
 * - A/L dots with correct colors on plate slots
 * - Edge cases (partial data, all empty)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import MenuExportFrame from './MenuExportFrame.vue'

// Mock html2canvas
vi.mock('html2canvas', () => ({
  default: vi.fn(() =>
    Promise.resolve({
      toDataURL: () => 'data:image/png;base64,mocked',
    })
  ),
}))

describe('MenuExportFrame', () => {
  const createSampleData = () => ({
    weekStart: '2024-01-15',
    weekEnd: '2024-01-21',
    weekLabel: '15 – 21 ene',
    babyName: 'Martina',
    days: [
      {
        label: 'Lunes',
        date: '15 ene',
        meals: [
          { type: 'Desayuno', kind: 'plate' as const, plateName: 'Pancakes de banana', foods: [
            { name: 'Banana', alClassification: 'LAXATIVE' as const },
            { name: 'Avena', alClassification: 'NEUTRAL' as const },
          ]},
          { type: 'Comida', kind: 'plate' as const, plateName: 'Pollo con verduras', foods: [
            { name: 'Pollo', alClassification: 'ASTRINGENT' as const },
            { name: 'Zanahoria', alClassification: 'NEUTRAL' as const },
            { name: 'Arroz', alClassification: 'NEUTRAL' as const },
          ]},
          { type: 'Cena', kind: 'plate' as const, plateName: 'Sopa de calabaza', foods: [
            { name: 'Calabaza', alClassification: 'LAXATIVE' as const },
          ]},
        ],
      },
      {
        label: 'Martes',
        date: '16 ene',
        meals: [
          { type: 'Desayuno', kind: 'plate' as const, plateName: 'Yogur con frutas', foods: [
            { name: 'Yogur', alClassification: 'NEUTRAL' as const },
            { name: 'Frutilla', alClassification: 'NEUTRAL' as const },
          ]},
          { type: 'Comida', kind: 'plate' as const, plateName: null, foods: [] },
          { type: 'Cena', kind: 'plate' as const, plateName: 'Puré de papas', foods: [
            { name: 'Papa', alClassification: 'ASTRINGENT' as const },
          ]},
        ],
      },
      {
        label: 'Miércoles',
        date: '17 ene',
        meals: [
          { type: 'Desayuno', kind: 'plate' as const, plateName: 'Tostadas con queso', foods: [] },
          { type: 'Comida', kind: 'plate' as const, plateName: 'Milanesa con puré', foods: [
            { name: 'Carne', alClassification: 'ASTRINGENT' as const },
            { name: 'Papa', alClassification: 'ASTRINGENT' as const },
          ]},
          { type: 'Cena', kind: 'plate' as const, plateName: null, foods: [] },
        ],
      },
      {
        label: 'Jueves',
        date: '18 ene',
        meals: [
          { type: 'Desayuno', kind: 'plate' as const, plateName: 'Cereal con leche', foods: [
            { name: 'Cereal', alClassification: 'NEUTRAL' as const },
          ]},
          { type: 'Comida', kind: 'plate' as const, plateName: 'Pescado con arroz', foods: [
            { name: 'Pescado', alClassification: 'NEUTRAL' as const },
            { name: 'Arroz', alClassification: 'NEUTRAL' as const },
          ]},
          { type: 'Cena', kind: 'plate' as const, plateName: 'Sopa de verduras', foods: [
            { name: 'Verduras', alClassification: 'NEUTRAL' as const },
          ]},
        ],
      },
      {
        label: 'Viernes',
        date: '19 ene',
        meals: [
          { type: 'Desayuno', kind: 'plate' as const, plateName: 'Huevo revuelto', foods: [
            { name: 'Huevo', alClassification: 'ASTRINGENT' as const },
          ]},
          { type: 'Comida', kind: 'plate' as const, plateName: 'Pastel de carne', foods: [
            { name: 'Carne', alClassification: 'ASTRINGENT' as const },
            { name: 'Verduras', alClassification: 'NEUTRAL' as const },
          ]},
          { type: 'Cena', kind: 'plate' as const, plateName: 'Galletas con leche', foods: [
            { name: 'Galletas', alClassification: 'ASTRINGENT' as const },
          ]},
        ],
      },
      {
        label: 'Sábado',
        date: '20 ene',
        meals: [
          { type: 'Desayuno', kind: 'plate' as const, plateName: 'Panqueques', foods: [
            { name: 'Harina', alClassification: 'NEUTRAL' as const },
          ]},
          { type: 'Comida', kind: 'plate' as const, plateName: 'Pollo al horno', foods: [
            { name: 'Pollo', alClassification: 'ASTRINGENT' as const },
            { name: 'Papas', alClassification: 'ASTRINGENT' as const },
          ]},
          { type: 'Cena', kind: 'plate' as const, plateName: 'Leche con galletas', foods: [
            { name: 'Leche', alClassification: 'NEUTRAL' as const },
          ]},
        ],
      },
      {
        label: 'Domingo',
        date: '21 ene',
        meals: [
          { type: 'Desayuno', kind: 'plate' as const, plateName: 'Tortilla francesa', foods: [
            { name: 'Huevo', alClassification: 'ASTRINGENT' as const },
          ]},
          { type: 'Comida', kind: 'plate' as const, plateName: 'Asado con ensalada', foods: [
            { name: 'Carne', alClassification: 'ASTRINGENT' as const },
            { name: 'Lechuga', alClassification: 'LAXATIVE' as const },
          ]},
          { type: 'Cena', kind: 'plate' as const, plateName: 'Yogur natural', foods: [
            { name: 'Yogur', alClassification: 'NEUTRAL' as const },
          ]},
        ],
      },
    ],
    weekStats: {
      total: 18,
      balanced: 12,
      empty: 3,
    },
  })

  const mountComponent = (overrides = {}) => {
    const data = createSampleData()
    return mount(MenuExportFrame, {
      props: {
        weekStart: data.weekStart,
        weekEnd: data.weekEnd,
        weekLabel: data.weekLabel,
        babyName: data.babyName,
        days: data.days,
        weekStats: data.weekStats,
        ...overrides,
      },
    })
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('3.1: Rendering with complete data', () => {
    it('renders header with title, week range and baby name', () => {
      const wrapper = mountComponent()

      expect(wrapper.find('.export-title').text()).toBe('Menú Semanal')
      expect(wrapper.find('.export-subtitle').text()).toBe('15 – 21 ene')
      expect(wrapper.find('.export-baby').text()).toBe('Martina')
    })

    it('renders 7 day columns with correct labels', () => {
      const wrapper = mountComponent()

      const dayHeaders = wrapper.findAll('.export-day__name')
      expect(dayHeaders.length).toBe(7)

      const expectedDays = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
      dayHeaders.forEach((header, index) => {
        expect(header.text()).toBe(expectedDays[index])
      })
    })

    it('renders dates in day headers', () => {
      const wrapper = mountComponent()

      const dayDates = wrapper.findAll('.export-day__date')
      expect(dayDates.length).toBe(7)
      expect(dayDates[0]!.text()).toBe('15 ene')
      expect(dayDates[6]!.text()).toBe('21 ene')
    })

    it('renders 3 meals per day (Desayuno, Comida, Cena)', () => {
      const wrapper = mountComponent()

      const mealTypes = wrapper.findAll('.export-meal__type')
      // 7 days × 3 meals = 21 meal slots
      expect(mealTypes.length).toBe(21)

      // Check first day's meals
      const firstDayMeals = mealTypes.slice(0, 3)
      expect(firstDayMeals[0]!.text()).toBe('Desayuno')
      expect(firstDayMeals[1]!.text()).toBe('Comida')
      expect(firstDayMeals[2]!.text()).toBe('Cena')
    })

    it('renders plate names in cells', () => {
      const wrapper = mountComponent()

      const plates = wrapper.findAll('.export-meal__plate')
      expect(plates.length).toBe(21)

      // Check some specific plates
      expect(plates[0]!.text()).toBe('Pancakes de banana')
      expect(plates[1]!.text()).toBe('Pollo con verduras')
      expect(plates[2]!.text()).toBe('Sopa de calabaza')
    })

    it('renders A/L dots with correct classes', () => {
      const wrapper = mountComponent()

      const astringentDots = wrapper.findAll('.export-food__dot--astringent')
      const laxativeDots = wrapper.findAll('.export-food__dot--laxative')
      const neutralDots = wrapper.findAll('.export-food__dot--neutral')

      // Should have dots for foods with classifications
      expect(astringentDots.length).toBeGreaterThan(0)
      expect(laxativeDots.length).toBeGreaterThan(0)
      expect(neutralDots.length).toBeGreaterThan(0)
    })

    it('renders footer stats correctly', () => {
      const wrapper = mountComponent()

      const stats = wrapper.findAll('.export-stat')
      expect(stats.length).toBe(3)

      // Check stats text content
      const statsText = stats.map(s => s.text())
      expect(statsText.some(t => t.includes('18') && t.includes('platos asignados'))).toBe(true)
      expect(statsText.some(t => t.includes('12') && t.includes('equilibrados'))).toBe(true)
      expect(statsText.some(t => t.includes('3') && t.includes('sin planificar'))).toBe(true)
    })

    it('renders disclaimer footer', () => {
      const wrapper = mountComponent()

      const disclaimer = wrapper.find('.export-disclaimer')
      expect(disclaimer.exists()).toBe(true)
      expect(disclaimer.text()).toContain('Información orientativa')
      expect(disclaimer.text()).toContain('Consulta siempre con tu pediatra')
    })

    it('renders logo and PRO badge in header', () => {
      const wrapper = mountComponent()

      expect(wrapper.find('.export-logo').text()).toBe('Pakulab')
      expect(wrapper.find('.export-badge').text()).toBe('PRO')
    })
  })

  describe('3.2: Empty slots and edge cases', () => {
    it('shows "Sin plato" for all cells when all plate slots are empty', () => {
      const emptyDays = Array.from({ length: 7 }, (_, i) => ({
        label: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'][i],
        date: `${15 + i} ene`,
        meals: [
          { type: 'Desayuno', kind: 'plate' as const, plateName: null as string | null, foods: [] },
          { type: 'Comida', kind: 'plate' as const, plateName: null as string | null, foods: [] },
          { type: 'Cena', kind: 'plate' as const, plateName: null as string | null, foods: [] },
        ],
      }))

      const wrapper = mount(MenuExportFrame, {
        props: {
          weekStart: '2024-01-15',
          weekEnd: '2024-01-21',
          weekLabel: '15 – 21 ene',
          babyName: 'Martina',
          days: emptyDays,
          weekStats: { total: 0, balanced: 0, empty: 21 },
        },
      })

      const plates = wrapper.findAll('.export-meal__plate')
      expect(plates.length).toBe(21)

      plates.forEach(plate => {
        expect(plate.text()).toBe('Sin plato')
        expect(plate.classes()).toContain('export-meal__plate--empty')
      })
    })

    it('shows mixed content with some plates and some empty slots', () => {
      const wrapper = mountComponent()

      // Tuesday's Comida has no plate
      const tuesdayMeals = wrapper.findAll('.export-day')[1]!.findAll('.export-meal__plate')
      expect(tuesdayMeals[1]!.text()).toBe('Sin plato')
      expect(tuesdayMeals[1]!.classes()).toContain('export-meal__plate--empty')

      // But Tuesday's Desayuno has a plate
      expect(tuesdayMeals[0]!.text()).toBe('Yogur con frutas')
      expect(tuesdayMeals[0]!.classes()).not.toContain('export-meal__plate--empty')
    })

    it('renders without A/L dots when meal has no foods', () => {
      const wrapper = mountComponent()

      // Wednesday's Desayuno has empty foods array
      const wednesday = wrapper.findAll('.export-day')[2]!
      const wednesdayMeals = wednesday.findAll('.export-meal')

      // Desayuno has plate but no foods
      const desayunoDots = wednesdayMeals[0]!.findAll('.export-food__dot')
      expect(desayunoDots.length).toBe(0)

      // Comida has foods with dots
      const comidaDots = wednesdayMeals[1]!.findAll('.export-food__dot')
      expect(comidaDots.length).toBe(2)
    })

    it('renders without baby name when prop is empty', () => {
      const wrapper = mountComponent({ babyName: '' })

      expect(wrapper.find('.export-baby').exists()).toBe(false)
    })

    it('exposes capture method via template ref', () => {
      const wrapper = mountComponent()

      // Check that component exposes capture method
      expect(typeof wrapper.vm.capture).toBe('function')
    })
  })

  describe('3.3: Stage label rendering (T-05-08)', () => {
    it('renders baby name with stage label in single line when stageLabel is provided', () => {
      const wrapper = mountComponent({
        babyName: 'Tomás',
        stageLabel: '13-23 meses'
      })

      const babyElement = wrapper.find('.export-baby')
      expect(babyElement.exists()).toBe(true)
      expect(babyElement.text()).toBe('Tomás — 13-23 meses')
    })

    it('renders only baby name when stageLabel is empty', () => {
      const wrapper = mountComponent({
        babyName: 'Martina',
        stageLabel: ''
      })

      const babyElement = wrapper.find('.export-baby')
      expect(babyElement.exists()).toBe(true)
      expect(babyElement.text()).toBe('Martina')
    })

    it('renders only baby name when stageLabel is absent', () => {
      const wrapper = mountComponent({
        babyName: 'Lucas'
        // stageLabel intentionally omitted
      })

      const babyElement = wrapper.find('.export-baby')
      expect(babyElement.exists()).toBe(true)
      expect(babyElement.text()).toBe('Lucas')
    })

    it('omits entire baby section when both babyName and stageLabel are empty', () => {
      const wrapper = mountComponent({
        babyName: '',
        stageLabel: ''
      })

      expect(wrapper.find('.export-baby').exists()).toBe(false)
    })
  })

  describe('Events', () => {
    it('emits done event when capture succeeds', async () => {
      const wrapper = mountComponent()

      await wrapper.vm.capture()

      expect(wrapper.emitted('done')).toBeTruthy()
      expect(wrapper.emitted('done')![0]).toEqual(['data:image/png;base64,mocked'])
    })

    it('emits error event when capture fails', async () => {
      const { default: html2canvas } = await import('html2canvas')
      vi.mocked(html2canvas).mockRejectedValueOnce(new Error('Canvas failed'))

      const wrapper = mountComponent()

      await wrapper.vm.capture()

      expect(wrapper.emitted('error')).toBeTruthy()
      expect(wrapper.emitted('error')![0]).toEqual(['Canvas failed'])
    })

    // ponytail: a no-op test that unmounts the wrapper and asserts
    // no error event was emitted is worse than no test — it suggests
    // coverage of the null-ref branch that does not actually exist.
    // The component handles a null exportRef internally (see
    // MenuExportFrame.vue capture() guard) but there is no
    // user-reachable way to trigger it; if we ever add one, the test
    // should call wrapper.vm.capture() against a stubbed null ref,
    // not rely on unmount.
  })

  describe('Snack slots (REQ-SK1 / Phase 3 hotfix)', () => {
    const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

    /**
     * 5-meal layout with assigned snacks on the two colación slots for the
     * first day. Mirrors what `MenuWeekPage.exportData` produces for a baby
     * ≥13 months with colaciones guardadas.
     */
    const buildDaysWithSnacks = () =>
      Array.from({ length: 7 }, (_, i) => ({
        label: dayNames[i],
        date: `${15 + i} ene`,
        meals: [
          {
            type: 'Desayuno',
            kind: 'plate' as const,
            plateName: 'Avena con fruta',
            foods: [
              { name: 'Avena', alClassification: 'NEUTRAL' as const },
              { name: 'Plátano', alClassification: 'LAXATIVE' as const },
            ],
          },
          {
            type: 'Colación 1',
            kind: 'snack' as const,
            plateName: i === 0 ? 'Manzana con nuez' : null,
            foods:
              i === 0
                ? [
                    { name: 'Manzana', alClassification: 'NEUTRAL' as const },
                    { name: 'Nuez', alClassification: 'NEUTRAL' as const },
                  ]
                : [],
          },
          {
            type: 'Comida',
            kind: 'plate' as const,
            plateName: 'Pollo con verduras',
            foods: [
              { name: 'Pollo', alClassification: 'ASTRINGENT' as const },
              { name: 'Zanahoria', alClassification: 'NEUTRAL' as const },
            ],
          },
          {
            type: 'Colación 2',
            kind: 'snack' as const,
            plateName: i === 2 ? 'Yogur con fruta' : null,
            foods:
              i === 2
                ? [
                    { name: 'Yogur', alClassification: 'NEUTRAL' as const },
                    { name: 'Fresa', alClassification: 'NEUTRAL' as const },
                  ]
                : [],
          },
          {
            type: 'Cena',
            kind: 'plate' as const,
            plateName: 'Sopa de calabaza',
            foods: [{ name: 'Calabaza', alClassification: 'LAXATIVE' as const }],
          },
        ],
      }))

    it('renders the snack slot type label (e.g., "Colación 1")', () => {
      const wrapper = mount(MenuExportFrame, {
        props: {
          weekStart: '2024-01-15',
          weekEnd: '2024-01-21',
          weekLabel: '15 – 21 ene',
          babyName: 'Tomás',
          days: buildDaysWithSnacks(),
          weekStats: { total: 28, balanced: 12, empty: 7 },
        },
      })

      // 7 días × 5 slots = 35 celdas; el tipo "Colación 1" aparece 7 veces.
      const types = wrapper.findAll('.export-meal__type')
      expect(types.length).toBe(35)
      const typeTexts = types.map((t) => t.text())
      expect(typeTexts.filter((t) => t === 'Colación 1').length).toBe(7)
      expect(typeTexts.filter((t) => t === 'Colación 2').length).toBe(7)
    })

    it('assigns the export-meal--snack class to snack slots and --plate to plate slots', () => {
      const wrapper = mount(MenuExportFrame, {
        props: {
          weekStart: '2024-01-15',
          weekEnd: '2024-01-21',
          weekLabel: '15 – 21 ene',
          babyName: 'Tomás',
          days: buildDaysWithSnacks(),
          weekStats: { total: 28, balanced: 12, empty: 7 },
        },
      })

      expect(wrapper.findAll('.export-meal--plate').length).toBe(7 * 3)
      expect(wrapper.findAll('.export-meal--snack').length).toBe(7 * 2)
    })

    it('shows "Sin colación" for empty snack slots', () => {
      const wrapper = mount(MenuExportFrame, {
        props: {
          weekStart: '2024-01-15',
          weekEnd: '2024-01-21',
          weekLabel: '15 – 21 ene',
          babyName: 'Tomás',
          days: buildDaysWithSnacks(),
          weekStats: { total: 28, balanced: 12, empty: 7 },
        },
      })

      // Días sin snack asignado (e.g., martes en el fixture): el slot de colación
      // debe mostrar "Sin colación", no "Sin plato".
      const tuesdayColacion1 = wrapper.findAll('.export-day')[1]!.findAll('.export-meal')[1]!
      expect(tuesdayColacion1.find('.export-meal__plate').text()).toBe('Sin colación')
      expect(tuesdayColacion1.find('.export-meal__plate').classes()).toContain(
        'export-meal__plate--empty',
      )
      expect(tuesdayColacion1.find('.export-meal__plate').classes()).toContain(
        'export-meal__plate--snack-empty',
      )
    })

    it('renders assigned snack name and foods WITHOUT A/L dots', () => {
      const wrapper = mount(MenuExportFrame, {
        props: {
          weekStart: '2024-01-15',
          weekEnd: '2024-01-21',
          weekLabel: '15 – 21 ene',
          babyName: 'Tomás',
          days: buildDaysWithSnacks(),
          weekStats: { total: 28, balanced: 12, empty: 7 },
        },
      })

      // Lunes lleva snack asignado en Colación 1
      const mondayColacion1 = wrapper.findAll('.export-day')[0]!.findAll('.export-meal')[1]!
      expect(mondayColacion1.find('.export-meal__plate').text()).toBe('Manzana con nuez')

      const snackFoods = mondayColacion1.findAll('.export-food')
      expect(snackFoods.length).toBe(2)
      // Sin dot A/L para colaciones: no debe haber ningún .export-food__dot en este slot.
      expect(mondayColacion1.findAll('.export-food__dot').length).toBe(0)

      // Nombres correctos
      const names = snackFoods.map((f) => f.find('.export-food__name').text())
      expect(names).toEqual(['Manzana', 'Nuez'])
    })

    it('still renders A/L dots on plate slots in the same component', () => {
      // Al incluir snacks, los slots de plato siguen llevando dot A/L.
      const wrapper = mount(MenuExportFrame, {
        props: {
          weekStart: '2024-01-15',
          weekEnd: '2024-01-21',
          weekLabel: '15 – 21 ene',
          babyName: 'Tomás',
          days: buildDaysWithSnacks(),
          weekStats: { total: 28, balanced: 12, empty: 7 },
        },
      })

      expect(wrapper.findAll('.export-food__dot--astringent').length).toBeGreaterThan(0)
      expect(wrapper.findAll('.export-food__dot--laxative').length).toBeGreaterThan(0)
      expect(wrapper.findAll('.export-food__dot--neutral').length).toBeGreaterThan(0)
    })

    it('preserves "Sin plato" copy on empty plate slots when snacks are present', () => {
      // Construimos un día donde SÓLO el plato está vacío (todos los snacks asignados).
      const days = [
        {
          label: 'Lunes',
          date: '15 ene',
          meals: [
            { type: 'Desayuno', kind: 'plate' as const, plateName: null, foods: [] },
            { type: 'Colación 1', kind: 'snack' as const, plateName: 'Manzana', foods: [{ name: 'Manzana', alClassification: 'NEUTRAL' as const }] },
            { type: 'Comida', kind: 'plate' as const, plateName: null, foods: [] },
            { type: 'Colación 2', kind: 'snack' as const, plateName: null, foods: [] },
            { type: 'Cena', kind: 'plate' as const, plateName: null, foods: [] },
          ],
        },
        ...Array.from({ length: 6 }, (_, i) => ({
          label: dayNames[i + 1]!,
          date: `${15 + i + 1} ene`,
          meals: [
            { type: 'Desayuno', kind: 'plate' as const, plateName: null, foods: [] },
            { type: 'Colación 1', kind: 'snack' as const, plateName: null, foods: [] },
            { type: 'Comida', kind: 'plate' as const, plateName: null, foods: [] },
            { type: 'Colación 2', kind: 'snack' as const, plateName: null, foods: [] },
            { type: 'Cena', kind: 'plate' as const, plateName: null, foods: [] },
          ],
        })),
      ]

      const wrapper = mount(MenuExportFrame, {
        props: {
          weekStart: '2024-01-15',
          weekEnd: '2024-01-21',
          weekLabel: '15 – 21 ene',
          babyName: 'Tomás',
          days,
          weekStats: { total: 1, balanced: 0, empty: 34 },
        },
      })

      const monday = wrapper.findAll('.export-day')[0]!
      // Slot de Comida (índice 2) es plate vacío → "Sin plato"
      const comida = monday.findAll('.export-meal')[2]!
      const comidaPlate = comida.find('.export-meal__plate')
      expect(comidaPlate.text()).toBe('Sin plato')
      expect(comidaPlate.classes()).toContain('export-meal__plate--empty')
      expect(comidaPlate.classes()).not.toContain('export-meal__plate--snack-empty')

      // Slot de Colación 2 (índice 3) es snack vacío → "Sin colación"
      const colacion2 = monday.findAll('.export-meal')[3]!
      const colacion2Plate = colacion2.find('.export-meal__plate')
      expect(colacion2Plate.text()).toBe('Sin colación')
      expect(colacion2Plate.classes()).toContain('export-meal__plate--snack-empty')
    })
  })
})
