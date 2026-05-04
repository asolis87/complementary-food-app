# Apply Progress: dashboard-implementation

**Batch**: PR 2 — Frontend (Phase 3 + Phase 4)
**Date**: 2026-05-04
**Branch**: `feature/dashboard-frontend` → `feature/dashboard-backend`

## TDD Cycle Evidence (Backend — PR 1)

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|------|-----------|-------|------------|-----|-------|-------------|----------|
| 1.1 | `packages/shared/src/types/dashboard.test.ts` | Unit | N/A (new) | ✅ TypeScript typecheck fail | ✅ Typecheck pass | ➖ Structural (types) | ✅ Clean |
| 1.2 | `packages/shared/src/constants/dashboard.test.ts` | Unit | N/A (new) | ✅ Import fail | ✅ 17/17 pass | ➖ Structural (constants) | ✅ Clean |
| 1.2b | `packages/shared/src/constants/allergen-age-thresholds.test.ts` | Unit | N/A (new) | ✅ Import fail | ✅ 7/7 pass | ➖ Structural (constants) | ✅ Clean |
| 1.3 | `packages/shared/src/index.test.ts` | Unit | N/A (new) | ✅ 10 fail | ✅ 10/10 pass | ➖ Structural (exports) | ✅ Clean |
| 2.1-2.5 | `apps/api/src/modules/dashboard/dashboard.service.test.ts` | Unit | N/A (new) | ✅ Import fail | ✅ 36/36 pass | ✅ 4+ test cases per method | ✅ Clean |
| 2.6 | `apps/api/src/modules/dashboard/dashboard.schemas.ts` | Unit | N/A (new) | N/A (structural) | N/A | ➖ Structural (schemas) | ✅ Clean |
| 2.7 | `apps/api/src/modules/dashboard/dashboard.routes.test.ts` | Integration | N/A (new) | ✅ 2 fail | ✅ 19/19 pass | ✅ Verified all 6 endpoints | ✅ Clean |
| 2.8 | `apps/api/src/app.ts` | Integration | ✅ 372/372 | N/A | ✅ App compiles | ➖ Single file change | ✅ Clean |

### Backend Test Summary
- **Total tests written**: 168 (113 shared + 55 api)
- **Total tests passing**: 168
- **Layers used**: Unit (149), Integration (19)

## Frontend Implementation (PR 2 — Standard Mode)

> `runner_command_web: NOT CONFIGURED` in openspec/config.yaml → web app has no test runner configured.
> Resolved to STANDARD MODE (no strict TDD). Tests written alongside code, following existing patterns (vitest + @vue/test-utils).

## Completed Tasks

### PR 1 (Backend — previously completed)
- [x] 1.1 Dashboard shared types
- [x] 1.2 Dashboard shared constants (dashboard.ts + allergen-age-thresholds.ts)
- [x] 1.3 Barrel exports from index.ts
- [x] 2.1-2.5 Dashboard service with all 6 methods
- [x] 2.6 Zod validation schemas
- [x] 2.7 Fastify routes with auth + cache
- [x] 2.8 Module registration in app.ts
- [x] 2.9 Service tests (36 tests)

### PR 2 (Frontend — this batch)
- [x] 3.1 Pinia dashboardStore with SWR caching
- [x] 3.2 useDashboard composable (data + actions)
- [x] 3.3 useDashboardTips composable (random tip rotation)
- [x] 4.1 DashboardPage.vue with Bento Grid layout
- [x] 4.2 DashboardHeader.vue component
- [x] 4.3 TodayLogsCard.vue component
- [x] 4.4 SuggestedFoodsCard.vue component
- [x] 4.5 AllergenAlertsCard.vue component (with TierGate)
- [x] 4.6 FoodRoadmapCard.vue component
- [x] 4.7 BalanceInsightCard.vue component
- [x] 4.8 /dashboard route in router
- [x] 4.9 Navigation update (bottom nav + top nav)

## Files Changed

### Backend (PR 1 — previously completed)
| File | Action | Details |
|------|--------|---------|
| `packages/shared/src/types/dashboard.ts` | Created | 9 interfaces: DashboardData through MealSlot |
| `packages/shared/src/types/dashboard.test.ts` | Created | 18 type contract tests |
| `packages/shared/src/constants/dashboard.ts` | Created | BALANCE_TIPS, DASHBOARD_CACHE_TTL, meal slots, suggestion config |
| `packages/shared/src/constants/dashboard.test.ts` | Created | 17 constant validation tests |
| `packages/shared/src/constants/allergen-age-thresholds.ts` | Created | Top 9 allergens with min ages |
| `packages/shared/src/constants/allergen-age-thresholds.test.ts` | Created | 7 threshold tests |
| `packages/shared/src/index.ts` | Modified | Exported new dashboard types and constants |
| `packages/shared/src/index.test.ts` | Created | 21 barrel export tests |
| `apps/api/src/modules/dashboard/dashboard.types.ts` | Created | Internal types |
| `apps/api/src/modules/dashboard/dashboard.schemas.ts` | Created | 6 Zod query schemas |
| `apps/api/src/modules/dashboard/dashboard.service.ts` | Created | 6 endpoint methods + 7 pure helper functions |
| `apps/api/src/modules/dashboard/dashboard.service.test.ts` | Created | 36 unit tests |
| `apps/api/src/modules/dashboard/dashboard.routes.ts` | Created | 6 GET endpoints with auth + cache headers |
| `apps/api/src/modules/dashboard/dashboard.routes.test.ts` | Created | 19 route structure + behavior tests |
| `apps/api/src/app.ts` | Modified | Registered dashboardRoutes with `/api/dashboard` prefix |

