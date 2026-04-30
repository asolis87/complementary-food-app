# Design: diary-day-centric-redesign

> **Scope**: technical depth for the locked decisions D1–D9. Requirements come from `spec.md`, motivation from `proposal.md`. This document does NOT redebate decisions.

---

## 1. Data model (Prisma)

Schema diff against `prisma/schema.prisma`:

```prisma
// ==========================================
// MODIFIED: ReactionType — strip clinical values
// ==========================================
enum ReactionType {
  LIKED
  DISLIKED
  NEUTRAL
  REJECTED
  // REMOVED: ALLERGIC, GAS, RASH
}

// ==========================================
// NEW: Day-level observation enums
// ==========================================
enum StoolType {
  NORMAL
  LOOSE
  HARD
  NONE
}

enum SymptomType {
  ALLERGY_SUSPECT
  RASH
  GAS
  VOMITING
  FEVER
}

// ==========================================
// NEW: DayObservation — one row per (baby, date)
// ==========================================
model DayObservation {
  id            String        @id @default(cuid())
  babyProfileId String
  date          DateTime      @db.Date
  stool         StoolType?
  symptoms      SymptomType[] // PostgreSQL native array
  notes         String?
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  babyProfile BabyProfile @relation(fields: [babyProfileId], references: [id], onDelete: Cascade)

  @@unique([babyProfileId, date])
  @@index([babyProfileId, date])
}
```

`BabyProfile` gets a back-relation:

```prisma
model BabyProfile {
  // ... existing fields
  dayObservations DayObservation[]
}
```

Notes:
- `symptoms` uses `SymptomType[]` (Postgres array of enum), not a join table — D3 locked.
- Unique `(babyProfileId, date)` enforces D1.
- `onDelete: Cascade` removes orphan observations when a baby profile is hard-deleted (BabyProfile uses soft delete via `deletedAt`, so cascade only fires on physical deletion).
- Same `@db.Date` as `FoodLog.date` to keep date arithmetic identical.

---

## 2. Migration SQL — exact PostgreSQL DDL

PostgreSQL cannot drop enum values directly. The migration uses rename-and-recreate with a `USING` clause that nulls obsolete values (REQ-A3, D4).

```sql
-- ============================================================
-- 1. Trim ReactionType: drop ALLERGIC | GAS | RASH, add REJECTED
-- ============================================================
ALTER TYPE "ReactionType" RENAME TO "ReactionType_old";

CREATE TYPE "ReactionType" AS ENUM ('LIKED', 'DISLIKED', 'NEUTRAL', 'REJECTED');

ALTER TABLE "FoodLog"
  ALTER COLUMN "reaction" DROP DEFAULT,
  ALTER COLUMN "reaction" TYPE "ReactionType"
  USING (
    CASE "reaction"::text
      WHEN 'LIKED'    THEN 'LIKED'::"ReactionType"
      WHEN 'DISLIKED' THEN 'DISLIKED'::"ReactionType"
      WHEN 'NEUTRAL'  THEN 'NEUTRAL'::"ReactionType"
      ELSE NULL
    END
  );

DROP TYPE "ReactionType_old";

-- ============================================================
-- 2. Create new enums
-- ============================================================
CREATE TYPE "StoolType"   AS ENUM ('NORMAL', 'LOOSE', 'HARD', 'NONE');
CREATE TYPE "SymptomType" AS ENUM ('ALLERGY_SUSPECT', 'RASH', 'GAS', 'VOMITING', 'FEVER');

-- ============================================================
-- 3. Create DayObservation table
-- ============================================================
CREATE TABLE "DayObservation" (
  "id"            TEXT          NOT NULL,
  "babyProfileId" TEXT          NOT NULL,
  "date"          DATE          NOT NULL,
  "stool"         "StoolType",
  "symptoms"      "SymptomType"[] NOT NULL DEFAULT ARRAY[]::"SymptomType"[],
  "notes"         TEXT,
  "createdAt"     TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP(3)  NOT NULL,

  CONSTRAINT "DayObservation_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "DayObservation_babyProfileId_fkey"
    FOREIGN KEY ("babyProfileId") REFERENCES "BabyProfile"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "DayObservation_babyProfileId_date_key"
  ON "DayObservation" ("babyProfileId", "date");

CREATE INDEX "DayObservation_babyProfileId_date_idx"
  ON "DayObservation" ("babyProfileId", "date");
```

