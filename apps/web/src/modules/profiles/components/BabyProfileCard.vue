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
        ✏️
      </button>
      <button
        class="action-btn action-delete"
        title="Eliminar perfil"
        aria-label="Eliminar perfil"
        @click="confirmDelete"
      >
        🗑️
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { BabyProfile } from '@cfa/shared'
import { ageInMonths, formatAgeEs } from '@cfa/shared'

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
  gap: 1rem;
  padding: 1rem 1.125rem;
  background: white;
  border-radius: 1rem;
  border: 1px solid #f3f4f6;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

.profile-avatar {
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #6ee7b7, #10b981);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;
  font-weight: 700;
  color: white;
}

.profile-info {
  flex: 1;
  overflow: hidden;
}

.profile-name {
  margin: 0 0 0.15rem;
  font-size: 1rem;
  font-weight: 700;
  color: #111827;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.profile-age,
.profile-ac {
  margin: 0;
  font-size: 0.8rem;
  color: #6b7280;
}

.profile-ac {
  margin-top: 0.1rem;
}

.profile-actions {
  display: flex;
  gap: 0.35rem;
  flex-shrink: 0;
}

.action-btn {
  background: #f3f4f6;
  border: none;
  border-radius: 0.5rem;
  width: 36px;
  height: 36px;
  cursor: pointer;
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
}

.action-btn:hover {
  background: #e5e7eb;
}

.action-delete:hover {
  background: #fee2e2;
}
</style>
