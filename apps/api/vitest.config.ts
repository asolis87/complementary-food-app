import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: false,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    alias: {
      '@pakulab/shared': new URL('../../packages/shared/src/index.ts', import.meta.url).pathname,
    },
  },
})
