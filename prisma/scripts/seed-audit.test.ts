/**
 * @file seed-audit.test.ts
 * DB-free integrity test for BLOQUE 1 (PR-3) — 10-23m age audit.
 *
 * Verifies the 6 BLOQUE 1 target foods exist in the seed catalog with their
 * current validated values (ageMonths, needsValidation, group, allergen status).
 *
 * This test anchors the catalog against accidental changes and documents that:
 * - ageMonths (6-8m) follow Protocolo Beikost / Dra. Trueba (not the obsolete 10-12m spec proposal)
 * - needsValidation: false is intentional (validated during 154-food catalog expansion)
 * - isIronRich and warningTags are DEFERRED to later Bloques (schema fields don't exist yet)
 *
 * NO DATABASE REQUIRED — imports the foods array directly from seed.ts.
 */

import { describe, it, expect } from 'vitest';
import { foods } from '../seed';

describe('BLOQUE 1 (PR-3): 10-23m Age Audit — 6 Target Foods', () => {
  describe('Individual Food Verification', () => {
    it('should have Yogurt natural entero (sin azúcar) with correct properties', () => {
      const food = foods.find((f) => f.name === 'Yogurt natural entero (sin azúcar)');
      expect(food, 'Yogurt not found in catalog').toBeDefined();
      expect(food!.group).toBe('PROTEIN');
      expect(food!.isAllergen).toBe(true);
      expect(food!.allergenType).toBe('dairy');
      expect(food!.ageMonths).toBe(6); // Protocolo Beikost value (NOT 10-12m from obsolete spec)
      expect(food!.needsValidation).toBe(false); // Validated during catalog expansion
    });

    it('should have Queso panela with correct properties', () => {
      const food = foods.find((f) => f.name === 'Queso panela');
      expect(food, 'Queso panela not found').toBeDefined();
      expect(food!.group).toBe('PROTEIN');
      expect(food!.isAllergen).toBe(true);
      expect(food!.allergenType).toBe('dairy');
      expect(food!.ageMonths).toBe(8); // Protocolo Beikost value
      expect(food!.needsValidation).toBe(false);
    });

    it('should have Frijol negro cocido with correct properties', () => {
      const food = foods.find((f) => f.name === 'Frijol negro cocido');
      expect(food, 'Frijol negro not found').toBeDefined();
      expect(food!.group).toBe('PROTEIN');
      expect(food!.isAllergen).toBe(false);
      expect(food!.ageMonths).toBe(8); // Protocolo Beikost value
      expect(food!.needsValidation).toBe(false);
    });

    it('should have Lenteja cocida with correct properties', () => {
      const food = foods.find((f) => f.name === 'Lenteja cocida');
      expect(food, 'Lenteja cocida not found').toBeDefined();
      expect(food!.group).toBe('PROTEIN');
      expect(food!.isAllergen).toBe(false);
      expect(food!.ageMonths).toBe(7); // Protocolo Beikost value
      expect(food!.needsValidation).toBe(false);
    });

    it('should have Garbanzo cocido with correct properties', () => {
      const food = foods.find((f) => f.name === 'Garbanzo cocido');
      expect(food, 'Garbanzo cocido not found').toBeDefined();
      expect(food!.group).toBe('PROTEIN');
      expect(food!.isAllergen).toBe(false);
      expect(food!.ageMonths).toBe(8); // Protocolo Beikost value
      expect(food!.needsValidation).toBe(false);
    });

    it('should have Hígado de pollo cocido with correct properties', () => {
      const food = foods.find((f) => f.name === 'Hígado de pollo cocido');
      expect(food, 'Hígado de pollo not found').toBeDefined();
      expect(food!.group).toBe('PROTEIN');
      expect(food!.isAllergen).toBe(false);
      expect(food!.ageMonths).toBe(8); // Protocolo Beikost value
      expect(food!.needsValidation).toBe(false);
    });
  });

  describe('Triangulation: "queso fresco" cluster verification', () => {
    it('should have all 3 cheeses (panela, requesón, cottage) as the "queso fresco" cluster', () => {
      const panela = foods.find((f) => f.name === 'Queso panela');
      const requeson = foods.find((f) => f.name === 'Queso requesón');
      const cottage = foods.find((f) => f.name === 'Queso cottage');

      expect(panela, 'Panela not found').toBeDefined();
      expect(requeson, 'Requesón not found').toBeDefined();
      expect(cottage, 'Cottage not found').toBeDefined();

      // All are PROTEIN, all are dairy allergens, all at 8 months
      [panela, requeson, cottage].forEach((cheese) => {
        expect(cheese!.group).toBe('PROTEIN');
        expect(cheese!.isAllergen).toBe(true);
        expect(cheese!.allergenType).toBe('dairy');
        expect(cheese!.ageMonths).toBe(8);
      });
    });

    it('should have hígado, lenteja, and frijol as PROTEIN without allergen status', () => {
      const higado = foods.find((f) => f.name === 'Hígado de pollo cocido');
      const lenteja = foods.find((f) => f.name === 'Lenteja cocida');
      const frijol = foods.find((f) => f.name === 'Frijol negro cocido');

      expect(higado, 'Hígado not found').toBeDefined();
      expect(lenteja, 'Lenteja not found').toBeDefined();
      expect(frijol, 'Frijol not found').toBeDefined();

      [higado, lenteja, frijol].forEach((food) => {
        expect(food!.group).toBe('PROTEIN');
        expect(food!.isAllergen).toBe(false);
      });
    });
  });

  describe('Catalog-wide invariants', () => {
    it('should not have duplicate food names in the catalog', () => {
      const nameSet = new Set<string>();
      const duplicates: string[] = [];

      foods.forEach((food) => {
        if (nameSet.has(food.name)) {
          duplicates.push(food.name);
        }
        nameSet.add(food.name);
      });

      expect(
        duplicates,
        `Found duplicate food names: ${duplicates.join(', ')}`
      ).toHaveLength(0);
    });

    it('should have at least 154 foods in the catalog (post-expansion minimum)', () => {
      expect(foods.length).toBeGreaterThanOrEqual(154);
    });
  });
});
