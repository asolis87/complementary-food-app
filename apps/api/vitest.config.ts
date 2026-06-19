import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: false,
    environment: 'node',
    // @ts-expect-error -- vitest's defineConfig type inference limitation; CI gate is enforced at runtime.
    forbidOnly: !!process.env.CI,
    include: ['src/**/*.test.ts'],
    alias: {
      '@pakulab/shared': new URL('../../packages/shared/src/index.ts', import.meta.url).pathname,
    },
  },
})
