# Tasks: Dashboard Implementación de Pakulab

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 1500–2000 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1: Backend (Phases 1+2) → PR 2: Frontend (Phases 3+4) → PR 3: Integration + Polish (Phases 5+6) |
| Delivery strategy | ask-on-risk |
| Chain strategy | stacked-to-staging |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: stacked-to-staging
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Backend module + consolidated endpoint + caching | PR 1 | base: staging; includes dashboard module, service, routes, schemas, caching plugin |
| 2 | Frontend page + components + store + routing | PR 2 | base: PR 1 branch; all Vue components, Pinia store, router entry |
| 3 | Integration polish — responsive + a11y + loading states | PR 3 | base: PR 2 branch; responsive tweaks, a11y, offline indicator, E2E guards |

## Phase 1: Backend — Foundation & Schemas

- [x] 1.1 Create `packages/shared/src/types/dashboard.ts` — DashboardData, BabyContext, TodayLog, SuggestedFood, AllergenAlert, RoadmapProgress, RoadmapFood, BalanceInsight, MealSlot interfaces (spec REQ-DASH-01 through REQ-DASH-06)
- [x] 1.2 Create `packages/shared/src/constants/dashboard.ts` — BALANCE_TIPS curated list (8 items from spec REQ-DASH-BIZ-05), DASHBOARD_MEAL_TYPES array (BREAKFAST, LUNCH, DINNER, SNACK)
- [x] 1.3 Export new types from `packages/shared/src/index.ts` — add dashboard types and constants to barrel export

## Phase 2: Backend — Module Implementation

- [x] 2.1 Create `apps/api/src/modules/dashboard/dashboard.service.ts` — `getDashboardData(prisma, userId, babyProfileId)` aggregating all 6 sections in one call; delegates to helper functions for each section
- [x] 2.2 Create `apps/api/src/modules/dashboard/dashboard.service.ts` — `getSuggestions(prisma, babyProfileId, babyAgeMonths, limit)` implementing REQ-DASH-BIZ-01 sorting algorithm (allergens pending → low-variety groups → random)
- [x] 2.3 Create `apps/api/src/modules/dashboard/dashboard.service.ts` — `getAllergenAlerts(prisma, babyProfileId, babyAgeMonths)` implementing REQ-DASH-BIZ-02 (hide if <6mo, closing_window if ≥10mo)
- [x] 2.4 Create `apps/api/src/modules/dashboard/dashboard.service.ts` — `getRoadmapProgress(prisma, babyProfileId, babyAgeMonths)` implementing REQ-DASH-BIZ-03 (5 food groups, top-5 foods per group)
- [x] 2.5 Create `apps/api/src/modules/dashboard/dashboard.service.ts` — `getTodayLogs(prisma, babyProfileId)` + `getBalanceInsight(prisma, babyProfileId, babyAgeMonths)` implementing REQ-DASH-BIZ-04
- [x] 2.6 Create `apps/api/src/modules/dashboard/dashboard.schemas.ts` — Zod schemas for query params: `dashboardQuerySchema` (babyProfileId required), `suggestionsQuerySchema` (babyProfileId + optional limit), `allergensQuerySchema`, `roadmapQuerySchema`, `todayQuerySchema`, `balanceQuerySchema`
- [x] 2.7 Create `apps/api/src/modules/dashboard/dashboard.routes.ts` — 6 GET endpoints with auth guard + babyProfileId ownership verification; REQ-DASH-01 through REQ-DASH-06 with cache TTL headers (60s consolidated, 24h suggestions, 1h allergens, 15m roadmap, 0 today, 1h balance)
- [x] 2.8 Register dashboard routes in `apps/api/src/app.ts` — import and register `dashboardRoutes` with prefix `/api/dashboard`
- [x] 2.9 Create `apps/api/src/modules/dashboard/dashboard.service.test.ts` — unit tests for suggestion sorting, allergen window logic, roadmap progress calculation, and balance insight calculation using vitest

## Phase 3: Frontend — Store & Composables

