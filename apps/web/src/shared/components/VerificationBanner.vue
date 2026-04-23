<template>
  <div v-if="visible" class="verification-banner" role="status">
    <span class="material-symbols-outlined banner-icon" aria-hidden="true">mail</span>
    <p class="banner-message">
      Tu correo aún no está verificado.
      <button
        class="banner-resend-btn"
        :disabled="cooldownRemaining > 0"
        @click="handleResend"
      >
        {{ cooldownRemaining > 0 ? `Reenviar en ${cooldownRemaining}s` : 'Reenviar correo' }}
      </button>
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/shared/stores/authStore.js'

const authStore = useAuthStore()

const COOLDOWN_SECONDS = 60

const cooldownRemaining = ref(0)
let cooldownInterval: ReturnType<typeof setInterval> | null = null

const visible = computed(() => authStore.showVerificationBanner)

function handleResend() {
  if (cooldownRemaining.value > 0) return

  authStore.resendVerificationEmail().catch(() => {
    // Error is displayed via authStore.error (banner can show a toast)
  })

  // Start cooldown
  cooldownRemaining.value = COOLDOWN_SECONDS
  cooldownInterval = setInterval(() => {
    cooldownRemaining.value--
    if (cooldownRemaining.value <= 0) {
      if (cooldownInterval) clearInterval(cooldownInterval)
      cooldownInterval = null
    }
  }, 1000)
}

onUnmounted(() => {
  if (cooldownInterval) clearInterval(cooldownInterval)
})
</script>

<style scoped>
.verification-banner {
  display: flex;
  align-items: center;
  gap: var(--md3-space-3);
  padding: var(--md3-space-2) var(--md3-space-3);
  background: var(--md3-secondary-container);
  color: var(--md3-on-secondary-container);
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-md);
  line-height: var(--md3-body-line-height);
}

.banner-icon {
  font-size: 1.25rem !important;
  flex-shrink: 0;
}

.banner-message {
  margin: 0;
  color: var(--md3-on-secondary-container);
  display: flex;
  align-items: center;
  gap: var(--md3-space-2);
  flex-wrap: wrap;
}

.banner-resend-btn {
  background: none;
  border: none;
  padding: 0;
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-lg);
  font-weight: var(--md3-weight-semibold);
  color: var(--md3-primary);
  cursor: pointer;
  text-decoration: underline;
  text-decoration-thickness: 1px;
  text-underline-offset: 2px;
  transition: opacity var(--md3-transition-fast);
}

.banner-resend-btn:hover:not(:disabled) {
  opacity: 0.8;
}

.banner-resend-btn:disabled {
  color: var(--md3-on-surface-variant);
  cursor: not-allowed;
  text-decoration: none;
}

/* Mobile adjustments */
@media (max-width: 480px) {
  .verification-banner {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--md3-space-1);
  }
}

/* Desktop: center the banner */
@media (min-width: 768px) {
  .verification-banner {
    justify-content: center;
    padding: var(--md3-space-2) var(--md3-space-6);
  }
}
</style>
