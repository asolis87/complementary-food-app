/**
 * Vue 3 application entry point.
 * Service worker is registered by vite-plugin-pwa (registerType: 'autoUpdate').
 * The virtual module import below is resolved at build time by the plugin.
 */

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { router } from './router/index.js'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
