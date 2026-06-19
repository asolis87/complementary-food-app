/// <reference types="vitest" />
import { mergeConfig } from 'vitest/config'
import viteConfig from './vite.config'

export default mergeConfig(viteConfig, {
  test: {
    forbidOnly: !!process.env.CI,
    environment: 'happy-dom',
    globals: false,
    include: ['src/**/*.{test,spec}.ts'],
    // Pre-existing broken test files excluded from the harness scope.
    // Tracked in T-XX-WEB-TESTS-FIX (openspec/changes/etapa-10-23-meses/tasks.md).
    // The 4 files removed from this list in PR-1.8a (DashboardHeader,
    // DashboardSkeleton, MenuExportFrame, authStore.email) are now
    // passing. The 5 remaining are blocked on component-template
    // rotation that needs a fresh scout pass before they can ship.
    exclude: [
      'src/modules/dashboard/components/AllergenAlertsCard.test.ts',
      'src/modules/dashboard/components/DashboardErrorBoundary.test.ts',
      'src/modules/menus/MenuWeekPage.test.ts',
      'src/shared/stores/dashboardStore.test.ts',
      'src/shared/stores/menuStore.test.ts',
    ],
  },
})