- [x] 3.1 Create `apps/web/src/shared/stores/dashboardStore.ts` — Pinia store with `fetchDashboard(babyProfileId)` calling `GET /api/dashboard`, `fetchSuggestions`, `fetchAllergens`, `fetchRoadmap`, `fetchToday`, `fetchBalance` actions; state: dashboard data, loading flags per section, error state
- [x] 3.2 Create `apps/web/src/shared/composables/useDashboard.ts` — main composable with `useDashboardData()` and `useDashboardActions()`, integrating with the Pinia store
- [x] 3.3 Create `apps/web/src/shared/composables/useDashboardTips.ts` — `useDashboardTips()` composable with random tip rotation per page load from BALANCE_TIPS

## Phase 4: Frontend — Components & Page

- [x] 4.1 Create `apps/web/src/modules/dashboard/DashboardPage.vue` — root page with Bento Grid layout (3-col desktop, stack mobile); loads dashboard data on mount; handles loading and error states
- [x] 4.2 Create `apps/web/src/modules/dashboard/components/DashboardHeader.vue` — greeting with emoji + user name + baby name + age + daysAC + Pro badge; time-based greeting computed inline
- [x] 4.3 Create `apps/web/src/modules/dashboard/components/TodayLogsCard.vue` — shows 4 MealSlot items (BREAKFAST, LUNCH, DINNER, SNACK); pending slots show "Registrar →" action; registered slots show food summary + "Editar" link; emits `@register(mealType)` and `@edit(mealType)`
- [x] 4.4 Create `apps/web/src/modules/dashboard/components/SuggestedFoodsCard.vue` — 3 suggestion cards with emoji, name, age tag, benefit, status badge; horizontal scroll on mobile, vertical on desktop; "Ver más opciones →" link; emits `@viewFood(foodId)` and `@viewAll`
- [x] 4.5 Create `apps/web/src/modules/dashboard/components/AllergenAlertsCard.vue` — list of pending allergens with emoji, name, min age; closing_window shows ⚠️ urgency badge; "Ver cómo introducir →" link; emits `@viewGuide(allergenKey)`; hidden if `allergens.length === 0`
- [x] 4.6 Create `apps/web/src/modules/dashboard/components/FoodRoadmapCard.vue` — 5 categories with ProgressBar + fraction (X/Y); each category shows 3-5 food chips with status; "Ver completo →" link; emits `@viewFullRoadmap`
- [x] 4.7 Create `apps/web/src/modules/dashboard/components/BalanceInsightCard.vue` — full-width card showing `labelEs` with color-coded icon (🟢/🟠/🔴) and rotating `tip`; NEVER shows exact percentages; emits `@viewWeeklyDetail`
- [x] 4.8 Add `/dashboard` route in `apps/web/src/router/index.ts` — authenticated route, lazy-loads `DashboardPage.vue`, `meta: { requiresAuth: true }`
- [x] 4.9 Update navigation — add "Inicio" (dashboard) to bottom nav mobile and top nav desktop

## Phase 5: Integration — Loading, Error & Offline

- [ ] 5.1 Create `apps/web/src/modules/dashboard/components/DashboardSkeleton.vue` — skeleton loading state matching the Bento Grid layout for perceived performance (<2s spec)
- [ ] 5.2 Add stale-while-revalidate caching to `dashboardStore.ts` — cache responses in memory with TTL per section; return cached data immediately, refresh in background; offline fallback shows cached data + `OfflineIndicator`
- [ ] 5.3 Add error boundary handling in `DashboardPage.vue` — catch API errors, show retry button; handle 403 (wrong profile ownership) and 401 (session expired) gracefully

## Phase 6: Responsive & Accessibility

- [ ] 6.1 Responsive mobile layout — stack vertical (320-767px); hide bottom nav correctly; horizontal scroll for suggested foods; full-width balance insight
- [ ] 6.2 Responsive tablet layout — 2-column grid (768-1023px); allergens beneath suggestions
- [ ] 6.3 Responsive desktop layout — Bento Grid 3-column (1024px+); col1=TodayLogs, col2=Suggestions+Allergens, col3=Roadmap; BalanceInsight full-width bottom row
- [ ] 6.4 A11y — keyboard navigation through all interactive cards; ARIA labels on meal slot buttons, suggestion actions, allergen links; focus-visible states on all focusable elements
- [ ] 6.5 A11y — skip-to-content link; semantic landmarks (role="main", nav, section with aria-label per card); screen reader announcements for loading/error states