Apply via `prisma migrate dev --name diary_day_centric_redesign`. No backfill needed — pre-launch.

---

## 3. API surface (Fastify)

All endpoints require `requireAuth` preHandler (BetterAuth session). All payloads validated via Zod, errors via `reply.code(...).send({ error })` matching diary module convention.

### 3.1 `GET /api/day-observation`

Query: `babyProfileId: string`, `date: YYYY-MM-DD`.

```ts
// Zod
const getQuerySchema = z.object({
  babyProfileId: z.string().cuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

// Response (200)
type GetResponse = DayObservationDTO | null;
```

Status codes: `200` (entity or `null`), `400` (bad query), `401` (no session), `403` (baby not owned by user).

### 3.2 `PUT /api/day-observation` — idempotent upsert

Resolves spec open question on REQ-B1: PUT semantics, always 200, single shape for create and update.

```ts
const upsertBodySchema = z.object({
  babyProfileId: z.string().cuid(),
  date:          z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  stool:         z.nativeEnum(StoolType).nullable().optional(),
  symptoms:      z.array(z.nativeEnum(SymptomType))
                  .max(10, 'Máximo 10 síntomas')
                  .transform((arr) => Array.from(new Set(arr))) // REQ-B3 dedup
                  .optional()
                  .default([]),
  notes:         z.string().max(500).nullable().optional(),
});

// Response (200)
type UpsertResponse = DayObservationDTO;
```

Implementation: `prisma.dayObservation.upsert({ where: { babyProfileId_date: { babyProfileId, date } }, create: {...}, update: {...} })`.

Status codes: `200` (created or updated, indistinguishable per REQ-B1), `400` (Zod fail), `401`, `403`, `422` (semantic violations like > 10 symptoms — surface Zod refinement errors).

### 3.3 `DELETE /api/day-observation`

Query: same as GET.

Status codes: `204` (deleted), `400`, `401`, `403`, `404` (not found — REQ-B4).

### 3.4 `GET /api/diary/range`

Returns logs and observations for a window.

```ts
const rangeQuerySchema = z.object({
  babyProfileId: z.string().cuid(),
  from:          z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  to:            z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
}).refine(
  ({ from, to }) => {
    const days = (Date.parse(to) - Date.parse(from)) / 86_400_000;
    return days >= 0 && days <= 31;
  },
  { message: 'Rango inválido — máximo 31 días, to >= from' },
);

// Response (200)
type RangeResponse = {
  logs:         FoodLogDTO[];
  observations: DayObservationDTO[];
};
```

Status codes: `200`, `400` (invalid range or > 31 days), `401`, `403`.

### 3.5 Existing diary endpoints — no breaking changes

`GET /api/diary`, `POST /api/diary`, `PATCH /api/diary/:id`, `DELETE /api/diary/:id`, `GET /api/diary/food-history` keep their current shape. `GET /api/diary` response is enriched (REQ-B5) to include `observation: DayObservationDTO | null` alongside `logs`.

---

## 4. Suspected food signal — concrete TypeScript

`apps/api/src/modules/diary/diary.utils.ts` — `aggregateFoodHistory` signature change.

