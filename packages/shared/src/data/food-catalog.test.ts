/**
 * @file food-catalog.test.ts
 * DB-free integrity test for the food catalog.
 *
 * Verifies the catalog against accidental changes and documents clinical decisions.
 *
 * BLOQUE 1 (PR-3): 10-23m age audit.
 * - ageMonths (6-8m) follow Protocolo Beikost / Dra. Trueba (not the obsolete 10-12m spec proposal)
 * - needsValidation: false is intentional (validated during 154-food catalog expansion)
 *
 * BLOQUE 3 (PR-5): WarningTag backfill.
 * - All tree_nuts foods carry CHOKING_HAZARD_UNDER_5Y per PDF page 7
 * - Round/hard-chunk foods tagged
 * - Garbanzo NOT tagged (deferred confirmation)
 *
 * NO DATABASE REQUIRED — imports the foods array directly from the shared catalog.
 */

import { describe, it, expect } from 'vitest'
import { foods } from './food-catalog'

describe('BLOQUE 1 (PR-3): 10-23m Age Audit — 6 Target Foods', () => {
  describe('Individual Food Verification', () => {
    it('should have Yogurt natural entero (sin azúcar) at 6 months', () => {
      const food = foods.find((f) => f.name === 'Yogurt natural entero (sin azúcar)')
      expect(food, 'Yogurt not found').toBeDefined()
      expect(food!.group).toBe('PROTEIN')
      expect(food!.isAllergen).toBe(true)
      expect(food!.allergenType).toBe('dairy')
      expect(food!.ageMonths).toBe(6) // Protocolo Beikost value
      expect(food!.needsValidation).toBe(false)
    })

    it('should have Queso panela at 8 months', () => {
      const food = foods.find((f) => f.name === 'Queso panela')
      expect(food, 'Queso panela not found').toBeDefined()
      expect(food!.group).toBe('PROTEIN')
      expect(food!.isAllergen).toBe(true)
      expect(food!.allergenType).toBe('dairy')
      expect(food!.ageMonths).toBe(8) // Protocolo Beikost value
      expect(food!.needsValidation).toBe(false)
    })

    it('should have Frijol negro cocido at 8 months', () => {
      const food = foods.find((f) => f.name === 'Frijol negro cocido')
      expect(food, 'Frijol negro not found').toBeDefined()
      expect(food!.group).toBe('PROTEIN')
      expect(food!.isAllergen).toBe(false)
      expect(food!.ageMonths).toBe(8) // Protocolo Beikost value
      expect(food!.needsValidation).toBe(false)
    })

    it('should have Lenteja cocida at 7 months', () => {
      const food = foods.find((f) => f.name === 'Lenteja cocida')
      expect(food, 'Lenteja not found').toBeDefined()
      expect(food!.group).toBe('PROTEIN')
      expect(food!.isAllergen).toBe(false)
      expect(food!.ageMonths).toBe(7) // Protocolo Beikost value
      expect(food!.needsValidation).toBe(false)
    })

    it('should have Garbanzo cocido at 8 months', () => {
      const food = foods.find((f) => f.name === 'Garbanzo cocido')
      expect(food, 'Garbanzo not found').toBeDefined()
      expect(food!.group).toBe('PROTEIN')
      expect(food!.isAllergen).toBe(false)
      expect(food!.ageMonths).toBe(8) // Protocolo Beikost value
      expect(food!.needsValidation).toBe(false)
    })

    it('should have Hígado de pollo cocido at 8 months', () => {
      const food = foods.find((f) => f.name === 'Hígado de pollo cocido')
      expect(food, 'Hígado de pollo not found').toBeDefined()
      expect(food!.group).toBe('PROTEIN')
      expect(food!.isAllergen).toBe(false)
      expect(food!.ageMonths).toBe(8) // Protocolo Beikost value
      expect(food!.needsValidation).toBe(false)
    })
  })

  describe('Triangulation: "queso fresco" cluster verification', () => {
    it('should have all 3 cheeses (panela, requesón, cottage) as the "queso fresco" cluster', () => {
      const panela = foods.find((f) => f.name === 'Queso panela')
      const requeson = foods.find((f) => f.name === 'Queso requesón')
      const cottage = foods.find((f) => f.name === 'Queso cottage')

      expect(panela, 'Panela not found').toBeDefined()
      expect(requeson, 'Requesón not found').toBeDefined()
      expect(cottage, 'Cottage not found').toBeDefined()

      // All are PROTEIN, all are dairy allergens, all at 8 months
      ;[panela, requeson, cottage].forEach((cheese) => {
        expect(cheese!.group).toBe('PROTEIN')
        expect(cheese!.isAllergen).toBe(true)
        expect(cheese!.allergenType).toBe('dairy')
        expect(cheese!.ageMonths).toBe(8)
      })
    })

    it('should have hígado, lenteja, and frijol as PROTEIN without allergen status', () => {
      const higado = foods.find((f) => f.name === 'Hígado de pollo cocido')
      const lenteja = foods.find((f) => f.name === 'Lenteja cocida')
      const frijol = foods.find((f) => f.name === 'Frijol negro cocido')

      expect(higado, 'Hígado not found').toBeDefined()
      expect(lenteja, 'Lenteja not found').toBeDefined()
      expect(frijol, 'Frijol not found').toBeDefined()

      ;[higado, lenteja, frijol].forEach((food) => {
        expect(food!.group).toBe('PROTEIN')
        expect(food!.isAllergen).toBe(false)
      })
    })
  })

  describe('Catalog-wide invariants', () => {
    it('should not have duplicate food names in the catalog', () => {
      const nameSet = new Set<string>()
      const duplicates: string[] = []

      foods.forEach((food) => {
        if (nameSet.has(food.name)) {
          duplicates.push(food.name)
        }
        nameSet.add(food.name)
      })

      expect(duplicates, `Found duplicate food names: ${duplicates.join(', ')}`).toHaveLength(0)
    })

    it('should have at least 154 foods in the catalog (post-expansion minimum)', () => {
      expect(foods.length).toBeGreaterThanOrEqual(154)
    })
  })
})

