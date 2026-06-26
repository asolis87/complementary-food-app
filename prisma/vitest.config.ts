import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // @ts-expect-error vitest 2.x's UserConfig['test'] resolves to vite's InlineConfig
    // (which lacks forbidOnly). Runtime option is supported; the cast is type-level only.
    forbidOnly: !!process.env.CI,
    globals: false,
    environment: 'node',
    include: ['scripts/**/*.test.ts'],
  },
})
