# Actionable Dashboard — Full Specification

**Change**: dashboard-implementation
**Status**: specs complete
**Date**: 2026-05-04

---

## Purpose

Provides authenticated users with an actionable dashboard that aggregates data from the diary, foods, profiles, and allergens modules into a single view, enabling quick meal registration, personalized food suggestions, allergen alerts, and a nutritional balance insight.

---

## Data Model

### TypeScript Interfaces

```typescript
/** Consolidated dashboard response — GET /api/dashboard */
interface DashboardData {
  baby: BabyContext
  userTier: 'FREE' | 'PRO'
  todayLogs: TodayLog[]
  suggestedFoods: SuggestedFood[]
  pendingAllergens: AllergenAlert[]
  roadmapProgress: RoadmapProgress[]
  weeklyBalance: BalanceInsight
}

/** Baby context shown in the header */
interface BabyContext {
  id: string
  name: string
  ageInMonths: number
  daysInAC: number
}

/** A single food log entry for today */
interface TodayLog {
  id: string
  mealType: MealType
  time: string | null          // HH:mm
  foodId: string
  foodName: string
  foodGroup: FoodGroup
  reaction: ReactionType | null
  notes: string | null
}

/** A food suggestion based on age + history */
interface SuggestedFood {
  foodId: string
  name: string
  group: FoodGroup
  ageMonths: number
  benefit: string              // e.g. "Alto en proteína"
  isAllergen: boolean
  allergenType: string | null
  status: 'pending' | 'tried' | 'rejected'
}

/** A pending allergen to introduce */
interface AllergenAlert {
  allergenKey: string          // matches Food.allergenType
  nameEs: string               // e.g. "Huevo"
  icon: string                  // emoji
  minAgeMonths: number
  urgency: 'normal' | 'closing_window'
}

/** Progress per food group */
interface RoadmapProgress {
  group: FoodGroup
  labelEs: string
  triedCount: number
  totalCount: number
  percentage: number            // 0-100
  foods: RoadmapFood[]
}

interface RoadmapFood {
  foodId: string
  name: string
  status: 'tried' | 'pending' | 'rejected'
}

/** A/L balance insight for the past week */
interface BalanceInsight {
  label: 'balanced' | 'astringent' | 'laxative'
  labelEs: string               // e.g. "Mayormente equilibrada"
  severity: 'green' | 'yellow' | 'red'
  tip: string                   // Rotating tip from curated list
}

/** Meal slots for quick registration */
interface MealSlot {
  mealType: MealType
  label: string                 // e.g. "Desayuno"
  icon: string                  // emoji
  isRegistered: boolean
  registeredTime: string | null // HH:mm or null
  foodCount: number
}
```

---

## API Endpoints

### REQ-DASH-01: GET /api/dashboard

Returns all dashboard data in a single consolidated call.

| Field | Value |
|-------|-------|
| Method | `GET` |
| Path | `/api/dashboard` |
| Auth | Required (Bearer) |
| Query | `babyProfileId` (required, CUID) |
| Cache TTL | 60 segundos (stale-while-revalidate) |
| 200 | `{ data: DashboardData }` |
| 400 | `{ error: 'Bad Request', issues: [...] }` — invalid babyProfileId |
| 401 | `{ error: 'Unauthorized' }` |
| 403 | `{ error: 'Forbidden' }` — profile does not belong to user |

The endpoint MUST aggregate data from `foods`, `diary`, `profiles`, and `allergen` sources into a single response to avoid N+1 frontend calls.

**Example response:**

