<template>
  <div class="home-page">
    <!-- ① Hero -->
    <section class="hero" aria-label="Bienvenida">
      <div class="hero-content">
        <div class="hero-badge" aria-hidden="true">🥦 Alimentación Complementaria</div>
        <h1 class="hero-title">
          Armá platos balanceados<br />
          <span class="hero-highlight">para tu bebé</span>
        </h1>
        <p class="hero-subtitle">
          La primera app de alimentación complementaria con balance astringente/laxante.
          Gratis, sin registro, funciona sin internet.
        </p>
        <div class="hero-ctas">
          <RouterLink to="/plate/new" class="cta-primary" aria-label="Crear un plato ahora">
            <span aria-hidden="true">🍽️</span>
            Crear un plato
          </RouterLink>
          <RouterLink to="/foods" class="cta-secondary" aria-label="Ver el catálogo de alimentos">
            Ver alimentos
          </RouterLink>
        </div>
      </div>

      <!-- Plate illustration -->
      <div class="hero-visual" aria-hidden="true">
        <div class="plate-preview">
          <div class="plate-circle">
            <div class="plate-slice slice-1">🍎</div>
            <div class="plate-slice slice-2">🥦</div>
            <div class="plate-slice slice-3">🥩</div>
            <div class="plate-slice slice-4">🌽</div>
            <div class="plate-center">🍽️</div>
          </div>
          <div class="balance-pill balance-green">✓ Equilibrado</div>
        </div>
      </div>
    </section>

    <!-- ② Features -->
    <section class="features-section" aria-label="Características principales">
      <h2 class="section-title">¿Qué podés hacer con CFA?</h2>
      <div class="features-grid" role="list">
        <article class="feature-card" role="listitem">
          <div class="feature-icon" aria-hidden="true">🍽️</div>
          <h3 class="feature-title">Plato Interactivo</h3>
          <p class="feature-desc">
            Armá el plato de tu bebé eligiendo alimentos de cada grupo y visualizá cómo quedan distribuidos.
          </p>
        </article>
        <article class="feature-card" role="listitem">
          <div class="feature-icon" aria-hidden="true">🚦</div>
          <h3 class="feature-title">Balance A/L</h3>
          <p class="feature-desc">
            Sabé al instante si el plato es astringente, laxante o equilibrado. Ideal para cuando el bebé tiene problemas digestivos.
          </p>
        </article>
        <article class="feature-card" role="listitem">
          <div class="feature-icon" aria-hidden="true">📱</div>
          <h3 class="feature-title">Funciona sin internet</h3>
          <p class="feature-desc">
            Instalala como app en tu celular y usala en la cocina sin WiFi. El catálogo completo de 102 alimentos está disponible offline.
          </p>
        </article>
      </div>
    </section>

    <!-- ③ How it works -->
    <section class="how-section" aria-label="Cómo funciona">
      <h2 class="section-title">¿Cómo funciona?</h2>
      <ol class="steps-list">
        <li class="step">
          <div class="step-number" aria-hidden="true">1</div>
          <div class="step-body">
            <h3 class="step-title">Elegí los grupos de alimentos</h3>
            <p class="step-desc">
              Seleccioná si tu plato tendrá 4 grupos (básico) o 5 grupos (completo, incluye grasas saludables).
            </p>
          </div>
        </li>
        <li class="step">
          <div class="step-number" aria-hidden="true">2</div>
          <div class="step-body">
            <h3 class="step-title">Agregá alimentos al plato</h3>
            <p class="step-desc">
              Buscá entre 102 alimentos mexicanos para bebés. Cada uno muestra su clasificación A/L y edad mínima recomendada.
            </p>
          </div>
        </li>
        <li class="step">
          <div class="step-number" aria-hidden="true">3</div>
          <div class="step-body">
            <h3 class="step-title">Revisá el balance y exportá</h3>
            <p class="step-desc">
              El indicador te muestra si el plato está equilibrado. Exportalo como imagen para compartir con tu pediatra.
            </p>
          </div>
        </li>
      </ol>
    </section>

    <!-- ④ Final CTA -->
    <section class="cta-section" aria-label="Comenzar">
      <div class="cta-card">
        <h2 class="cta-title">Empezá gratis, sin registro</h2>
        <p class="cta-subtitle">
          No necesitás crear una cuenta para usar CFA. Empezá a armar platos ahora mismo.
        </p>
        <RouterLink to="/plate/new" class="cta-primary cta-large" aria-label="Ir al armador de platos">
          <span aria-hidden="true">🍽️</span>
          Armar mi primer plato
        </RouterLink>
        <p class="cta-note">
          ¿Querés guardar tus platos?
          <RouterLink to="/auth/signup">Creá una cuenta gratis</RouterLink>
          o <RouterLink to="/pricing">conocé el Plan Pro</RouterLink>.
        </p>
      </div>
    </section>

    <!-- Medical disclaimer -->
    <MedicalDisclaimer variant="inline" class="home-disclaimer" />
  </div>
