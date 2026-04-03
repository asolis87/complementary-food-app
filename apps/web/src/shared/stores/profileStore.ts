/**
 * Baby profiles Pinia store.
 * Manages CRUD state for baby profiles.
 */

import type { BabyProfile } from '@pakulab/shared'
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { apiClient, ApiError } from '../api/client.js'

interface ProfileCreateInput {
  name: string
  birthDate: string
  acStartDate?: string
  notes?: string
}

export const useProfileStore = defineStore('profiles', () => {
  // ─── State ────────────────────────────────────────────────────────────────
  const profiles = ref<BabyProfile[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const activeProfileId = ref<string | null>(localStorage.getItem('pakulab_active_profile'))

  // ─── Computed ─────────────────────────────────────────────────────────────

  /** The active baby profile — matches activeProfileId, or falls back to first profile */
  const activeProfile = computed<BabyProfile | null>(() => {
    if (!profiles.value.length) return null
    if (activeProfileId.value) {
      const found = profiles.value.find((p) => p.id === activeProfileId.value)
      if (found) return found
    }
    return profiles.value[0] ?? null
  })

  // ─── Actions ──────────────────────────────────────────────────────────────

  async function fetchProfiles(): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const result = await apiClient.get<{ data: BabyProfile[] }>('/profiles')
      profiles.value = result.data
    } catch (err) {
      error.value = err instanceof ApiError
        ? err.message
        : 'Error al cargar los perfiles'
    } finally {
      loading.value = false
    }
  }

  async function createProfile(input: ProfileCreateInput): Promise<BabyProfile> {
    const result = await apiClient.post<{ data: BabyProfile }>('/profiles', input)
    profiles.value.push(result.data)
    return result.data
  }

  async function updateProfile(id: string, input: Partial<ProfileCreateInput>): Promise<BabyProfile> {
    const result = await apiClient.put<{ data: BabyProfile }>(`/profiles/${id}`, input)
    const idx = profiles.value.findIndex((p) => p.id === id)
    if (idx !== -1) profiles.value[idx] = result.data
    return result.data
  }

  async function deleteProfile(id: string): Promise<void> {
    await apiClient.delete(`/profiles/${id}`)
    profiles.value = profiles.value.filter((p) => p.id !== id)
  }

  function clearError(): void {
    error.value = null
  }

  function setActiveProfile(id: string): void {
    activeProfileId.value = id
    localStorage.setItem('pakulab_active_profile', id)
  }

  return {
    profiles,
    loading,
    error,
    activeProfileId,
    activeProfile,
    fetchProfiles,
    createProfile,
    updateProfile,
    deleteProfile,
    clearError,
    setActiveProfile,
  }
})