```json
{
  "data": {
    "baby": {
      "id": "clx...",
      "name": "Mateo",
      "ageInMonths": 8,
      "daysInAC": 52
    },
    "userTier": "PRO",
    "todayLogs": [
      {
        "id": "clx_log1",
        "mealType": "BREAKFAST",
        "time": "08:30",
        "foodId": "clx_food1",
        "foodName": "Manzana rallada",
        "foodGroup": "FRUIT",
        "reaction": "LIKED",
        "notes": null
      }
    ],
    "suggestedFoods": [
      {
        "foodId": "clx_food10",
        "name": "Huevo",
        "group": "PROTEIN",
        "ageMonths": 8,
        "benefit": "Alto en proteína",
        "isAllergen": true,
        "allergenType": "huevo",
        "status": "pending"
      }
    ],
    "pendingAllergens": [
      {
        "allergenKey": "huevo",
        "nameEs": "Huevo",
        "icon": "🥚",
        "minAgeMonths": 6,
        "urgency": "normal"
      }
    ],
    "roadmapProgress": [
      {
        "group": "VEGETABLE",
        "labelEs": "Verduras",
        "triedCount": 6,
        "totalCount": 10,
        "percentage": 60,
        "foods": [
          { "foodId": "clx_v1", "name": "Zanahoria", "status": "tried" },
          { "foodId": "clx_v2", "name": "Brócoli", "status": "tried" },
          { "foodId": "clx_v3", "name": "Espinaca", "status": "pending" }
        ]
      }
    ],
    "weeklyBalance": {
      "label": "balanced",
      "labelEs": "Mayormente equilibrada",
      "severity": "green",
      "tip": "La avena es suave para el estómago."
    }
  }
}
```

### REQ-DASH-02: GET /api/dashboard/suggestions

Returns food suggestions for the baby's profile.

| Field | Value |
|-------|-------|
| Method | `GET` |
| Path | `/api/dashboard/suggestions` |
| Auth | Required (Bearer) |
| Query | `babyProfileId` (required), `limit` (optional, default 3, max 10) |
| Cache TTL | 24 horas |
| 200 | `{ data: SuggestedFood[] }` |
| 400 | Invalid query params |
| 403 | Profile not owned by user |

**Selection logic (REQ-DASH-02-BIZ):**
1. Filter foods where `ageMonths <= baby.ageInMonths`
2. Exclude foods already tried in the last 30 days (FoodLog with non-null reaction)
3. Prioritize: allergens pending > groups with less variety > random
4. Limit to `limit` results

### REQ-DASH-03: GET /api/dashboard/allergens

Returns allergens not yet introduced for the baby.

| Field | Value |
|-------|-------|
| Method | `GET` |
| Path | `/api/dashboard/allergens` |
| Auth | Required (Bearer, minimum PRO tier) |
| Query | `babyProfileId` (required) |
| Cache TTL | 1 hora |
| 200 | `{ data: AllergenAlert[] }` |
| 403 | Profile not owned, or FREE tier |
| Empty | `[]` if baby < 6 months (no allergen window yet) |

**Filtering logic:**
- Only return if `baby.ageInMonths >= 6`
- Exclude allergen types already found in FoodLog with `reaction NOT IN (REJECTED)` for this baby
- Set `urgency: 'closing_window'` when `baby.ageInMonths >= 10`

### REQ-DASH-04: GET /api/dashboard/roadmap

Returns food progress grouped by category.

| Field | Value |
|-------|-------|
| Method | `GET` |
| Path | `/api/dashboard/roadmap` |
| Auth | Required (Bearer) |
| Query | `babyProfileId` (required) |
| Cache TTL | 15 minutos |
| 200 | `{ data: RoadmapProgress[] }` |
| 403 | Profile not owned by user |

**Progress calculation:**
- `totalCount` = count of foods in this group where `ageMonths <= baby.ageInMonths`
- `triedCount` = count of those foods that appear in FoodLog for this baby (unique foods, regardless of reaction)
- `percentage` = `Math.round((triedCount / totalCount) * 100)`, or 0 if totalCount is 0
- `foods` array: top 5 by relevance (pending first, then tried-by-date DESC)

### REQ-DASH-05: GET /api/dashboard/today

Returns today's food log entries grouped by meal type.