```ts
import type { FoodLog, DayObservation, SymptomType } from '@prisma/client';

const SUSPECT_SYMPTOMS: ReadonlySet<SymptomType> = new Set(['ALLERGY_SUSPECT', 'RASH']);

type FoodHistoryItem = {
  foodId:                 string;
  date:                   string; // YYYY-MM-DD
  mealType:               string;
  reaction:               string | null;
  notes:                  string | null;
  hasSuspectedReaction:   boolean; // RENAMED from hasAllergyReaction
};

export function aggregateFoodHistory(
  logs:         readonly FoodLog[],
  observations: readonly DayObservation[],
): FoodHistoryItem[] {
  // Build dateKey -> Set<SymptomType>
  const symptomMap = new Map<string, Set<SymptomType>>();
  for (const obs of observations) {
    const key = toDateKey(obs.date);
    symptomMap.set(key, new Set(obs.symptoms));
  }

  return logs.map((log) => {
    const key      = toDateKey(log.date);
    const daySymps = symptomMap.get(key);
    const suspect  = daySymps
      ? [...SUSPECT_SYMPTOMS].some((s) => daySymps.has(s))
      : false;

    return {
      foodId:               log.foodId,
      date:                 key,
      mealType:             log.mealType,
      reaction:             log.reaction,
      notes:                log.notes,
      hasSuspectedReaction: suspect,
    };
  });
}

function toDateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}
```

Caller (`GET /api/diary/food-history`) fetches both collections in parallel:

```ts
const [logs, observations] = await Promise.all([
  prisma.foodLog.findMany({ where: { babyProfileId, foodId, deletedAt: null } }),
  prisma.dayObservation.findMany({
    where: { babyProfileId, date: { in: logs.map((l) => l.date) } }, // see note
  }),
]);
```

Note: the second query depends on `logs`; in practice fetch logs first, then observations filtered by the resulting date set. The `hasAllergyReaction` field (legacy) MUST NOT appear in any module after this change (REQ-D3).

---

## 5. UI design

### 5.1 `DiaryPage.vue` — restructured tree

```
DiaryPage
├── DayChipSelector            (existing — last 7 days chips)
├── DaySummaryCard
│   ├── meal/food counts        (existing)
│   ├── DayObservationBlock     (new — stool icon + symptom chips + notes preview)
│   └── CTAs: [Registrar observación] [Exportar día ▾]
├── DayDetailSection            (new, expandable — single source of truth for in-page detail AND PDF template)
│   ├── meals grouped by mealType
│   ├── foods + reactions per meal
│   ├── observation block
│   └── per-meal notes + day notes
└── FAB: +                      (existing — add meal)
```

Export menu items: **"Exportar día (PDF)"**, **"Exportar semana (PDF)"**.

Behaviour:
- `[Registrar observación]` opens `DayObservationSheet`.
- `[Exportar día ▾]` opens dropdown menu (uses existing UI primitives if any, otherwise simple absolute-positioned `<ul>`).
- `DayDetailSection` is collapsed by default; "Ver detalle del día" toggles it.

### 5.2 `DayObservationSheet.vue` (new)

- Bottom sheet pattern, matches `AddMealModal.vue` look-and-feel.
- Three sections:
  - **Stool**: 4 radio chips for `NORMAL | LOOSE | HARD | NONE`. Single-select, optional (clear by tapping the active chip).
  - **Symptoms**: multi-select chips for `ALLERGY_SUSPECT | RASH | GAS | VOMITING | FEVER`. Max 10 (enforced client + server).
  - **Notes**: `<textarea maxlength="500">` with live counter.
- `Save` button → `PUT /api/day-observation`. On 200, close sheet and refresh card.
- Footer link `Quitar observación del día` → `DELETE`. Visible only when an observation already exists.

Props:
```ts
defineProps<{
  babyProfileId: string;
  date:          string; // YYYY-MM-DD
  initial:       DayObservationDTO | null;
}>();
const emit = defineEmits<{ saved: [DayObservationDTO]; deleted: []; close: [] }>();
```

### 5.3 `DayDetailSection.vue` (new)

Pure presentational. Reused by:
1. The in-page expandable section in `DiaryPage.vue`.
2. The off-screen PDF template (`pdfTemplate.vue` slots it).

```ts
defineProps<{
  logs:        FoodLogDTO[];
  observation: DayObservationDTO | null;
  babyProfile: BabyProfileDTO;
  date:        string; // YYYY-MM-DD
}>();
```

No emits, no store access. Stateless.

---

## 6. PDF export module

Path: `apps/web/src/modules/diary/export/`. The whole module is **dynamically imported** to keep jspdf out of the initial bundle.

### 6.1 Files

