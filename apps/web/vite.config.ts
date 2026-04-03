import { resolve } from 'path'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    vue(),

    // PWA Plugin — generateSW strategy (zero config precaching)
    // Design Decision AD7: generateSW + IndexedDB for food catalog cache
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/icon-192x192.svg', 'icons/icon-512x512.svg'],

      manifest: {
        name: 'Pakulab - Alimentación Complementaria',
        short_name: 'Pakulab',
        description: 'Armá platos balanceados para tu bebé',
        theme_color: '#00694b',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        lang: 'es-MX',
        categories: ['health', 'food', 'lifestyle'],
        icons: [
          {
            src: 'icons/icon-192x192.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
          },
          {
            src: 'icons/icon-512x512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
          },
          {
            src: 'icons/icon-512x512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },

      workbox: {
        // Precache entire app shell (HTML, CSS, JS, fonts, images)
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],

        // Runtime cache strategies
        runtimeCaching: [
          {
            // Google Fonts stylesheets — StaleWhileRevalidate (stylesheet URLs change with params)
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts-stylesheets',
            },
          },
          {
            // Google Fonts webfont files — CacheFirst (font binaries never change at the same URL)
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 365 days
              },
            },
          },
          {
            // Food catalog — CacheFirst (catalog rarely changes, IndexedDB is the true cache)
            urlPattern: /\/api\/foods/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'food-catalog',
              expiration: {
                maxEntries: 300,
                maxAgeSeconds: 60 * 60 * 24, // 24 hours
              },
            },
          },
          {
            // User plates — NetworkFirst (user data should be fresh)
            urlPattern: /\/api\/plates/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'user-plates',
              networkTimeoutSeconds: 5,
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24, // 24 hours fallback
              },
            },
          },
          {
            // Auth & billing — NetworkOnly (must always be live)
            urlPattern: /\/api\/(auth|billing|subscriptions)/,
            handler: 'NetworkOnly',
          },
          {
            // Static assets (images, fonts, icons) — CacheFirst with 7d TTL
            urlPattern: /\.(png|svg|jpg|jpeg|webp|woff2|woff|ttf)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'static-assets',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
              },
            },
          },
        ],
      },

      devOptions: {
        enabled: false, // Disable SW in dev (too noisy)
      },
    }),
  ],

  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@pakulab/shared': resolve(__dirname, '../../packages/shared/src/index.ts'),
    },
  },

  server: {
    port: 5174,
    proxy: {
      '/api': {
        target: 'http://localhost:3002',
        changeOrigin: true,
      },
    },
  },
})