| Field | Value |
|-------|-------|
| Method | `GET` |
| Path | `/api/dashboard/today` |
| Auth | Required (Bearer) |
| Query | `babyProfileId` (required) |
| Cache TTL | No cache (real-time — user may be actively registering) |
| 200 | `{ data: { logs: TodayLog[], mealSlots: MealSlot[] } }` |
| 403 | Profile not owned by user |

**Meal slot population:**
- Iterate over `[BREAKFAST, LUNCH, DINNER, SNACK]`
- For each, find matching FoodLog entries for today
- `isRegistered = true` if at least one log exists for that mealType
- `registeredTime` = earliest time from those logs
- `foodCount` = count of logs for that mealType

### REQ-DASH-06: GET /api/dashboard/balance

Returns the A/L balance insight for the past 7 days.

| Field | Value |
|-------|-------|
| Method | `GET` |
| Path | `/api/dashboard/balance` |
| Auth | Required (Bearer) |
| Query | `babyProfileId` (required) |
| Cache TTL | 1 hora |
| 200 | `{ data: BalanceInsight }` |
| 403 | Profile not owned by user |

**Balance calculation:**
- Fetch all FoodLog entries for the baby in the last 7 days
- Use `calculateBalance()` from `@pakulab/shared` to compute score
- Map score to `label` using existing thresholds (BALANCE_THRESHOLD = 0.34, IMBALANCE_THRESHOLD = 0.67)
- If no logs exist, return `{ label: 'balanced', labelEs: 'Sin datos suficientes', severity: 'green', tip: <random tip> }`
- Tip is selected randomly from the curated tip list on each request (rotation per page load)

---

## Frontend Components

### REQ-DASH-07: DashboardPage.vue

The main page component that orchestrates all dashboard cards.

| Aspect | Detail |
|--------|--------|
| Route | `/dashboard` (requires auth) |
| Layout | Bento Grid 3-col on desktop, stack on mobile |
| Stores | `useDashboardStore` (Pinia) |
| Composables | `useBabyAge()`, `useTimeGreeting()` |

**Props:** none (uses route params + store)

**Events emitted:** none (orchestrator)

**Local state:** loading indicator, error state

**Store usage:** loads all dashboard data on mount via `useDashboardStore().fetchDashboard(babyProfileId)`

### REQ-DASH-08: DashboardHeader.vue

Displays user greeting with baby context.

| Aspect | Detail |
|--------|--------|
| Props | `baby: BabyContext`, `userTier: 'FREE' \| 'PRO'` |
| Events | `@switch-baby` (emitted when dropdown changes) |
| Local state | none |
| Composables | `useTimeGreeting()` — returns emoji + greeting based on hour |

Renders: `🌅 Hola, {user.name} · 👶 {baby.name} ({baby.ageInMonths} meses) · {baby.daysInAC} días en AC [Pro]`

### REQ-DASH-09: TodayLogsCard.vue

Shows today's meal registrations with quick-edit capability.

| Aspect | Detail |
|--------|--------|
| Props | `logs: TodayLog[]`, `mealSlots: MealSlot[]` |
| Events | `@register(mealType: MealType)` — opens registration modal |
| Events | `@edit(logId: string)` — opens edit modal with pre-filled data |
| Store | reads from `useDashboardStore` |

**Behavior:**
- Pending meal slots show "Registrar →" button
- Registered meals show food summary + "Editar" link
- Each food shows a `FoodChip` with status icon (✅ tried, ❌ rejected)

### REQ-DASH-10: SuggestedFoodsCard.vue

Shows 3 personalized food suggestions.

| Aspect | Detail |
|--------|--------|
| Props | `suggestions: SuggestedFood[]` |
| Events | `@view-food(foodId: string)` — navigates to food detail |
| Events | `@mark-tried(foodId: string)` — quick-logs food as tried |
| Store | reads from `useDashboardStore` |

**Behavior:**
- 3 cards in horizontal scroll on mobile, 3 vertical on desktop
- Each card shows emoji, name, age tag, benefit, and status badge
- "Ver más opciones →" links to full catalog with filters

