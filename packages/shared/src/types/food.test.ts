/**
 * @file food.test.ts
 * Tests for food types and constants — mirrors Prisma enum validation.
 * No DB required (type-only tests).
 */

import { describe, it, expect } from 'vitest'
import type { WarningTag } from './food'
import { WARNING_TAGS, WARNING_TAG_LABELS } from './food'

describe('WarningTag enum (T-03-01)', () => {
  it('should have exactly 4 warning tag values', () => {
    expect(WARNING_TAGS).toHaveLength(4)
  })

  it('should have PROHIBITED_UNDER_24M tag', () => {
    expect(WARNING_TAGS).toContain('PROHIBITED_UNDER_24M')
  })

  it('should have CHOKING_HAZARD_UNDER_5Y tag', () => {
    expect(WARNING_TAGS).toContain('CHOKING_HAZARD_UNDER_5Y')
  })

  it('should have PROHIBITED_PEDIATRIC tag', () => {
    expect(WARNING_TAGS).toContain('PROHIBITED_PEDIATRIC')
  })

  it('should have REQUIRES_PREPARATION tag', () => {
    expect(WARNING_TAGS).toContain('REQUIRES_PREPARATION')
  })

  it('should allow WarningTag type assignment', () => {
    const tag1: WarningTag = 'PROHIBITED_UNDER_24M'
    const tag2: WarningTag = 'CHOKING_HAZARD_UNDER_5Y'
    const tag3: WarningTag = 'PROHIBITED_PEDIATRIC'
    const tag4: WarningTag = 'REQUIRES_PREPARATION'

    expect(tag1).toBe('PROHIBITED_UNDER_24M')
    expect(tag2).toBe('CHOKING_HAZARD_UNDER_5Y')
    expect(tag3).toBe('PROHIBITED_PEDIATRIC')
    expect(tag4).toBe('REQUIRES_PREPARATION')
  })

  it('should allow empty array default for warningTags', () => {
    const emptyTags: readonly WarningTag[] = []
    expect(emptyTags).toEqual([])
  })

  it('should allow multi-tag arrays (e.g., choking + requires_preparation)', () => {
    const multiTags: readonly WarningTag[] = [
      'CHOKING_HAZARD_UNDER_5Y',
      'REQUIRES_PREPARATION'
    ]
    expect(multiTags).toHaveLength(2)
  })
})

describe('WARNING_TAG_LABELS (T-04-11 shared constant)', () => {
  it('should have all 4 warning tag keys', () => {
    const keys = Object.keys(WARNING_TAG_LABELS)
    expect(keys).toHaveLength(4)
    expect(keys).toContain('PROHIBITED_UNDER_24M')
    expect(keys).toContain('CHOKING_HAZARD_UNDER_5Y')
    expect(keys).toContain('PROHIBITED_PEDIATRIC')
    expect(keys).toContain('REQUIRES_PREPARATION')
  })

  it('should have es-MX tuteo strings for all tags', () => {
    expect(WARNING_TAG_LABELS.PROHIBITED_UNDER_24M).toBe('No recomendado antes de los 2 años')
    expect(WARNING_TAG_LABELS.CHOKING_HAZARD_UNDER_5Y).toBe('Riesgo de atragantamiento en menores de 5 años')
    expect(WARNING_TAG_LABELS.PROHIBITED_PEDIATRIC).toBe('No recomendado en toda la edad pediátrica')
    expect(WARNING_TAG_LABELS.REQUIRES_PREPARATION).toBe('Requiere preparación específica (cocción/corte)')
  })

  it('should cover all WARNING_TAGS values', () => {
    WARNING_TAGS.forEach((tag) => {
      expect(WARNING_TAG_LABELS[tag]).toBeDefined()
      expect(typeof WARNING_TAG_LABELS[tag]).toBe('string')
      expect(WARNING_TAG_LABELS[tag].length).toBeGreaterThan(0)
    })
  })

  it('should use es-MX tuteo (not voseo)', () => {
    // Check no voseo markers (consultá, tenés, etc.)
    const allText = Object.values(WARNING_TAG_LABELS).join(' ')
    expect(allText).not.toContain('consultá')
    expect(allText).not.toContain('tenés')
    expect(allText).not.toContain('ofrecé')

    // Should use tuteo forms
    expect(allText).toContain('años')
    expect(allText).toContain('menores')
  })
})

// NOTE: The Prisma <-> shared enum sync test lives in apps/api
// (modules/foods/warning-tags-sync.test.ts), where @prisma/client is a
// declared dependency and the generated client is available. packages/shared
// is the source of truth for shared types and must NOT depend on @prisma/client.
