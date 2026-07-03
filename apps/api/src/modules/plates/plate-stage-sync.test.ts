/**
 * @file plate-stage-sync.test.ts
 * Verifies the shared PlateStage enum (source of truth in @pakulab/shared)
 * stays in sync with the Prisma-generated PlateStage enum.
 *
 * This test lives in apps/api — not packages/shared — because @prisma/client
 * is a declared dependency here and the generated client is available. The
 * shared package must NOT depend on @prisma/client (it is the upstream source
 * of truth for shared types).
 */

import { describe, it, expect } from 'vitest'
import { PlateStage as PrismaPlateStage } from '@prisma/client'
import { PLATE_STAGES } from '@pakulab/shared'

describe('PlateStage enum sync (Prisma <-> shared)', () => {
  it('should match Prisma PlateStage enum values exactly', () => {
    const prismaValues = Object.values(PrismaPlateStage) as string[]
    const sharedValues = [...PLATE_STAGES]

    expect([...sharedValues].sort()).toEqual([...prismaValues].sort())
  })
})
