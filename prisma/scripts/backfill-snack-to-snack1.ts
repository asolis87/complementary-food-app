/**
 * Backfill: MealType.SNACK → MealType.SNACK_1
 *
 * Context
 * ────────
 * Before PR-1, the diary's AddMealModal/EditLogModal emitted
 * `MealType.SNACK` (the legacy enum value) for the "Colación" picker.
 * The age-aware dashboard (PR-1) renders slots via
 * `getMealSlotsForAge(ageMonths)`, which returns SNACK_1 / SNACK_2 —
 * never SNACK. So any historical FoodLog row with `mealType = 'SNACK'`
 * is invisible to the dashboard's "Today's logs" card.
 *
 * PR-1.7 fixed the picker going forward (the modal now derives its
 * option list from `getMealSlotsForAge(ageMonths)`, so it can no longer
 * emit SNACK). This script fixes the **history**.
 *
 * Why SNACK_1 (not SNACK_2)
 * ─────────────────────────
 * Every row that has `mealType = 'SNACK'` was logged before the 5-meal
 * stage existed in the product (PR-1 added the SNACK_2 slot to the
 * domain), and the legacy UI offered only one colación option.
 * Therefore every historical SNACK row represents a single colación,
 * which is what SNACK_1 means in the new model. Re-typing to SNACK_2
 * would be wrong; splitting by `time` would be a heuristic on a
 * wall-clock string with no timezone (per scout §5).
 *
 * Why a script and not a migration
 * ─────────────────────────────────
 * The legacy `SNACK` enum value is kept in `prisma/schema.prisma` —
 * no client emits it after PR-1.7, but a Prisma migration that drops
 * an enum value is irreversible without a fresh dump + restore. A
 * idempotent row-rewrite script lets us keep the enum intact (forward
 * compat with any old client in the wild) while still fixing the
 * user's data.
 *
 * Usage
 * ─────
 *   # 1. Inspect what would change. Safe, no writes.
 *   npx tsx prisma/scripts/backfill-snack-to-snack1.ts --dry-run
 *
 *   # 2. Apply. Idempotent — re-running is a no-op once count = 0.
 *   npx tsx prisma/scripts/backfill-snack-to-snack1.ts --apply
 *
 * Reversibility
 * ─────────────
 * A naive `prisma.foodLog.updateMany({ where: { mealType: 'SNACK_1' }, data: { mealType: 'SNACK' } })`
 * would conflate today's SNACK_1 logs (mid-morning colación for ≥13m
 * babies, which are legitimate) with the backfilled ones, so it is
 * **not** a safe rollback. The only safe rollback is to restore from
 * a pre-backfill DB dump. Always snapshot the DB before running with
 * --apply.
 */

// ponytail: this exists. The script is small but the prod-affecting
// rewrite is the kind of thing that needs a paper trail in the
// comment block above, not in a separate wiki page. Reading the
// preamble is the only way to know which enum value maps to which.

import { MealType, PrismaClient } from '@prisma/client'

type Mode = 'dry-run' | 'apply'

function parseArgs(argv: readonly string[]): Mode {
  if (argv.includes('--apply')) return 'apply'
  return 'dry-run' // default safe
}

async function runBackfill(prisma: PrismaClient, mode: Mode): Promise<void> {
  console.log(`[backfill] mode=${mode}`)

  // 1. Count rows that match the legacy value.
  const count = await prisma.foodLog.count({
    where: { mealType: MealType.SNACK, deletedAt: null },
  })
  console.log(`[backfill] foodLog rows with mealType=SNACK (not soft-deleted): ${count}`)

  if (count === 0) {
    console.log('[backfill] nothing to do. ✓')
    return
  }

  if (mode === 'dry-run') {
    // Show a small sample so the operator can eyeball whether the rows
    // look like the buggy 4-meal-era logs (date range, babyProfileId
    // distribution) and not, say, today's writes.
    const sample = await prisma.foodLog.findMany({
      where: { mealType: MealType.SNACK, deletedAt: null },
      select: {
        id: true,
        userId: true,
        babyProfileId: true,
        date: true,
        time: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })
    console.log(`[backfill] sample (most recent ${sample.length}):`)
    for (const row of sample) {
      console.log(
        `  - id=${row.id}  user=${row.userId}  baby=${row.babyProfileId}  ` +
          `date=${row.date.toISOString().slice(0, 10)}  time=${row.time ?? '∅'}  ` +
          `createdAt=${row.createdAt.toISOString()}`
      )
    }
    console.log('[backfill] dry-run: no rows updated. Re-run with --apply to commit.')
    return
  }

  // 2. Apply: rewrite all matching rows in one statement.
  // updateMany is a single SQL UPDATE; safe under concurrent writes
  // because we filter on the same predicate we just counted.
  const result = await prisma.foodLog.updateMany({
    where: { mealType: MealType.SNACK, deletedAt: null },
    data: { mealType: MealType.SNACK_1 },
  })
  console.log(`[backfill] updated ${result.count} rows (SNACK → SNACK_1). ✓`)

  // 3. Self-verify: re-count. Should be 0.
  const remaining = await prisma.foodLog.count({
    where: { mealType: MealType.SNACK, deletedAt: null },
  })
  if (remaining !== 0) {
    // ponytail: this is the kind of fail-loud that matters. If the
    // count after the update is non-zero, either a concurrent writer
    // slipped a SNACK in between, or the predicate is wrong. Either
    // way, do not silently claim success.
    throw new Error(
      `[backfill] self-check failed: ${remaining} SNACK rows remain after the update. ` +
        `Inspect concurrent writes or re-run the script.`
    )
  }
}

async function main(): Promise<void> {
  const mode = parseArgs(process.argv.slice(2))
  const prisma = new PrismaClient()
  try {
    await runBackfill(prisma, mode)
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((err) => {
  console.error('[backfill] failed:', err)
  process.exit(1)
})