| File | Role |
|------|------|
| `pdfTemplate.vue` | Vue SFC rendering A4-sized layout. Mounted in a hidden container, captured by html2canvas. |
| `exportDayPdf.ts` | `async function exportDayPdf(opts)` — fetches data, mounts template off-screen, captures, generates PDF, triggers `.save()`, unmounts. |
| `exportWeekPdf.ts` | Iterates 7 days; one `addPage()` per day. Days without data render the "Sin registros" placeholder (REQ-C2). |
| `useDiaryExport.ts` | Composable wiring buttons → these functions, exposes `loading` + `error`. |

### 6.2 Hard constraints (D8, REQ-C4)

- NO `position: fixed` / `position: sticky`
- NO `transform: translate(...)` / `transform: scale(...)`
- System font stack only:
  ```css
  font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  ```
- Symptoms icons: Unicode emoji directly in text (e.g. 🤧 for RASH, 💨 for GAS). NO inline SVG.
- Width: A4 portrait = **794px @ 96dpi**.
- Off-screen mount container:
  ```html
  <div style="position: absolute; left: -9999px; top: 0; width: 794px; background: #fff;">
    <PdfTemplate ... />
  </div>
  ```
- jspdf init:
  ```ts
  const pdf = new jsPDF({ format: 'a4', orientation: 'portrait', unit: 'pt' });
  ```
- html2canvas options:
  ```ts
  const canvas = await html2canvas(node, {
    useCORS:         true,
    scale:           2,
    backgroundColor: '#ffffff',
    windowWidth:     794,
  });
  ```
- File naming:
  - Day: `bitacora-{babyName}-{YYYY-MM-DD}.pdf`
  - Week: `bitacora-{babyName}-{from}_a_{to}.pdf`
  - babyName slugified (lowercase, ASCII, hyphens).

### 6.3 v1 limitation (documented, NOT solved)

A single day whose rendered detail exceeds 1 A4 page will overflow visually — content past 1123pt is clipped. Multi-page splitting per day is out of scope for v1. Most days fit easily (3–5 meals).

### 6.4 Data flow

```
useDiaryExport.exportDay(date)
  └─> exportDayPdf({ babyProfile, date, logs, observation })
        ├─ create off-screen mount node
        ├─ render PdfTemplate via createApp(...).mount(node)
        ├─ await nextTick()
        ├─ html2canvas(node, opts) -> canvas
        ├─ pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, A4w, A4h)
        ├─ pdf.save(filename)
        └─ unmount + remove node
```

For week export: load via `GET /api/diary/range`, iterate days in chronological order, `pdf.addPage()` between days.

---

## 7. Pinia store changes

`apps/web/src/shared/stores/diaryStore.ts`:

```ts
// new state
const observationsByDate = ref<Map<string, DayObservation>>(new Map());

// new actions
async function fetchObservation(date: string): Promise<DayObservation | null> { /* GET */ }
async function upsertObservation(payload: UpsertPayload): Promise<DayObservation> { /* PUT */ }
async function deleteObservation(date: string): Promise<void> { /* DELETE */ }
async function fetchRange(from: string, to: string): Promise<{ logs: FoodLog[]; observations: DayObservation[] }> { /* GET /api/diary/range */ }

// modified: setSelectedDate now parallelizes
async function setSelectedDate(date: string) {
  selectedDate.value = date;
  await Promise.all([fetchEntries(date), fetchObservation(date)]);
}
```

`fetchEntries(date)` keeps its current contract for backward compatibility.

---

## 8. Module structure (screaming architecture)

The diary API module currently uses a flat structure (`diary.routes.ts`, `diary.schemas.ts`, `diary.utils.ts`, `diary.utils.test.ts`). Match it.

### 8.1 API — recommendation: separate files per responsibility

Recommended (clearer reviewability, smaller diffs):