describe('BLOQUE 3 (PR-5): WarningTag Backfill — T-03-03', () => {
  describe('WarningTag enum values are valid', () => {
    it('should only use valid WarningTag enum values', () => {
      const validTags = new Set([
        'PROHIBITED_UNDER_24M',
        'CHOKING_HAZARD_UNDER_5Y',
        'PROHIBITED_PEDIATRIC',
        'REQUIRES_PREPARATION',
      ])

      const allWarningTags = foods.flatMap((f) => f.warningTags ?? [])
      const invalidTags = allWarningTags.filter((tag) => !validTags.has(tag))

      expect(invalidTags, `Invalid warning tags found: ${invalidTags.join(', ')}`).toHaveLength(0)
    })
  })

  describe('CHOKING_HAZARD_UNDER_5Y tags (PDF page 7 — frutos secos)', () => {
    it('should tag ALL tree_nuts foods with CHOKING_HAZARD_UNDER_5Y', () => {
      const treeNutFoods = foods.filter((f) => f.allergenType === 'tree_nuts')
      expect(treeNutFoods.length, 'Expected at least 9 tree_nuts foods').toBeGreaterThanOrEqual(9)

      const untaggedTreeNuts = treeNutFoods.filter(
        (f) => !(f.warningTags ?? []).includes('CHOKING_HAZARD_UNDER_5Y'),
      )

      expect(
        untaggedTreeNuts.map((f) => f.name),
        'All tree_nuts foods must have CHOKING_HAZARD_UNDER_5Y per PDF page 7',
      ).toEqual([])
    })

    it('should tag peanut butter (cacahuate) with CHOKING_HAZARD_UNDER_5Y', () => {
      const cacahuate = foods.find((f) => f.name.toLowerCase().includes('cacahuate'))
      expect(cacahuate, 'Crema de cacahuate not found').toBeDefined()
      expect(cacahuate!.warningTags).toContain('CHOKING_HAZARD_UNDER_5Y')
    })

    it('should tag round whole fruits with CHOKING_HAZARD_UNDER_5Y', () => {
      const uvas = foods.find((f) => f.name.toLowerCase().includes('uva'))
      const arandano = foods.find((f) => f.name.toLowerCase().includes('arándano'))

      expect(uvas, 'Uvas not found').toBeDefined()
      expect(uvas!.warningTags).toContain('CHOKING_HAZARD_UNDER_5Y')

      expect(arandano, 'Arándano not found').toBeDefined()
      expect(arandano!.warningTags).toContain('CHOKING_HAZARD_UNDER_5Y')
    })

    it('should tag hard-chunk foods with CHOKING_HAZARD_UNDER_5Y', () => {
      const manzanaCruda = foods.find((f) => f.name.toLowerCase().includes('manzana cruda'))
      const jicama = foods.find((f) => f.name.toLowerCase().includes('jícama'))

      expect(manzanaCruda, 'Manzana cruda not found').toBeDefined()
      expect(manzanaCruda!.warningTags).toContain('CHOKING_HAZARD_UNDER_5Y')

      expect(jicama, 'Jícama not found').toBeDefined()
      expect(jicama!.warningTags).toContain('CHOKING_HAZARD_UNDER_5Y')
    })

    it('should tag whole-kernel foods (elote) with CHOKING_HAZARD_UNDER_5Y', () => {
      const eloteGranos = foods.find((f) => f.name === 'Elote (granos cocidos)')

      expect(eloteGranos, 'Elote (granos cocidos) not found').toBeDefined()
      expect(eloteGranos!.warningTags).toContain('CHOKING_HAZARD_UNDER_5Y')
    })
  })

  describe('REQUIRES_PREPARATION tag (prep guidance)', () => {
    it('should tag tree_nuts foods with REQUIRES_PREPARATION', () => {
      const treeNutFoods = foods.filter((f) => f.allergenType === 'tree_nuts')
      const untaggedWithRequiresPrep = treeNutFoods.filter(
        (f) => !(f.warningTags ?? []).includes('REQUIRES_PREPARATION'),
      )

      expect(
        untaggedWithRequiresPrep.map((f) => f.name),
        'All tree_nuts foods must have REQUIRES_PREPARATION',
      ).toEqual([])
    })
  })

  describe('Untagged safe foods', () => {
    it('should leave safe cooked vegetables untagged', () => {
      const calabacita = foods.find((f) => f.name === 'Calabacita cocida')
      const zanahoriaCocida = foods.find((f) => f.name === 'Zanahoria cocida')

      expect(calabacita, 'Calabacita cocida not found').toBeDefined()
      expect(calabacita!.warningTags ?? []).toEqual([])

      expect(zanahoriaCocida, 'Zanahoria cocida not found').toBeDefined()
      expect(zanahoriaCocida!.warningTags ?? []).toEqual([])
    })

    it('should leave safe soft fruits untagged', () => {
      const platano = foods.find((f) => f.name === 'Plátano maduro')
      const aguacate = foods.find((f) => f.name === 'Aguacate')

      expect(platano, 'Plátano maduro not found').toBeDefined()
      expect(platano!.warningTags ?? []).toEqual([])

      expect(aguacate, 'Aguacate not found').toBeDefined()
      expect(aguacate!.warningTags ?? []).toEqual([])
    })
  })

  describe('Garbanzo deferred confirmation (NOT on PDF page 7 verbatim)', () => {
    it('should have garbanzo cocido in the catalog', () => {
      const garbanzo = foods.find((f) => f.name === 'Garbanzo cocido')
      expect(garbanzo, 'Garbanzo cocido not found').toBeDefined()
    })

    it('should NOT tag garbanzo yet (awaiting product confirmation per seed.ts NOTE)', () => {
      const garbanzo = foods.find((f) => f.name === 'Garbanzo cocido')
      expect(garbanzo, 'Garbanzo cocido not found').toBeDefined()
      expect(garbanzo!.warningTags ?? []).not.toContain('CHOKING_HAZARD_UNDER_5Y')
    })
  })

  describe('Regression guard: warningTags persistence', () => {
    it('should maintain at least 14 foods with CHOKING_HAZARD_UNDER_5Y', () => {
      const chokingHazardFoods = foods.filter((f) =>
        (f.warningTags ?? []).includes('CHOKING_HAZARD_UNDER_5Y'),
      )
      // Floor matches the documented backfill (all tree_nuts + round-whole + hard-chunk
      // foods per PDF page 7). Dropping below this signals an accidental tag removal.
      expect(
        chokingHazardFoods.length,
        'Expected at least 14 foods tagged CHOKING_HAZARD_UNDER_5Y',
      ).toBeGreaterThanOrEqual(14)
    })
  })
})
