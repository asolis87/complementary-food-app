/// <reference types="vitest" />
import { mergeConfig } from 'vitest/config'
import viteConfig from './vite.config'

export default mergeConfig(viteConfig, {
  test: {
    forbidOnly: !!process.env.CI,
    environment: 'happy-dom',
    globals: false,
    include: ['src/**/*.{test,spec}.ts'],
  },
})
