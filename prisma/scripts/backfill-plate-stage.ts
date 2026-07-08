/**
 * Backfill: Plate.stageFor NULL → SIX_TO_NINE_MONTHS
 *
 * Context
 * ────────
 * `Plate.stageFor` (enum PlateStage) was added in the 10-23-months release.
 * Plates created before that release have `stageFor = NULL`. The plate list
 * filter builds `WHERE stageFor = <selected>` (see plates.service.ts), so a
 * NULL-staged plate matches NO age filter — picking "6-9 meses" returns an
 * empty list even though those plates belong to that stage. Only the "all
 * stages" (no filter) view shows them.
 *
 * Why SIX_TO_NINE_MONTHS
 * ──────────────────────
 * The stage cutoffs (getMealSlotsForAge): 6-9m is the first complementary-
 * feeding stage. Every pre-release plate was created during that earliest
 * window (the product had no stage concept before, and the babies in the
 * data were in early complementary feeding). Assigning them to the FIRST
 * stage is the safe, correct default: it is where a plate with no declared
 * stage most plausibly belongs, and it makes the "6-9 meses" filter surface
 * the historical plates as the user expects. The target stage is
 * parameterizable via --stage=<PlateStage> for edge cases, but the default
 * is deliberate.
 *
 * Why a script and not a migration
 * ─────────────────────────────────
 * `prisma/migrations/` is gitignored in this repo (schema is applied via
 * `db push`), so there is no migration to carry a data backfill. An
 * idempotent row-rewrite script is the repo's established pattern (see
 * backfill-snack-to-snack1.ts) and runs the same way in every environment,
 * including production, where legacy plates will have the same NULL stage.
 *
 * Usage
 * ─────
 *   # 1. Inspect what would change. Safe, no writes (default).
 *   npx tsx prisma/scripts/backfill-plate-stage.ts --dry-run
 *
 *   # 2. Apply. Idempotent — re-running is a no-op once count = 0.
 *   npx tsx prisma/scripts/backfill-plate-stage.ts --apply
 *
 *   # Optional: target a different stage (default SIX_TO_NINE_MONTHS)
 *   npx tsx prisma/scripts/backfill-plate-stage.ts --apply --stage=TEN_TO_TWELVE_MONTHS
 *
 * Reversibility
 * ─────────────
 * There is no safe automated rollback: once NULL plates are stamped, they are
 * indistinguishable from plates a user deliberately set to SIX_TO_NINE_MONTHS.
 * The only safe rollback is to restore from a pre-backfill DB dump. Always
 * snapshot the DB before running with --apply
 * (see scripts/staging/ssh-backup.sh).
 */

import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'
import { PlateStage, PrismaClient } from '@prisma/client'

export type Mode = 'dry-run' | 'apply'

export type ParsedArgs = {
  mode: Mode
  stage: PlateStage
}

export type BackfillResult = {
  mode: Mode
  stage: PlateStage
  matchedCount: number
  updatedCount: number
  remainingCount: number
  sample?: Array<{
    id: string
    userId: string
    babyProfileId: string | null
    name: string
    createdAt: Date
  }>
}

const VALID_STAGES = Object.values(PlateStage)
const DEFAULT_STAGE: PlateStage = PlateStage.SIX_TO_NINE_MONTHS

export function parseArgs(argv: readonly string[]): ParsedArgs {
  const mode: Mode = argv.includes('--apply') ? 'apply' : 'dry-run' // default safe

  const stageArg = argv.find((a) => a.startsWith('--stage='))?.slice('--stage='.length)
  // Fail-closed: an unknown/invalid --stage falls back to the safe default
  // rather than crashing or writing a bogus value.
  const stage = (stageArg && (VALID_STAGES as string[]).includes(stageArg)
    ? (stageArg as PlateStage)
    : DEFAULT_STAGE)

  return { mode, stage }
}

export async function runBackfill(
  prisma: Pick<PrismaClient, 'plate'>,
  mode: Mode,
  stage: PlateStage = DEFAULT_STAGE,
): Promise<BackfillResult> {
  // 1. Count plates with no stage (not soft-deleted).
  const matchedCount = await prisma.plate.count({
    where: { stageFor: null, deletedAt: null },
  })

  if (matchedCount === 0) {
    return { mode, stage, matchedCount, updatedCount: 0, remainingCount: 0 }
  }

  if (mode === 'dry-run') {
    // Show a small sample so the operator can eyeball the rows (name +
    // createdAt range) before committing.
    const sample = await prisma.plate.findMany({
      where: { stageFor: null, deletedAt: null },
      select: {
        id: true,
        userId: true,
        babyProfileId: true,
        name: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })

    return { mode, stage, matchedCount, updatedCount: 0, remainingCount: matchedCount, sample }
  }

  // 2. Apply: stamp all NULL-staged plates in one statement.
  // updateMany is a single SQL UPDATE; safe under concurrent writes because
  // we filter on the same predicate we just counted.
  const updateResult = await prisma.plate.updateMany({
    where: { stageFor: null, deletedAt: null },
    data: { stageFor: stage },
  })

  // 3. Self-verify: re-count NULL plates. Should be 0.
  const remainingCount = await prisma.plate.count({
    where: { stageFor: null, deletedAt: null },
  })

  if (remainingCount !== 0) {
    // Fail loud: a non-zero count means a concurrent writer inserted a
    // NULL-staged plate mid-run, or the predicate is wrong. Never claim
    // success silently.
    throw new Error(
      `[backfill] self-check failed: ${remainingCount} NULL-stage plates remain after the update. ` +
        `Inspect concurrent writes or re-run the script.`,
    )
  }

  return {
    mode,
    stage,
    matchedCount,
    updatedCount: updateResult.count,
    remainingCount,
  }
}

function formatSampleRow(row: NonNullable<BackfillResult['sample']>[number]): string {
  return (
    `  - id=${row.id}  user=${row.userId}  baby=${row.babyProfileId ?? '∅'}  ` +
    `name="${row.name}"  createdAt=${row.createdAt.toISOString()}`
  )
}

async function main(): Promise<void> {
  const { mode, stage } = parseArgs(process.argv.slice(2))
  const prisma = new PrismaClient()
  try {
    console.log(`[backfill] mode=${mode} stage=${stage}`)
    const result = await runBackfill(prisma, mode, stage)

    console.log(
      `[backfill] Plate rows with stageFor=NULL (not soft-deleted): ${result.matchedCount}`,
    )

    if (result.matchedCount === 0) {
      console.log('[backfill] nothing to do. ✓')
      return
    }

    if (mode === 'dry-run') {
      if (result.sample && result.sample.length > 0) {
        console.log(`[backfill] sample (most recent ${result.sample.length}):`)
        for (const row of result.sample) {
          console.log(formatSampleRow(row))
        }
      }
      console.log(
        `[backfill] dry-run: no rows updated. Re-run with --apply to stamp them ${stage}.`,
      )
      return
    }

    console.log(`[backfill] updated ${result.updatedCount} rows (NULL → ${stage}). ✓`)
  } finally {
    await prisma.$disconnect()
  }
}

const isMainModule =
  process.argv[1] !== undefined &&
  fileURLToPath(import.meta.url) === resolve(process.argv[1])

if (isMainModule) {
  main().catch((err) => {
    console.error('[backfill] failed:', err)
    process.exit(1)
  })
}
