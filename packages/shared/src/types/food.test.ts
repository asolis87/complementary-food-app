/**
 * @file food.test.ts
 * Tests for food types and constants — mirrors Prisma enum validation.
 * No DB required (type-only tests).
 */

import { describe, it, expect } from 'vitest'
import type { WarningTag } from './food'
import { WARNING_TAGS } from './food'

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

// NOTE: The Prisma <-> shared enum sync test lives in apps/api
// (modules/foods/warning-tags-sync.test.ts), where @prisma/client is a
// declared dependency and the generated client is available. packages/shared
// is the source of truth for shared types and must NOT depend on @prisma/client.