| File | Purpose |
|------|---------|
| `apps/api/src/modules/diary/diary.routes.ts` | Existing CRUD + food-history (modify response shape per REQ-B5). |
| `apps/api/src/modules/diary/diary.schemas.ts` | Existing Zod schemas (trim ReactionType). |
| `apps/api/src/modules/diary/diary.utils.ts` | `aggregateFoodHistory` signature change (Section 4). |
| `apps/api/src/modules/diary/dayObservation.routes.ts` | **NEW** — GET / PUT / DELETE `/api/day-observation`. |
| `apps/api/src/modules/diary/dayObservation.schemas.ts` | **NEW** — Zod for upsert / query / DTO. |
| `apps/api/src/modules/diary/range.routes.ts` | **NEW** — GET `/api/diary/range`. |
| `apps/api/src/modules/diary/diary.utils.test.ts` | Updated tests covering both logs and observations. |
| `apps/api/src/modules/diary/dayObservation.routes.test.ts` | **NEW** integration tests (PUT idempotency, DELETE 404). |

Plugin registration: existing diary plugin imports the three route files and `register`s them under their respective prefixes.

### 8.2 Web — files

```
apps/web/src/modules/diary/
├── DiaryPage.vue                              (modified)
├── components/
│   ├── AddMealModal.vue                       (modified — drop ALLERGIC/GAS/RASH)
│   ├── EditLogModal.vue                       (modified — same)
│   ├── DayObservationSheet.vue                (new)
│   ├── DayObservationBlock.vue                (new — small block in summary card)
│   └── DayDetailSection.vue                   (new — shared by page + PDF)
└── export/
    ├── pdfTemplate.vue                        (new)
    ├── exportDayPdf.ts                        (new)
    ├── exportWeekPdf.ts                       (new)
    └── useDiaryExport.ts                      (new)
```

Shared types updated in `packages/shared/src/types/diary.ts`. Legacy `Reaction` type removed from `packages/shared/src/types/user.ts` (D9).

---

## 9. Test strategy (high-level)

Tasks phase will detail per-file test cases. High-level coverage targets:

- **Unit (Vitest, API)**:
  - `aggregateFoodHistory` — both branches of `hasSuspectedReaction` (suspect symptom present / absent / no observation).
  - Zod schemas for `DayObservation` upsert: dedup, max 10 symptoms, missing fields default correctly.
  - Range endpoint Zod refinement: 0 days, 31 days (pass), 32 days (fail), `to < from` (fail).

- **Integration (Vitest + supertest or fastify.inject, API)**:
  - PUT `/api/day-observation` idempotency: two consecutive PUTs result in one row, second response reflects updated values.
  - DELETE 404 path.
  - GET `/api/diary` includes `observation: null` when none exists.

- **Manual smoke (web)**:
  - Export day PDF on iOS Safari (real device) — no clipped content, emojis render.
  - Export week PDF on Chrome desktop — 7 pages, days without data show "Sin registros".

---

## 10. Risks and mitigations

| Risk | Mitigation |
|------|-----------|
| iOS Safari html2canvas quirks (sticky headers, transforms, SVG glitches) | Plain block layout enforced; system font stack; Unicode emoji instead of SVG; `windowWidth: 794` pinned. |
| jspdf bundle size (~300KB gzipped) | Export module uses dynamic `import()` from `useDiaryExport.ts`, kept out of initial bundle. |
| Range endpoint abused for huge windows | Server-side Zod refinement caps `to - from` at 31 days; returns 400 otherwise. |
| Orphan `DayObservation` rows on baby deletion | `onDelete: Cascade` on the relation; aligns with FoodLog cascade behaviour. |
| `ReactionType` enum drop loses historical data | Accepted by D4 (pre-launch, near-zero data); migration USING-clause nulls obsolete values explicitly per REQ-A3. |
| PDF day overflow > 1 A4 page | Documented v1 limitation; multi-page split deferred. Most days fit. |
| Plate builder breakage from `hasAllergyReaction` rename | Coordinated rename in same PR; spec REQ-D3 enforces zero residual occurrences. |
| Tests hardcoding `ALLERGIC` / `RASH` / `GAS` (`diary.utils.test.ts`) | Updated as part of the apply phase, covered by tasks. |

---

## Decisions deferred to tasks phase

- Exact icon mapping (which emoji codepoint per `SymptomType`).
- Color palette for stool chips and symptom chips (use existing tokens).
- Exact copy for "Sin registros" placeholder and disclaimer footer.
