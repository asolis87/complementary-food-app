<template>
  <div class="profile-card">
    <!-- Avatar -->
    <div class="profile-avatar" :aria-label="`Perfil de ${profile.name}`">
      {{ initial }}
    </div>

    <!-- Info -->
    <div class="profile-info">
      <h3 class="profile-name">{{ profile.name }}</h3>
      <p class="profile-age">{{ ageText }}</p>
      <p v-if="acStartText" class="profile-ac">AC: {{ acStartText }}</p>
    </div>

    <!-- Actions -->
    <div class="profile-actions">
      <button
        class="action-btn"
        title="Editar perfil"
        aria-label="Editar perfil"
        @click="$emit('edit', profile)"
      >
        <span class="material-symbols-outlined" aria-hidden="true">edit</span>
      </button>
      <button
        class="action-btn action-delete"
        title="Eliminar perfil"
        aria-label="Eliminar perfil"
        @click="confirmDelete"
      >
        <span class="material-symbols-outlined" aria-hidden="true">delete</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { BabyProfile } from '@pakulab/shared'
import { ageInMonths, formatAgeEs } from '@pakulab/shared'

const props = defineProps<{
  profile: BabyProfile
}>()

const emit = defineEmits<{
  (e: 'edit', profile: BabyProfile): void
  (e: 'delete', id: string): void
}>()

const initial = computed(() =>
  props.profile.name.charAt(0).toUpperCase(),
)

const ageText = computed(() => {
  const months = ageInMonths(props.profile.birthDate)
  return formatAgeEs(months)
})

const acStartText = computed(() => {
  if (!props.profile.acStartDate) return null
  return new Date(props.profile.acStartDate).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
})

function confirmDelete() {
  if (confirm(`¿Eliminar el perfil de ${props.profile.name}?`)) {
    emit('delete', props.profile.id)
  }
}
</script>

<style scoped>
.profile-card {
  display: flex;
  align-items: center;
  gap: var(--md3-space-3);
  padding: var(--md3-space-3) var(--md3-space-4);
  background: var(--md3-surface-container-lowest);
  border-radius: var(--md3-rounded-md);
  box-shadow: var(--md3-shadow-card);
  transition: box-shadow var(--md3-transition-fast);
}

.profile-card:hover {
  box-shadow: var(--md3-shadow-elevated);
}

.profile-avatar {
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  background: var(--md3-primary-container);
  border-radius: var(--md3-rounded-full);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--md3-font-headline);
  font-size: var(--md3-title-lg);
  font-weight: var(--md3-weight-bold);
  color: var(--md3-on-primary-container);
}

.profile-info {
  flex: 1;
  overflow: hidden;
}

.profile-name {
  margin: 0 0 var(--md3-space-1);
  font-family: var(--md3-font-headline);
  font-size: var(--md3-title-md);
  font-weight: var(--md3-weight-bold);
  color: var(--md3-on-surface);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.profile-age,
.profile-ac {
  margin: 0;
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-sm);
  color: var(--md3-on-surface-variant);
}

.profile-ac {
  margin-top: var(--md3-space-1);
}

.profile-actions {
  display: flex;
  gap: var(--md3-space-2);
  flex-shrink: 0;
}

.action-btn {
  background: var(--md3-surface-container-low);
  border: none;
  border-radius: var(--md3-rounded-sm);
  width: 36px;
  height: 36px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--md3-on-surface-variant);
  transition: background var(--md3-transition-fast), color var(--md3-transition-fast);
}

.action-btn .material-symbols-outlined {
  font-size: 1.125rem;
  line-height: 1;
}

.action-btn:hover {
  background: var(--md3-surface-container-high);
  color: var(--md3-on-surface);
}

.action-delete:hover {
  background: var(--md3-error-container);
  color: var(--md3-on-error-container);
}
</style>
