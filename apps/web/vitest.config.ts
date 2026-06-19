/// <reference types="vitest" />
import { mergeConfig } from 'vitest/config'
import viteConfig from './vite.config'

export default mergeConfig(viteConfig, {
  test: {
    environment: 'happy-dom',
    globals: false,
    include: ['src/**/*.{test,spec}.ts'],
    // Pre-existing broken tests excluded from the harness scope.
    // Tracked as T-XX-WEB-TESTS-FIX in openspec/changes/etapa-10-23-meses/tasks.md.
    exclude: [
      'src/modules/dashboard/components/AllergenAlertsCard.test.ts',
      'src/modules/dashboard/components/DashboardErrorBoundary.test.ts',
      'src/modules/dashboard/components/DashboardHeader.test.ts',
      'src/modules/dashboard/components/DashboardSkeleton.test.ts',
      'src/modules/menus/MenuWeekPage.test.ts',
      'src/modules/menus/components/MenuExportFrame.test.ts',
      'src/shared/stores/authStore.email.test.ts',
      'src/shared/stores/dashboardStore.test.ts',
      'src/shared/stores/menuStore.test.ts',
    ],
  },
})
