# Exploration — PR-12 (T-05-08): PDF export with stage (Capability D, REQ-D1)

> Read-only reality-check. Base: `release/etapa-10-23-meses` @ 00312e3.
> Engram mirror: `sdd/etapa-10-23-meses/pr12-explore`.

## Reality vs tasks.md (STALE 2026-06-18)

T-05-08 assumes a **backend PDF export route**. That is WRONG. Menu export is a
**client-side PNG screenshot via `html2canvas`** — there is no server-side PDF
endpoint anywhere in `apps/api`. The spec's phrase "PDF export" is colloquial.

## Current export architecture (evidence)

- **Trigger**: `apps/web/src/modules/menus/MenuWeekPage.vue` (export button; baby's
  `birthDate` is available here via `profileStore.activeProfile`).
- **Mechanism**: `apps/web/src/modules/menus/components/MenuExportFrame.vue:162-180`
  — dynamic `import('html2canvas')` → `html2canvas(exportRef.value)` →
  `canvas.toDataURL('image/png')` → browser download. PNG, not PDF.
- **Props today**: `MenuExportFrame` `defineProps` (`:137`) receives `babyName`
  (`:141`) and renders it (`:12` `<p v-if="babyName">`). It does **NOT** receive or
  render any stage / age info.
- **Tier**: menu page is wrapped in `<TierGate required-tier="PRO">`
  (`MenuWeekPage:2`). The export button has no extra tier check → every export is a
  PRO render. No FREE user reaches this page.
- **Watermark myth**: the spec's "watermark already exists" out-of-scope note is
  WRONG for menu export. `MenuExportFrame` has a hardcoded PRO badge (`:8`) but no
  tier-conditional watermark. `PlateExportFrame.vue` (different component) has a FREE
  watermark, but menu export is PRO-only. Nothing to touch here.

## Helpers already shipped (PR-7 / PR-8) — all exported, unused in export flow

- `getSuggestedStageForAge(ageMonths)` — `packages/shared/src/types/plate.ts:41`
- `PLATE_STAGE_LABELS` (es-MX) — `packages/shared/src/types/plate.ts:19`
- `getAgeMonths(birthDate, referenceDate?)` — `packages/shared/src/utils/date.ts:11`
  (invalid-date guard → returns 0)

## Gap analysis (what REQ-D1 actually needs)

REQ-D1 wants the export to show the baby's **current stage**, derived from
`babyProfile.ageMonths` (NOT the plates' `stageFor` tags — that's a separate plate
tagging feature). Scenario copy: `"Menú semanal — Tomás — 13-23 meses"` (single line,
em-dashes).

Missing: derive `babyAgeMonths` + `babyStageLabel` in `MenuWeekPage.vue` and pass a
new `stageLabel` prop to `MenuExportFrame.vue`, rendered next to `babyName`. That's it.

## Candidate approaches

### A — Minimal prop-passing (RECOMMENDED)
Add 2 computed props in `MenuWeekPage.vue` (`babyAgeMonths` via `getAgeMonths`,
`babyStageLabel` via `getSuggestedStageForAge` + `PLATE_STAGE_LABELS`), pass a
`stageLabel` prop to `MenuExportFrame`, render it in the header. Same pattern as the
existing `babyName` prop.
- **Layer**: web only. **LOC**: ~15-20 prod + ~12 test ≈ 30. No backend, no Prisma, no
  schema. Well under 400, no `size:exception`.
- **Edge case**: guard `v-if="babyAgeMonths > 0"` so an invalid birthDate omits the
  label instead of showing a wrong stage.

### B — Backend PDF route (puppeteer/pdfkit) — NOT RECOMMENDED
~500+ LOC, contradicts the existing client-side export architecture, no user demand,
needs `size:exception` + multi-PR split.

### C — Unified backend export service (plate + menu) — NOT RECOMMENDED
~1000+ LOC, extreme scope creep, belongs in its own change.

## Open questions / product decisions

None blocking if we accept the defaults below (all backed by REQ-D1 scenario):
- Stage = baby's **current** stage (from birthDate), not plate `stageFor`.
- Render as a **single line** with em-dashes (`Menú semanal — Tomás — 13-23 meses`).
- **Omit** the stage label when `babyAgeMonths === 0` (invalid/missing birthDate).
- Export stays PRO (inherited from the page's `TierGate`); no watermark work.

## Risks

1. **Spec mislabeling** (LOW): spec says "PDF" but export is PNG. If stakeholders
   truly require a PDF *file*, Approach A won't satisfy → Approach B. No prior user
   complaints about PNG.
2. **Missing birthDate** (LOW): `getAgeMonths` returns 0; mitigated by the `v-if` guard.
3. **Stale tasks.md** (addressed): T-05-08 assumes a backend route that doesn't exist;
   this exploration corrects it.

## Recommended next step

`sdd-apply` PR-12 with **Approach A**, T-05-08 only, ~1 commit (~30 LOC). All helpers
already exist. No proposal/design phase needed given the trivial, well-scoped surface —
confirm with user first.
