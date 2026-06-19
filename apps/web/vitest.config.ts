/// <reference types="vitest" />
import { mergeConfig } from 'vitest/config'
import viteConfig from './vite.config'

export default mergeConfig(viteConfig, {
  test: {
    forbidOnly: !!process.env.CI,
    environment: 'happy-dom',
    globals: false,
    include: ['src/**/*.{test,spec}.ts'],
    // PR-1.6a excluded 9 pre-existing broken files. PR-1.8a un-excludes
    // 4 of them (mechanical, no contract drift); the remaining 5
    // (component-template rotation that the scout under-counted) are
    // tracked separately in T-XX-WEB-TESTS-FIX-b (PR-1.8b).
    exclude: [
      'src/modules/dashboard/components/AllergenAlertsCard.test.ts',
      'src/modules/dashboard/components/DashboardErrorBoundary.test.ts',
      'src/modules/menus/MenuWeekPage.test.ts',
      'src/shared/stores/dashboardStore.test.ts',
      'src/shared/stores/menuStore.test.ts',
    ],
  },
})