</template>

<script setup lang="ts">
import MedicalDisclaimer from '@/shared/components/MedicalDisclaimer.vue'
</script>

<style scoped>
.home-page {
  max-width: 800px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 3rem;
  padding-bottom: 2rem;
}

/* ── Hero ── */
.hero {
  display: flex;
  align-items: center;
  gap: 2rem;
  flex-wrap: wrap;
  padding: 2rem 0 1rem;
}

.hero-content {
  flex: 1;
  min-width: 280px;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.hero-badge {
  display: inline-block;
  background: #ecfdf5;
  color: #059669;
  border: 1px solid #6ee7b7;
  border-radius: 9999px;
  padding: 0.3rem 0.875rem;
  font-size: 0.8rem;
  font-weight: 700;
  width: fit-content;
}

.hero-title {
  margin: 0;
  font-size: clamp(1.5rem, 5vw, 2.25rem);
  font-weight: 900;
  color: #111827;
  line-height: 1.2;
}

.hero-highlight {
  color: #16a34a;
}

.hero-subtitle {
  margin: 0;
  font-size: 1rem;
  color: #6b7280;
  line-height: 1.6;
  max-width: 420px;
}

.hero-ctas {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.cta-primary {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.8rem 1.5rem;
  background: #16a34a;
  color: white;
  border-radius: 9999px;
  font-size: 0.95rem;
  font-weight: 700;
  text-decoration: none;
  box-shadow: 0 2px 12px rgba(22, 163, 74, 0.3);
  transition: background 0.15s, transform 0.1s;
}

.cta-primary:hover {
  background: #15803d;
  transform: translateY(-1px);
}

.cta-secondary {
  display: inline-flex;
  align-items: center;
  padding: 0.8rem 1.5rem;
  background: white;
  color: #374151;
  border: 2px solid #e5e7eb;
  border-radius: 9999px;
  font-size: 0.95rem;
  font-weight: 600;
  text-decoration: none;
  transition: border-color 0.15s;
}

.cta-secondary:hover {
  border-color: #16a34a;
  color: #16a34a;
}

/* Plate visual */
.hero-visual {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.plate-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.plate-circle {
  width: 180px;
  height: 180px;
  border-radius: 50%;
  border: 4px solid #e5e7eb;
  background: #fafafa;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.plate-slice {
  position: absolute;
  font-size: 1.75rem;
}

.slice-1 { top: 16px; left: 50%; transform: translateX(-50%); }
.slice-2 { right: 16px; top: 50%; transform: translateY(-50%); }
.slice-3 { bottom: 16px; left: 50%; transform: translateX(-50%); }
.slice-4 { left: 16px; top: 50%; transform: translateY(-50%); }

.plate-center {
  font-size: 2rem;
  z-index: 1;
}

.balance-pill {
  padding: 0.35rem 1rem;
  border-radius: 9999px;
  font-size: 0.8rem;
  font-weight: 700;
}

.balance-green {
  background: #dcfce7;
  color: #16a34a;
  border: 1px solid #86efac;
}

/* ── Features ── */
.features-section,
.how-section,
.cta-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.section-title {
  margin: 0;
  font-size: 1.35rem;
  font-weight: 800;
  color: #111827;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1rem;
}

.feature-card {
  background: white;
  border: 1px solid #f3f4f6;
  border-radius: 1rem;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  transition: box-shadow 0.15s;
}

.feature-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.feature-icon {
  font-size: 2rem;
}

.feature-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: #111827;
}

.feature-desc {
  margin: 0;
  font-size: 0.85rem;
  color: #6b7280;
  line-height: 1.6;
}

/* ── Steps ── */
.steps-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.step {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
}

.step-number {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  background: #16a34a;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  font-weight: 800;
}

.step-body {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.step-title {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 700;
  color: #111827;
}

.step-desc {
  margin: 0;
  font-size: 0.85rem;
  color: #6b7280;
  line-height: 1.6;
}

/* ── CTA Section ── */
.cta-card {
  background: linear-gradient(135deg, #f0fdf4, #dcfce7);
  border: 1px solid #86efac;
  border-radius: 1.5rem;
  padding: 2.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  text-align: center;
}

.cta-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 800;
  color: #111827;
}

.cta-subtitle {
  margin: 0;
  font-size: 0.95rem;
  color: #4b5563;
  max-width: 400px;
  line-height: 1.6;
}

.cta-large {
  font-size: 1.05rem;
  padding: 1rem 2rem;
}

.cta-note {
  margin: 0;
  font-size: 0.8rem;
  color: #6b7280;
}

.cta-note a {
  color: #16a34a;
  text-decoration: none;
  font-weight: 600;
}

.cta-note a:hover {
  text-decoration: underline;
}

/* Disclaimer */
.home-disclaimer {
  justify-content: center;
}
</style>
