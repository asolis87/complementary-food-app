/**
 * @file schema-non-destructive.test.ts
 * Schema audit — non-destructive migration guard.
 *
 * This repo deploys via `prisma db push` (schema-driven), so auditing schema.prisma
 * is the correct shipped artifact, NOT a gitignored migration file.
 *
 * Verifies:
 * - WarningTag enum exists with exactly the 4 values
 * - Food.warningTags is `WarningTag[]` with `@default([])`
 * - No DROP/rename of existing Food columns
 *
 * NO DATABASE REQUIRED — reads prisma/schema.prisma as text.
 */

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Path from packages/shared/src/data/ to repo-root prisma/schema.prisma
const schemaPath = join(__dirname, '../../../../prisma/schema.prisma')

let schemaText: string
try {
  schemaText = readFileSync(schemaPath, 'utf-8')
} catch (err) {
  throw new Error(`Failed to read schema.prisma at ${schemaPath}: ${err}`)
}

describe('Schema Non-Destructive Audit — BLOQUE 3 (PR-5)', () => {
  describe('WarningTag enum', () => {
    it('should exist in schema.prisma', () => {
      expect(schemaText).toContain('enum WarningTag')
    })

    it('should have exactly 4 values', () => {
      const enumBody = schemaText.match(/enum\s+WarningTag\s*\{([^}]+)\}/s)?.[1]
      if (enumBody) {
        const values = enumBody
          .split('\n')
          .map((line) => line.trim())
          .filter((line) => line && !line.startsWith('//'))

        expect(values).toHaveLength(4)
        expect(values).toContain('PROHIBITED_UNDER_24M')
        expect(values).toContain('CHOKING_HAZARD_UNDER_5Y')
        expect(values).toContain('PROHIBITED_PEDIATRIC')
        expect(values).toContain('REQUIRES_PREPARATION')
      } else {
        throw new Error('enum WarningTag not found')
      }
    })
  })

  describe('Food.warningTags field', () => {
    it('should exist as WarningTag[] with @default([])', () => {
      // Match the warningTags field in the Food model
      const fieldPattern = /warningTags\s+WarningTag\[\]\s+@default\(\[\]\)/
      expect(schemaText).toMatch(fieldPattern)
    })
  })

  describe('Non-destructive migration guard', () => {
    it('should NOT drop or rename existing Food columns', () => {
      // Core fields that MUST exist (baseline from PR-1)
      const requiredFields = [
        'id',
        'name',
        'group',
        'alClassification',
        'alScore',
        'isAllergen',
        'ageMonths',
        'needsValidation',
        'createdAt',
        'updatedAt',
      ]

      const foodModelBody = schemaText.match(/model\s+Food\s*\{([^}]+)\}/s)?.[1]
      if (foodModelBody) {
        requiredFields.forEach((field) => {
          const fieldPattern = new RegExp(`\\b${field}\\s+`, 'm')
          expect(
            foodModelBody,
            `Required field "${field}" missing or renamed in Food model`,
          ).toMatch(fieldPattern)
        })
      } else {
        throw new Error('Food model not found')
      }
    })

    it('should NOT contain DROP or ALTER TABLE destructive commands in schema comments', () => {
      const destructivePatterns = [
        /DROP\s+TABLE/i,
        /DROP\s+COLUMN/i,
        /ALTER\s+TABLE.*DROP/i,
        /RENAME\s+COLUMN/i,
      ]

      destructivePatterns.forEach((pattern) => {
        expect(
          schemaText,
          `Schema contains destructive operation pattern: ${pattern}`,
        ).not.toMatch(pattern)
      })
    })
  })
})