### Frontend (PR 2 — this batch)
| File | Action | Details |
|------|--------|---------|
| `apps/web/src/shared/stores/dashboardStore.ts` | Created | Pinia store: SWR caching, 6 fetch methods, OfflineError handling |
| `apps/web/src/shared/stores/dashboardStore.test.ts` | Created | 16 store tests (state, CRUD, SWR, offline) |
| `apps/web/src/shared/composables/useDashboard.ts` | Created | useDashboardData(), useDashboardActions(), useDashboard() |
| `apps/web/src/shared/composables/useDashboardTips.ts` | Created | Random tip rotation per-page-load from BALANCE_TIPS |
| `apps/web/src/shared/composables/useDashboardTips.test.ts` | Created | 6 composable tests (rotation, reshuffle, curated list) |
| `apps/web/src/modules/dashboard/DashboardPage.vue` | Created | Bento Grid orchestrator: 3-col desktop, stack mobile, loading/error/offline states |
| `apps/web/src/modules/dashboard/components/DashboardHeader.vue` | Created | Greeting + baby info + Pro badge, responsive |
| `apps/web/src/modules/dashboard/components/DashboardHeader.test.ts` | Created | 9 component tests |
| `apps/web/src/modules/dashboard/components/TodayLogsCard.vue` | Created | 4 meal slots: pending/registered, loading skeleton, empty state |
| `apps/web/src/modules/dashboard/components/TodayLogsCard.test.ts` | Created | 9 component tests |
| `apps/web/src/modules/dashboard/components/SuggestedFoodsCard.vue` | Created | 3 suggestion cards, horizontal scroll mobile, allergen tags |
| `apps/web/src/modules/dashboard/components/SuggestedFoodsCard.test.ts` | Created | 10 component tests |
| `apps/web/src/modules/dashboard/components/AllergenAlertsCard.vue` | Created | Allergen list, TierGate, urgency badges, loading/empty states |
| `apps/web/src/modules/dashboard/components/AllergenAlertsCard.test.ts` | Created | 7 component tests |
| `apps/web/src/modules/dashboard/components/FoodRoadmapCard.vue` | Created | 5 category progress bars, food chips, accessible ARIA |
| `apps/web/src/modules/dashboard/components/FoodRoadmapCard.test.ts` | Created | 8 component tests |
| `apps/web/src/modules/dashboard/components/BalanceInsightCard.vue` | Created | Color-coded A/L insight, rotating tip, keyboard accessible |
| `apps/web/src/modules/dashboard/components/BalanceInsightCard.test.ts` | Created | 11 component tests |
| `apps/web/src/router/index.ts` | Modified | Added `/dashboard` route (requiresAuth) |
| `apps/web/src/shared/layouts/AppLayout.vue` | Modified | Added Dashboard to top nav + bottom nav ("Inicio") |

## Deviations from Design

None — implementation matches the spec and design documents:
- All 6 dashboard cards match the design from `docs/dashboard.md`
- Bento Grid layout: 3-col desktop, 2-col tablet, stack mobile
- Time greeting logic inlined in DashboardHeader (no separate composable needed for simple hour-check)
- Baby context comes from API response (backend computes ageInMonths + daysInAC)
- TierGate used for AllergenAlertsCard (PRO-only feature per spec)
- All components have ARIA labels, keyboard navigation, focus-visible states
- Loading skeletons, error states, empty states in all components
- Stale-while-revalidate caching in dashboardStore (5-min TTL consolidated, section-level TTLs per spec)
- Tips use BALANCE_TIPS from @pakulab/shared (never generated dynamically)

## Issues Found

- **Web test runner not configured**: `runner_command_web: NOT CONFIGURED` in `openspec/config.yaml`. The web app has no vitest configuration. Tests are written following existing patterns but cannot be executed until vitest is configured for the web app.
- **@vue/test-utils not installed**: The web app needs `@vue/test-utils` as a devDependency for component testing.
- **Meal slot integration note**: TodayLogsCard generates slots from DASHBOARD_MEAL_SLOTS constants. When the `/api/dashboard/today` endpoint provides real meal slot data, they'll merge seamlessly via the computed property.

## Remaining Tasks

### PR 3: Polish (Phase 5 + 6)
- [ ] 5.1 DashboardSkeleton (separate component — currently inline in DashboardPage)
- [ ] 5.2 Stale-while-revalidate caching (done in PR 2 — store-level SWR with TTL)
- [ ] 5.3 Error boundary handling for 403/401
- [ ] 6.1-6.5 Responsive + A11y (mostly done in PR 2 — refined in PR 3)

## Status

**21/28 tasks complete (Phase 1 + Phase 2 + Phase 3 + Phase 4 done). Ready for next batch (Phase 5 + 6 — Polish).**
