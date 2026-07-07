/**
 * @file snack-group-sync.test.ts
 * Verifies the shared SNACK_GROUPS constant (source of truth in @pakulab/shared)
 * is a subset of the Prisma-generated FoodGroup enum.
 *
 * This test lives in apps/api — not packages/shared — because @prisma/client
 * is a declared dependency here and the generated client is available. The
 * shared package must NOT depend on @prisma/client (it is the upstream source
 * of truth for shared types).
 */

import { describe, it, expect } from 'vitest'
import { FoodGroup as PrismaFoodGroup } from '@prisma/client'
import { SNACK_GROUPS } from '@pakulab/shared'

describe('SNACK_GROUPS sync (Prisma FoodGroup <-> shared)', () => {
  it('should be a subset of Prisma FoodGroup enum', () => {
    const prismaValues = Object.values(PrismaFoodGroup) as string[]
    const snackGroups = [...SNACK_GROUPS]

    // Every snack group must exist in Prisma FoodGroup
    snackGroups.forEach((group) => {
      expect(prismaValues).toContain(group)
    })
  })

  it('should contain exactly 3 snack groups', () => {
    expect(SNACK_GROUPS).toHaveLength(3)
  })
})
