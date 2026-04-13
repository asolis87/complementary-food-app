# Proposal: ux-improvements-v1

## Intent
To enhance the overall user experience and application flow by addressing key usability friction points. These improvements ensure the app feels more responsive, intuitive, and accurate when building, sorting, assigning, and classifying plates.

## Scope

### In Scope
- Fix state reset issue when navigating to the new plate builder (`PlateBuilderPage.vue`).
- Verify and document the recent-first sorting of saved plates.
- Correct the food group classification for "Camote" from `VEGETABLE` to `CEREAL_TUBER` in the database seed (`prisma/seed.ts`).
- Add a confirmation dialog when serving a plate for the first time (`MenuWeekPage.vue`).
- Implement a feature to apply a single plate to all meals of a specific day (Frontend loop of `assignPlate`).
- Relocate or adjust the Floating Action Button (FAB) in the plates list to prevent overlap with content.

### Out of Scope
- Major redesigns of the plate builder or menu week UI.
- Backend API changes beyond potential seed data updates.
- Performance optimization of the plates list beyond sorting verification.

## Approach
1. **New plate starts empty**: Update `PlateBuilderPage.vue` `onMounted` lifecycle to invoke `plateStore.resetDraft()` immediately before edit mode checks.
2. **Sort plates by recent**: Review the `savedPlates` getter/store and API query. If already sorting by `createdAt: 'desc'`, document the behavior and add tests/comments to lock it in.
3. **Camote → CEREAL_TUBER**: Modify `prisma/seed.ts` to move 'Camote' to the `cerealsTubers` array. 
4. **"Se lo di" confirmation modal**: Introduce a confirmation dialog component in `MenuWeekPage.vue` for the initial "serve" action, mirroring the existing `reServeDialog`.
5. **Apply plate to all meals of day**: Add a UI prompt after plate selection. On confirmation, iterate through the day's meal slots and dispatch `assignPlate` sequentially.
6. **Relocate "+" FAB in plates**: Adjust CSS (e.g., adding bottom margin/padding to the list container) or change the FAB positioning to avoid covering the last plate card.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/pages/PlateBuilderPage.vue` | Modified | Add `plateStore.resetDraft()` on mount |
| `src/pages/MenuWeekPage.vue` | Modified | Add confirmation dialogs and "apply to all meals" logic |
| `src/components/...` (Plates list) | Modified | Adjust FAB positioning/CSS padding |
| `prisma/seed.ts` | Modified | Change Camote classification |

## Effort Estimate
- New plate starts empty: **S**
- Sort plates by recent: **S**
- Camote classification fix: **S**
- "Se lo di" confirmation: **M**
- Apply plate to all meals of day: **M**
- Relocate "+" FAB: **S**
- **Total Effort**: **M**

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Camote group change affects existing historical plates visually | Low | Accept as data correction. Existing plates might show it in the new zone. |
| Partial failure applying a plate to all meals | Medium | Implement standard frontend error handling (toast) and continue/stop loop gracefully. |
| FAB relocation breaks mobile layout on smaller screens | Low | Use responsive padding/margins and test on standard mobile viewports. |

## Rollback Plan
- Revert the `prisma/seed.ts` changes and re-run the seed if database needs restoring.
- Revert the Vue component changes using standard Git revert for the UI adjustments.

## Dependencies
- None external. Relies on existing `plateStore` and `assignPlate` API endpoints.

## Success Criteria
- [ ] Navigating to the plate builder always starts with a clean slate.
- [ ] Saved plates are confirmed to display newest first.
- [ ] Camote is correctly classified as `CEREAL_TUBER` in new plates.
- [ ] Serving a plate for the first time prompts a confirmation dialog.
- [ ] Users can successfully apply a selected plate to all meals in a single day.
- [ ] The "+" FAB in the plates list no longer obscures the last item.