### REQ-DASH-11: AllergenAlertsCard.vue

Shows pending allergens for the baby's age window.

| Aspect | Detail |
|--------|--------|
| Props | `allergens: AllergenAlert[]` |
| Events | `@view-guide(allergenKey: string)` — opens allergen introduction modal |
| Store | reads from `useDashboardStore` |

**Behavior:**
- Hidden entirely if `allergens.length === 0`
- `closing_window` items show urgency badge (⚠️)
- "Ver cómo introducir →" link triggers modal with step-by-step guide

### REQ-DASH-12: FoodRoadmapCard.vue

Shows food progress by category with progress bars.

| Aspect | Detail |
|--------|--------|
| Props | `progress: RoadmapProgress[]` |
| Events | `@view-full-roadmap` — navigates to full roadmap page |
| Store | reads from `useDashboardStore` |

**Behavior:**
- 5 categories with `ProgressBar` + fraction (e.g. "6/10")
- Each category shows top 3-5 `FoodChip` items with status
- "Ver roadmap completo →" links to dedicated page

### REQ-DASH-13: BalanceInsightCard.vue

Shows A/L balance insight with rotating tip.

| Aspect | Detail |
|--------|--------|
| Props | `insight: BalanceInsight` |
| Events | `@view-weekly-detail` — navigates to weekly balance detail |
| Store | reads from `useDashboardStore` |

**Behavior:**
- Full width at the bottom of the dashboard
- Shows `labelEs` with color-coded icon (🟢 yellow, 🟠, 🔴)
- Shows rotating `tip` below the label
- NEVER shows exact percentages — only the qualitative label
- Click on card → weekly A/L detail view

---

## Scenarios

### Scenario: First-time user enters the dashboard

