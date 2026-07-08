/**
 * @file warning-tags-sync.test.ts
 * Verifies the shared WarningTag enum (source of truth in @pakulab/shared)
 * stays in sync with the Prisma-generated WarningTag enum.
 *
 * This test lives in apps/api — not packages/shared — because @prisma/client
 * is a declared dependency here and the generated client is available. The
 * shared package must NOT depend on @prisma/client (it is the upstream source
 * of truth for shared types).
 */

import { describe, it, expect } from 'vitest'
import { WarningTag as PrismaWarningTag } from '@prisma/client'
import { WARNING_TAGS } from '@pakulab/shared'

describe('WarningTag enum sync (Prisma <-> shared)', () => {
  it('should match Prisma WarningTag enum values exactly', () => {
    const prismaValues = Object.values(PrismaWarningTag) as string[]
    const sharedValues = [...WARNING_TAGS]

    expect([...sharedValues].sort()).toEqual([...prismaValues].sort())
  })
})
