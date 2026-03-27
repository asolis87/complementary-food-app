<template>
  <div class="config-step">
    <h2 class="config-title">Nuevo Plato</h2>
    <p class="config-subtitle">Configurá el plato de tu bebé</p>

    <!-- Plate name -->
    <div class="form-group">
      <label for="plate-name" class="form-label">Nombre del plato <span class="optional">(opcional)</span></label>
      <input
        id="plate-name"
        v-model="localName"
        type="text"
        class="form-input"
        placeholder="Mi Plato"
        maxlength="50"
        :aria-describedby="'plate-name-hint'"
      />
      <p id="plate-name-hint" class="form-hint">{{ localName.length }}/50</p>
    </div>

    <!-- Number of groups -->
    <div class="form-group">
      <p class="form-label" id="group-count-label">¿Cuántos grupos alimenticios?</p>
      <div class="group-toggle" role="group" aria-labelledby="group-count-label">
        <button
          class="toggle-btn"
          :class="{ active: localGroupCount === 4 }"
          :aria-pressed="localGroupCount === 4"
          @click="localGroupCount = 4"
        >
          <span class="toggle-icon">🍽️</span>
          <span class="toggle-main">4 grupos</span>
          <span class="toggle-sub">Frutas · Verduras · Proteínas · Cereales</span>
        </button>

        <button
          class="toggle-btn"
          :class="{ active: localGroupCount === 5 }"
          :aria-pressed="localGroupCount === 5"
          @click="localGroupCount = 5"
        >
          <span class="toggle-icon">🥑</span>
          <span class="toggle-main">5 grupos</span>
          <span class="toggle-sub">+ Grasas Saludables</span>
          <span class="toggle-badge">Recomendado</span>
        </button>
      </div>
    </div>

    <!-- Medical disclaimer (REQ-AL-02) -->
    <div class="disclaimer-banner" role="note">
      <span aria-hidden="true">⚕️</span>
      <p>Esta información es orientativa. No sustituye la consulta con tu pediatra.</p>
    </div>

    <!-- CTA -->
    <button class="create-btn" @click="handleCreate">
      Crear Plato →
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits<{
  create: [config: { name: string; groupCount: 4 | 5 }]
}>()

const localName = ref('Mi Plato')
const localGroupCount = ref<4 | 5>(4)

function handleCreate() {
  emit('create', {
    name: localName.value.trim() || 'Mi Plato',
    groupCount: localGroupCount.value,
  })
}
</script>

<style scoped>
.config-step {
  max-width: 480px;
  margin: 0 auto;
  padding: 1rem 0;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.config-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
}

.config-subtitle {
  margin: -1rem 0 0;
  color: #6b7280;
  font-size: 0.9rem;
}

/* Form */
.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.form-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  margin: 0;
}

.optional {
  font-weight: 400;
  color: #9ca3af;
}

.form-input {
  padding: 0.65rem 0.875rem;
  border: 2px solid #e5e7eb;
  border-radius: 0.75rem;
  font-size: 1rem;
  outline: none;
  transition: border-color 0.15s;
  color: #111827;
}

.form-input:focus {
  border-color: #10b981;
}

.form-hint {
  margin: 0;
  font-size: 0.7rem;
  color: #9ca3af;
  text-align: right;
}

/* Group toggle */
.group-toggle {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

@media (min-width: 480px) {
  .group-toggle {
    flex-direction: row;
  }
}

.toggle-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.2rem;
  padding: 1rem 1.25rem;
  border: 2px solid #e5e7eb;
  border-radius: 1rem;
  background: white;
  cursor: pointer;
  text-align: left;
  transition: all 0.15s;
  position: relative;
}

.toggle-btn:hover {
  border-color: #6ee7b7;
}

.toggle-btn.active {
  border-color: #10b981;
  background: #ecfdf5;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.15);
}

.toggle-icon {
  font-size: 1.5rem;
  margin-bottom: 0.25rem;
}

.toggle-main {
  font-size: 1rem;
  font-weight: 700;
  color: #111827;
}

.toggle-sub {
  font-size: 0.75rem;
  color: #6b7280;
}

.toggle-badge {
  position: absolute;
  top: 0.5rem;
  right: 0.75rem;
  background: #10b981;
  color: white;
  font-size: 0.65rem;
  font-weight: 700;
  padding: 0.15rem 0.4rem;
  border-radius: 9999px;
  text-transform: uppercase;
}

/* Disclaimer */
.disclaimer-banner {
  display: flex;
  gap: 0.5rem;
  align-items: flex-start;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 0.75rem;
  padding: 0.75rem 1rem;
  font-size: 0.8rem;
  color: #166534;
}

.disclaimer-banner p {
  margin: 0;
}

/* CTA */
.create-btn {
  padding: 0.875rem 1.5rem;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 0.875rem;
  font-size: 1.05rem;
  font-weight: 700;
  cursor: pointer;
  width: 100%;
  transition: background 0.15s;
  box-shadow: 0 3px 10px rgba(16, 185, 129, 0.35);
}

.create-btn:hover {
  background: #059669;
}

.create-btn:active {
  transform: scale(0.98);
}
</style>