- GIVEN a user with an active profile and no food logs
- WHEN the dashboard loads
- THEN the system MUST show empty states for TodayLogs (all slots pending), SuggestedFoods (3 suggestions for baby's age), AllergenAlerts (if baby ≥ 6 months), Roadmap (0% across all categories), and BalanceInsight with "Sin datos suficientes"
- AND the dashboard MUST load in under 2 seconds

### Scenario: User registers a meal from the dashboard

- GIVEN the user is on the dashboard with a pending meal slot (e.g. "Desayuno")
- WHEN the user clicks the "Registrar" button on the meal slot
- THEN a FoodRegistrationModal MUST open pre-filled with the correct mealType
- AND after successful registration, the TodayLogsCard MUST update to show the new entry
- AND the meal slot state MUST change from pending to registered

### Scenario: User edits an existing food log

- GIVEN the user has a registered meal with at least one food log
- WHEN the user clicks "Editar" on that meal
- THEN an EditLogModal MUST open pre-filled with the log's data
- AND after saving, the TodayLogsCard MUST reflect the updated data

### Scenario: User marks a suggested food as tried

- GIVEN the user sees a suggested food card with `status: 'pending'`
- WHEN the user clicks the "Registrar como probado" action
- THEN a quick FoodLog entry MUST be created (date: today, mealType: SNACK, reaction: null)
- AND the SuggestedFoodsCard MUST update to show the food as `status: 'tried'`
- AND the roadmap progress for that food's group MUST increment

### Scenario: User views allergen alerts and accesses the guide

- GIVEN the user's baby is ≥ 6 months old and has pending allergens
- WHEN the dashboard loads
- THEN the AllergenAlertsCard MUST show allergens not yet introduced
- AND allergens already introduced (found in FoodLog without REJECTED reaction) MUST NOT appear
- WHEN the user clicks "Ver cómo introducir" on an allergen
- THEN a modal MUST display step-by-step introduction guide (small amounts, 3-5 day wait, signs to observe)

---

## Business Rules

### REQ-DASH-BIZ-01: Suggested Foods Algorithm

The system MUST compute suggested foods using:
1. Filter `Food` where `ageMonths <= baby.ageInMonths`
2. Exclude foods that appear in `FoodLog` for this baby in the last 30 days
3. Sort by: allergens pending first → groups with lowest tried ratio → random
4. Limit to `limit` (default 3)

### REQ-DASH-BIZ-02: Allergen Window Logic

- Allergen alerts MUST only appear if `baby.ageInMonths >= 6`
- Allergens already logged in FoodLog (with `reaction NOT IN ('REJECTED')`) MUST be hidden
- If `baby.ageInMonths >= 10`, urgency MUST be set to `closing_window`
- If `baby.ageInMonths < 6`, the `pendingAllergens` array MUST be empty

### REQ-DASH-BIZ-03: Roadmap Progress Calculation

- `totalCount` = count of `Food` in this group where `ageMonths <= baby.ageInMonths`
- `triedCount` = count of unique `foodId` in `FoodLog` for this baby in this group
- Percentage = `Math.round((triedCount / totalCount) * 100)` or 0 if totalCount is 0
- The `foods` array per group MUST show pending items first, then tried items by recency

### REQ-DASH-BIZ-04: Balance Insight Calculation

- Fetch all FoodLog entries for this baby in the last 7 days
- Apply `calculateBalance()` from `@pakulab/shared` to determine the score
- Map the score using `BALANCE_THRESHOLD` (0.34) and `IMBALANCE_THRESHOLD` (0.67)
- If no logs exist, MUST return `label: 'balanced'`, `labelEs: 'Sin datos suficientes'`, `severity: 'green'`
- Tips MUST rotate randomly per page load from the curated list (8 tips in `docs/dashboard.md`)
- Tips MUST NOT show exact A/L percentages

### REQ-DASH-BIZ-05: Curated Tip Rotation

The system MUST NOT generate tips dynamically. Tips MUST come from a hardcoded list derived from real food properties in the database. The tip for each dashboard load MUST be selected randomly from:

1. "La avena es suave para el estómago."
2. "Las zanahorias cocidas son fáciles de digerir."
3. "El pollo es una proteína magra ideal para bebés."
4. "Las frutas como la manzana aportan fibra natural."
5. "El camote es nutritivo y de sabor dulce natural."
6. "Combinar cereales con verduras da energía sostenida."
7. "Las proteínas ayudan al crecimiento del bebé."
8. "Los tubérculos son fáciles de preparar y nutritivos."

### REQ-DASH-BIZ-06: Dashboard Cache Strategy

| Endpoint | TTL | Strategy |
|----------|-----|----------|
| `GET /api/dashboard` | 60s | Stale-while-revalidate |
| `GET /api/dashboard/suggestions` | 24h | Cache heavily, invalidate on new FoodLog |
| `GET /api/dashboard/allergens` | 1h | Cache, invalidate on new FoodLog |
| `GET /api/dashboard/roadmap` | 15min | Cache, invalidate on new FoodLog |
| `GET /api/dashboard/today` | 0 | No cache (real-time) |
| `GET /api/dashboard/balance` | 1h | Cache, invalidate on new FoodLog |

---

## Acceptance Criteria

### Functional

- [ ] Dashboard loads in < 2 seconds with cache
- [ ] TodayLogsCard shows 4 meal slots (BREAKFAST, LUNCH, DINNER, SNACK)
- [ ] Pending slots show "Registrar →" action
- [ ] Registered slots show food summary + "Editar" link
- [ ] SuggestedFoods updates every 24 hours
- [ ] Allergen alerts are hidden after the food is logged without REJECTED reaction
- [ ] Roadmap percentage reflects real tried/total ratio per group
- [ ] Balance insight shows qualitative label only (no raw percentages)
- [ ] Tips rotate per page load randomly from curated list

### Non-Functional

- [ ] Responsive: mobile (320px+), tablet (768px+), desktop (1024px+)
- [ ] Accessible: keyboard navigation, ARIA labels on all interactive elements
- [ ] Offline: displays cached data + "Sin conexión" indicator
- [ ] PWA: installable with correct icon and splash screen