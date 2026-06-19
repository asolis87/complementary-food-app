import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: false,
    environment: 'node',
    // @ts-expect-error -- vitest's UserConfig['test'] resolves to vite's InlineConfig
    // here (no `forbidOnly` field). apps/web avoids this via `/// <reference types="vitest" />`
    // at the top of the file, but apps/api's tsconfig setup is incompatible with that triple-
    // slash. The property is real and enforced at runtime by the CI step that exports CI=true.
    forbidOnly: !!process.env.CI,
    include: ['src/**/*.test.ts'],
    alias: {
      '@pakulab/shared': new URL('../../packages/shared/src/index.ts', import.meta.url).pathname,
    },
  },
})
