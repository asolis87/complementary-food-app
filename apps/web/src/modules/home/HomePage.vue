<template>
  <div class="home-page">

    <!-- ① Hero -->
    <section class="hero" aria-label="Bienvenida">
      <div class="hero-content">
        <div class="hero-badge" aria-hidden="true">
          <span class="material-symbols-outlined hero-badge-icon">eco</span>
          Alimentación Complementaria
        </div>

        <h1 class="hero-title">
          Alimentación complementaria,
          <span class="hero-highlight">simplificada.</span>
        </h1>

        <p class="hero-subtitle">
          Armá platos balanceados para tu bebé con el indicador de balance
          astringente/laxante. Gratis, sin registro, funciona sin internet.
        </p>

        <div class="hero-ctas">
          <RouterLink to="/plate/new" class="btn-primary" aria-label="Crear un plato ahora">
            <span class="material-symbols-outlined" aria-hidden="true">restaurant</span>
            Crear mi primer plato
            <span class="material-symbols-outlined btn-arrow" aria-hidden="true">arrow_forward</span>
          </RouterLink>
          <RouterLink to="/foods" class="btn-ghost" aria-label="Ver el catálogo de alimentos">
            ¿Cómo funciona?
          </RouterLink>
        </div>
      </div>

      <!-- Hero image visual -->
      <div class="hero-visual" aria-hidden="true">
        <div class="hero-image-wrap">
          <!-- Decorative blur circle behind the image -->
          <div class="hero-image-deco-circle" aria-hidden="true"></div>
          <div class="hero-image-container">
            <img
              src="/images/hero-baby-eating.png"
              alt="Bebé comiendo purés de vegetales con mucha alegría"
              class="hero-image"
              width="480"
              height="360"
            />
          </div>
        </div>

        <!-- Floating "Meta Diaria" card -->
        <div class="hero-meta-float">
          <div class="hero-meta-icon">
            <span class="material-symbols-outlined">nutrition</span>
          </div>
          <div class="hero-meta-body">
            <span class="hero-meta-label">Meta Diaria</span>
            <span class="hero-meta-value">Hierro y Vitamina C</span>
          </div>
        </div>
      </div>
    </section>

    <!-- ② Features / Bento Grid -->
    <section class="features-section" aria-label="Características principales">
      <header class="section-header">
        <h2 class="section-title">¿Qué podés hacer con Pakulab?</h2>
        <p class="section-subtitle">
          Todo lo que necesitás para la alimentación complementaria en un solo lugar.
        </p>
      </header>

      <div class="bento-grid" role="list">
        <!-- Wide card: Plate builder -->
        <article class="feature-card card-wide" role="listitem">
          <div class="feature-card-icon-wrap icon-primary">
            <span class="material-symbols-outlined feature-icon">restaurant</span>
          </div>
          <div class="feature-card-body">
            <h3 class="feature-title">Platos Equilibrados</h3>
            <p class="feature-desc">
              Armá el plato de tu bebé eligiendo de cada grupo de alimentos y visualizá la distribución
              en tiempo real. Grupos de 4 (básico) o 5 (con grasas saludables).
            </p>
          </div>
          <div class="feature-card-tags">
            <span class="tag tag-primary">
              <span class="material-symbols-outlined tag-icon">check</span>Interactivo
            </span>
            <span class="tag tag-secondary">
              <span class="material-symbols-outlined tag-icon">offline_bolt</span>Sin internet
            </span>
          </div>
          <!-- Plate builder image with hover overlay -->
          <div class="plate-builder-img-wrap">
            <img
              src="/images/plate-builder-food.png"
              alt="Plato de silicona dividido con aguacate, zanahorias y pasta para bebé"
              class="plate-builder-img"
              loading="lazy"
              width="480"
              height="300"
            />
            <div class="plate-builder-overlay" aria-hidden="true">
              <RouterLink to="/plate/new" class="btn-primary overlay-demo-btn" aria-label="Probar el armador de platos">
                <span class="material-symbols-outlined" aria-hidden="true">play_arrow</span>
                Probar Demo
              </RouterLink>
            </div>
          </div>
        </article>

        <!-- Catalog card -->
        <article class="feature-card" role="listitem">
          <div class="feature-card-icon-wrap icon-secondary">
            <span class="material-symbols-outlined feature-icon">menu_book</span>
          </div>
          <h3 class="feature-title">Catálogo de Alimentos</h3>
          <p class="feature-desc">
            102 alimentos mexicanos con clasificación A/L y edad mínima recomendada.
          </p>
        </article>

        <!-- Diary card -->
        <article class="feature-card" role="listitem">
          <div class="feature-card-icon-wrap icon-tertiary">
            <span class="material-symbols-outlined feature-icon">book</span>
          </div>
          <h3 class="feature-title">Bitácora del Bebé</h3>
          <p class="feature-desc">
            Registrá cada comida, reacción e hito del desarrollo. Identificá patrones y posibles alergias.
          </p>
        </article>

        <!-- Balance card -->
        <article class="feature-card card-accent" role="listitem">
          <div class="feature-card-icon-wrap icon-surface">
            <span class="material-symbols-outlined feature-icon">balance</span>
          </div>
          <h3 class="feature-title feature-title-accent">Indicador A/L</h3>
          <p class="feature-desc feature-desc-accent">
            Sabé al instante si el plato es astringente, laxante o equilibrado para cuidar la digestión.
          </p>
        </article>
      </div>
    </section>

    <!-- ③ How it works -->
    <section class="how-section" aria-label="Cómo funciona">
      <header class="section-header section-header-center">
        <h2 class="section-title">¿Cómo funciona?</h2>
        <p class="section-subtitle">Tres pasos y el plato de tu bebé está listo.</p>
      </header>

      <ol class="steps-list">
        <li class="step">
          <div class="step-number" aria-hidden="true">
            <span class="step-num-text">1</span>
          </div>
          <div class="step-connector" aria-hidden="true"></div>
          <div class="step-card">
            <div class="step-icon-wrap">
              <span class="material-symbols-outlined step-icon">menu_book</span>
            </div>
            <div class="step-body">
              <h3 class="step-title">Elegí los alimentos</h3>
              <p class="step-desc">
                Buscá entre 102 alimentos. Cada uno muestra su clasificación A/L y la edad mínima recomendada para introducirlo.
              </p>
            </div>
          </div>
        </li>

        <li class="step">
          <div class="step-number" aria-hidden="true">
            <span class="step-num-text">2</span>
          </div>
          <div class="step-connector" aria-hidden="true"></div>
          <div class="step-card">
            <div class="step-icon-wrap step-icon-secondary">
              <span class="material-symbols-outlined step-icon">restaurant</span>
            </div>
            <div class="step-body">
              <h3 class="step-title">Armá el plato</h3>
              <p class="step-desc">
                Distribuí los alimentos en los grupos del plato. El indicador de balance se actualiza en tiempo real.
              </p>
            </div>
          </div>
        </li>

        <li class="step">
          <div class="step-number" aria-hidden="true">
            <span class="step-num-text">3</span>
          </div>
          <div class="step-card">
            <div class="step-icon-wrap step-icon-tertiary">
              <span class="material-symbols-outlined step-icon">book</span>
            </div>
            <div class="step-body">
              <h3 class="step-title">Registrá en la bitácora</h3>
              <p class="step-desc">
                Guardá el plato en la bitácora, exportalo como imagen o compartilo con tu pediatra.
              </p>
              <!-- Baby food prep image with playful tilt -->
              <div class="baby-log-img-wrap">
                <img
                  src="/images/baby-food-prep.png"
                  alt="Preparación de comida para bebé en frascos de vidrio sobre la mesada"
                  class="baby-log-img"
                  loading="lazy"
                  width="320"
                  height="200"
                />
              </div>
            </div>
          </div>
        </li>
      </ol>
    </section>

    <!-- ④ Plate Preview / Balance showcase -->
    <section class="preview-section" aria-label="Vista previa del armador">
      <div class="preview-card">
        <div class="preview-content">
          <h2 class="preview-title">El Indicador de Equilibrio</h2>
          <p class="preview-body">
            Pakulab analiza el plato automáticamente. Con un solo vistazo sabés si la
            combinación es astringente, laxante o perfectamente equilibrada para la
            digestión de tu bebé.
          </p>
          <ul class="preview-features" role="list">
            <li class="preview-feature-item">
              <span class="preview-check" aria-hidden="true">
                <span class="material-symbols-outlined">check</span>
              </span>
              Información digestiva en tiempo real
            </li>
            <li class="preview-feature-item">
              <span class="preview-check" aria-hidden="true">
                <span class="material-symbols-outlined">check</span>
              </span>
              Sugerencias de reemplazo inteligentes
            </li>
            <li class="preview-feature-item">
              <span class="preview-check" aria-hidden="true">
                <span class="material-symbols-outlined">check</span>
              </span>
              Alertas de estreñimiento preventivas
            </li>
          </ul>
          <RouterLink to="/plate/new" class="btn-primary preview-cta" aria-label="Probar el armador de platos">
            <span class="material-symbols-outlined" aria-hidden="true">play_arrow</span>
            Probar ahora
          </RouterLink>
        </div>

        <div class="preview-visual" aria-hidden="true">
          <div class="balance-viz">
            <div class="balance-bars">
              <div class="balance-bar bar-astringente" style="--bar-h: 65%">
                <span class="bar-label">Astringente</span>
              </div>
              <div class="balance-bar bar-neutral" style="--bar-h: 100%">
                <span class="bar-label">Equilibrado</span>
              </div>
              <div class="balance-bar bar-laxante" style="--bar-h: 45%">
                <span class="bar-label">Laxante</span>
              </div>
            </div>
            <div class="balance-hint">
              <span class="material-symbols-outlined balance-hint-icon">info</span>
              <span class="balance-hint-text">Tu plato actual está <strong>equilibrado</strong></span>
            </div>
          </div>
          <div class="preview-deco-circle"></div>
        </div>
      </div>
    </section>

    <!-- ⑤ Final CTA -->
    <section class="cta-section" aria-label="Comenzar">
      <div class="cta-card">
        <span class="cta-deco-icon material-symbols-outlined" aria-hidden="true">flatware</span>
        <h2 class="cta-title">¿Lista para comenzar el viaje?</h2>
        <p class="cta-subtitle">
          No necesitás crear una cuenta. Empezá a armar platos ahora mismo, gratis.
        </p>
        <RouterLink to="/plate/new" class="btn-primary btn-large" aria-label="Ir al armador de platos">
          <span class="material-symbols-outlined" aria-hidden="true">restaurant</span>
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
/* ═══════════════════════════════════════════════
   Page wrapper
   ═══════════════════════════════════════════════ */
.home-page {
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-8);          /* 2.75rem section gaps */
  padding-bottom: var(--md3-space-6);
}

/* ═══════════════════════════════════════════════
   ① HERO
   ═══════════════════════════════════════════════ */
.hero {
  display: flex;
  align-items: center;
  gap: var(--md3-space-8);
  flex-wrap: wrap;
  padding-top: var(--md3-space-8);
  padding-bottom: var(--md3-space-6);
}

.hero-content {
  flex: 1;
  min-width: 280px;
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-4);
}

/* Badge */
.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--md3-space-2);
  background: var(--md3-primary-container);
  color: var(--md3-on-primary-container);
  border-radius: var(--md3-rounded-full);
  padding: 0.3rem 0.875rem;
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-md);
  font-weight: var(--md3-weight-bold);
  letter-spacing: var(--md3-label-tracking);
  width: fit-content;
}

.hero-badge-icon {
  font-size: 1rem;
  font-variation-settings: 'FILL' 1;
}

/* Title */
.hero-title {
  margin: 0;
  font-family: var(--md3-font-headline);
  font-size: clamp(var(--md3-headline-lg), 5vw, var(--md3-display-lg));
  font-weight: var(--md3-weight-bold);
  color: var(--md3-on-surface);
  line-height: var(--md3-display-line-height);
  letter-spacing: var(--md3-display-tracking);
}

.hero-highlight {
  color: var(--md3-primary);
}

/* Subtitle */
.hero-subtitle {
  margin: 0;
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-lg);
  color: var(--md3-on-surface-variant);
  line-height: var(--md3-body-line-height);
  max-width: 460px;
}

/* CTAs */
.hero-ctas {
  display: flex;
  gap: var(--md3-space-3);
  flex-wrap: wrap;
  padding-top: var(--md3-space-2);
}

/* ── Buttons ── */
.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.875rem 1.5rem;
  background: var(--md3-gradient-cta);
  color: var(--md3-on-primary);
  border-radius: var(--md3-rounded-full);
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-lg);
  font-weight: var(--md3-weight-semibold);
  text-decoration: none;
  box-shadow: var(--md3-shadow-card);
  transition:
    background var(--md3-transition-fast),
    transform var(--md3-transition-fast),
    box-shadow var(--md3-transition-fast);
  cursor: pointer;
}

.btn-primary:hover {
  background: var(--md3-gradient-cta-hover);
  transform: translateY(-1px);
  box-shadow: var(--md3-shadow-elevated);
}

.btn-primary:active {
  transform: scale(0.97);
}

.btn-arrow {
  font-size: 1.1rem;
}

.btn-ghost {
  display: inline-flex;
  align-items: center;
  padding: 0.875rem 1.5rem;
  background: var(--md3-secondary-container);
  color: var(--md3-on-secondary-container);
  border-radius: var(--md3-rounded-full);
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-lg);
  font-weight: var(--md3-weight-semibold);
  text-decoration: none;
  transition:
    background var(--md3-transition-fast),
    transform var(--md3-transition-fast);
}

.btn-ghost:hover {
  background: var(--md3-surface-container-high);
  transform: translateY(-1px);
}

.btn-large {
  font-size: var(--md3-body-lg);
  padding: 1rem 2rem;
}

/* ── Hero visual ── */
.hero-visual {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--md3-space-3);
  position: relative;
  max-width: 480px;
  width: 100%;
}

/* Hero image container */
.hero-image-wrap {
  position: relative;
  width: 100%;
}

.hero-image-deco-circle {
  position: absolute;
  inset: -24px;
  background: var(--md3-primary-container);
  border-radius: 50%;
  opacity: 0.2;
  filter: blur(48px);
  pointer-events: none;
  z-index: 0;
}

.hero-image-container {
  position: relative;
  z-index: 1;
  overflow: hidden;
  border-radius: var(--md3-rounded-lg);
  box-shadow: var(--md3-shadow-ambient);
  aspect-ratio: 4 / 3;
}

.hero-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform var(--md3-transition-normal);
}

.hero-image-container:hover .hero-image {
  transform: scale(1.05);
}

/* Floating "Meta Diaria" card */
.hero-meta-float {
  display: flex;
  align-items: center;
  gap: var(--md3-space-3);
  background: var(--md3-surface-container-lowest);
  border-radius: var(--md3-rounded-md);
  padding: var(--md3-space-3) var(--md3-space-4);
  box-shadow: var(--md3-shadow-ambient);
  align-self: flex-end;
  margin-right: var(--md3-space-4);
}

.hero-meta-icon {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--md3-tertiary-container);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--md3-on-tertiary-container);
  flex-shrink: 0;
}

.hero-meta-icon .material-symbols-outlined {
  font-variation-settings: 'FILL' 1;
}

.hero-meta-body {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.hero-meta-label {
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-sm);
  font-weight: var(--md3-weight-bold);
  color: var(--md3-on-surface-variant);
  text-transform: uppercase;
  letter-spacing: var(--md3-label-tracking);
}

.hero-meta-value {
  font-family: var(--md3-font-headline);
  font-size: var(--md3-title-md);
  font-weight: var(--md3-weight-bold);
  color: var(--md3-on-surface);
}


/* ═══════════════════════════════════════════════
   Section shared helpers
   ═══════════════════════════════════════════════ */
.section-header {
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-2);
}

.section-header-center {
  align-items: center;
  text-align: center;
}

.section-title {
  margin: 0;
  font-family: var(--md3-font-headline);
  font-size: var(--md3-headline-lg);
  font-weight: var(--md3-weight-bold);
  color: var(--md3-on-surface);
  letter-spacing: var(--md3-headline-tracking);
  line-height: var(--md3-headline-line-height);
}

.section-subtitle {
  margin: 0;
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-lg);
  color: var(--md3-on-surface-variant);
  line-height: var(--md3-body-line-height);
  max-width: 520px;
}


/* ═══════════════════════════════════════════════
   ② FEATURES / BENTO GRID
   ═══════════════════════════════════════════════ */
.features-section {
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-6);
  background: var(--md3-surface-container-low);
  border-radius: var(--md3-rounded-lg);
  padding: var(--md3-space-6);
}

.bento-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--md3-space-3);
}

/* Cards */
.feature-card {
  background: var(--md3-surface-container-lowest);
  border-radius: var(--md3-rounded-lg);
  padding: var(--md3-space-6);
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-3);
  box-shadow: var(--md3-shadow-ambient);
  transition: box-shadow var(--md3-transition-normal), transform var(--md3-transition-normal);
}

.feature-card:hover {
  box-shadow: var(--md3-shadow-card);
  transform: translateY(-2px);
}

/* Accent card (balance) */
.card-accent {
  background: var(--md3-primary);
}

/* Icon wrap */
.feature-card-icon-wrap {
  width: 52px;
  height: 52px;
  border-radius: var(--md3-rounded-md);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.icon-primary {
  background: var(--md3-primary-container);
  color: var(--md3-on-primary-container);
}

.icon-secondary {
  background: var(--md3-secondary-container);
  color: var(--md3-on-secondary-container);
}

.icon-tertiary {
  background: var(--md3-tertiary-container);
  color: var(--md3-on-tertiary-container);
}

.icon-surface {
  background: var(--md3-surface-container-low);
  color: var(--md3-on-surface);
}

.feature-icon {
  font-size: 1.75rem;
  font-variation-settings: 'FILL' 1;
}

.feature-card-body {
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-2);
}

.feature-title {
  margin: 0;
  font-family: var(--md3-font-headline);
  font-size: var(--md3-headline-sm);
  font-weight: var(--md3-weight-bold);
  color: var(--md3-on-surface);
  line-height: var(--md3-title-line-height);
}

.feature-title-accent {
  color: var(--md3-on-primary);
}

.feature-desc {
  margin: 0;
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-md);
  color: var(--md3-on-surface-variant);
  line-height: var(--md3-body-line-height);
}

.feature-desc-accent {
  color: var(--md3-primary-container);
}

/* Tags on the wide card */
.feature-card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--md3-space-2);
  margin-top: auto;
}

.tag {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.75rem;
  border-radius: var(--md3-rounded-full);
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-sm);
  font-weight: var(--md3-weight-bold);
}

.tag-icon { font-size: 0.875rem; }

.tag-primary {
  background: var(--md3-primary-container);
  color: var(--md3-on-primary-container);
}

.tag-secondary {
  background: var(--md3-secondary-container);
  color: var(--md3-on-secondary-container);
}

/* Plate builder image (inside card-wide) */
.plate-builder-img-wrap {
  position: relative;
  background: var(--md3-surface-container-high);
  border-radius: var(--md3-rounded-lg);
  overflow: hidden;
  margin-top: var(--md3-space-2);
  width: 100%;
}

.plate-builder-img {
  width: 100%;
  height: auto;
  object-fit: cover;
  display: block;
  max-height: 240px;
}

.plate-builder-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity var(--md3-transition-normal);
}

.plate-builder-img-wrap:hover .plate-builder-overlay {
  opacity: 1;
}

.overlay-demo-btn {
  background: color-mix(in srgb, var(--md3-primary) 85%, transparent);
  backdrop-filter: blur(4px);
}


/* ═══════════════════════════════════════════════
   ③ HOW IT WORKS
   ═══════════════════════════════════════════════ */
.how-section {
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-6);
}

.steps-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-3);
}

.step {
  display: flex;
  align-items: flex-start;
  gap: var(--md3-space-3);
  position: relative;
}

/* Vertical connector line between steps (pseudo-element on parent li) */
.step:not(:last-child)::after {
  content: '';
  position: absolute;
  left: 21px;
  top: 44px;
  width: 2px;
  /* height from bottom of circle to end of the gap */
  height: calc(100% + var(--md3-space-3));
  background: var(--md3-surface-container-high);
}

.step-number {
  width: 44px;
  height: 44px;
  background: var(--md3-gradient-cta);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  z-index: 1;
}

.step-num-text {
  font-family: var(--md3-font-headline);
  font-size: var(--md3-title-md);
  font-weight: var(--md3-weight-bold);
  color: var(--md3-on-primary);
}

/* Remove unused connector div — keep it hidden */
.step-connector {
  display: none;
}

.step-card {
  flex: 1;
  background: var(--md3-surface-container-lowest);
  border-radius: var(--md3-rounded-md);
  padding: var(--md3-space-4) var(--md3-space-6);
  display: flex;
  align-items: flex-start;
  gap: var(--md3-space-3);
  box-shadow: var(--md3-shadow-soft);
}

.step-icon-wrap {
  width: 40px;
  height: 40px;
  border-radius: var(--md3-rounded-sm);
  background: var(--md3-primary-container);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.step-icon-secondary { background: var(--md3-secondary-container); }
.step-icon-tertiary  { background: var(--md3-tertiary-container); }

.step-icon {
  font-size: 1.25rem;
  font-variation-settings: 'FILL' 1;
  color: var(--md3-on-primary-container);
}

.step-icon-secondary .step-icon { color: var(--md3-on-secondary-container); }
.step-icon-tertiary  .step-icon { color: var(--md3-on-tertiary-container); }

.step-body {
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-1);
}

.step-title {
  margin: 0;
  font-family: var(--md3-font-headline);
  font-size: var(--md3-title-md);
  font-weight: var(--md3-weight-bold);
  color: var(--md3-on-surface);
}

.step-desc {
  margin: 0;
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-md);
  color: var(--md3-on-surface-variant);
  line-height: var(--md3-body-line-height);
}

/* Baby log image — playful tilt */
.baby-log-img-wrap {
  overflow: hidden;
  border-radius: var(--md3-rounded-lg);
  box-shadow: var(--md3-shadow-ambient);
  margin-top: var(--md3-space-3);
  transform: rotate(2deg);
  transition: transform var(--md3-transition-normal);
  max-width: 100%;
}

.baby-log-img-wrap:hover {
  transform: rotate(0deg);
}

.baby-log-img {
  width: 100%;
  height: auto;
  object-fit: cover;
  display: block;
  max-height: 200px;
}


/* ═══════════════════════════════════════════════
   ④ PLATE PREVIEW / BALANCE SHOWCASE
   ═══════════════════════════════════════════════ */
.preview-section {
  display: flex;
  flex-direction: column;
}

.preview-card {
  background: var(--md3-surface-container-low);
  border-radius: var(--md3-rounded-lg);
  padding: var(--md3-space-8);
  display: flex;
  flex-wrap: wrap;
  gap: var(--md3-space-8);
  align-items: center;
}

.preview-content {
  flex: 1;
  min-width: 260px;
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-4);
}

.preview-title {
  margin: 0;
  font-family: var(--md3-font-headline);
  font-size: var(--md3-headline-lg);
  font-weight: var(--md3-weight-bold);
  color: var(--md3-on-surface);
  letter-spacing: var(--md3-headline-tracking);
  line-height: var(--md3-headline-line-height);
}

.preview-body {
  margin: 0;
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-lg);
  color: var(--md3-on-surface-variant);
  line-height: var(--md3-body-line-height);
}

.preview-features {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-3);
}

.preview-feature-item {
  display: flex;
  align-items: center;
  gap: var(--md3-space-2);
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-md);
  font-weight: var(--md3-weight-medium);
  color: var(--md3-on-surface);
}

.preview-check {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--md3-primary-container);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.preview-check .material-symbols-outlined {
  font-size: 0.875rem;
  color: var(--md3-on-primary-container);
  font-weight: 700;
}

.preview-cta {
  width: fit-content;
  margin-top: var(--md3-space-2);
}

/* Balance viz */
.preview-visual {
  flex: 1;
  min-width: 220px;
  position: relative;
}

.balance-viz {
  background: var(--md3-surface-container-lowest);
  border-radius: var(--md3-rounded-md);
  padding: var(--md3-space-6);
  box-shadow: var(--md3-shadow-ambient);
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-4);
  position: relative;
  z-index: 1;
}

.balance-bars {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: var(--md3-space-3);
  height: 140px;
}

.balance-bar {
  flex: 1;
  height: var(--bar-h);
  border-radius: var(--md3-rounded-full) var(--md3-rounded-full) 0 0;
  position: relative;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: var(--md3-space-2);
  transition: height var(--md3-transition-normal);
}

.bar-astringente { background: var(--md3-secondary-container); }
.bar-neutral     { background: var(--md3-primary-container); }
.bar-laxante     { background: var(--md3-tertiary-container); }

.bar-label {
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-sm);
  font-weight: var(--md3-weight-bold);
  color: var(--md3-on-surface-variant);
  white-space: nowrap;
  position: absolute;
  bottom: calc(-1 * var(--md3-space-4));
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.6rem;
}

.balance-hint {
  display: flex;
  align-items: center;
  gap: var(--md3-space-2);
  background: var(--md3-surface-container-low);
  border-radius: var(--md3-rounded-sm);
  padding: var(--md3-space-2) var(--md3-space-3);
}

.balance-hint-icon {
  font-size: 1.1rem;
  color: var(--md3-primary);
  flex-shrink: 0;
}

.balance-hint-text {
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-sm);
  color: var(--md3-on-surface-variant);
}

.preview-deco-circle {
  width: 120px;
  height: 120px;
  background: var(--md3-tertiary-container);
  border-radius: 50%;
  position: absolute;
  bottom: -24px;
  right: -24px;
  z-index: 0;
  opacity: 0.4;
}


/* ═══════════════════════════════════════════════
   ⑤ FINAL CTA
   ═══════════════════════════════════════════════ */
.cta-section {
  display: flex;
  flex-direction: column;
}

.cta-card {
  background: var(--md3-primary-container);
  border-radius: var(--md3-rounded-lg);
  padding: var(--md3-space-8) var(--md3-space-6);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--md3-space-4);
  text-align: center;
  position: relative;
  overflow: hidden;
}

.cta-deco-icon {
  font-size: 5rem;
  color: var(--md3-on-primary-container);
  opacity: 0.12;
  position: absolute;
  top: -0.5rem;
  right: 0.5rem;
  pointer-events: none;
  font-variation-settings: 'FILL' 1;
}

.cta-title {
  margin: 0;
  font-family: var(--md3-font-headline);
  font-size: var(--md3-headline-lg);
  font-weight: var(--md3-weight-bold);
  color: var(--md3-on-primary-container);
  letter-spacing: var(--md3-headline-tracking);
  line-height: var(--md3-headline-line-height);
  position: relative;
  z-index: 1;
}

.cta-subtitle {
  margin: 0;
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-lg);
  color: var(--md3-on-primary-container);
  opacity: 0.8;
  max-width: 420px;
  line-height: var(--md3-body-line-height);
  position: relative;
  z-index: 1;
}

.cta-card .btn-primary {
  position: relative;
  z-index: 1;
}

.cta-note {
  margin: 0;
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-sm);
  color: var(--md3-on-primary-container);
  opacity: 0.7;
  position: relative;
  z-index: 1;
}

.cta-note a {
  color: var(--md3-on-primary-container);
  text-decoration: underline;
  text-underline-offset: 2px;
  text-decoration-color: var(--md3-primary);
  font-weight: var(--md3-weight-semibold);
}

.cta-note a:hover {
  opacity: 0.85;
}


/* ═══════════════════════════════════════════════
   Medical disclaimer
   ═══════════════════════════════════════════════ */
.home-disclaimer {
  justify-content: center;
}


/* ═══════════════════════════════════════════════
   RESPONSIVE — Desktop ≥ 768px
   ═══════════════════════════════════════════════ */
@media (min-width: 768px) {
  .home-page {
    gap: var(--md3-space-12);
  }

  /* Hero: side by side */
  .hero {
    flex-wrap: nowrap;
    gap: var(--md3-space-12);
  }

  .hero-visual {
    max-width: 420px;
    flex-shrink: 0;
  }

  .hero-title {
    font-size: var(--md3-display-lg);
  }

  /* Bento grid: 2 columns with wide card spanning both */
  .bento-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .card-wide {
    grid-column: 1 / -1;
    flex-direction: row;
    gap: var(--md3-space-6);
    align-items: flex-start;
  }

  .card-wide .feature-card-icon-wrap {
    flex-shrink: 0;
  }

  .card-wide .feature-card-body {
    flex: 1;
  }

  .card-wide .feature-card-tags {
    flex-shrink: 0;
    flex-direction: column;
    align-items: flex-end;
    margin-top: 0;
  }

  /* Plate builder image — right column on desktop */
  .card-wide .plate-builder-img-wrap {
    flex-shrink: 0;
    width: 260px;
    margin-top: 0;
    align-self: stretch;
  }

  .card-wide .plate-builder-img {
    max-height: none;
    height: 100%;
    object-fit: cover;
  }

  /* Steps: horizontal layout — each step is a column */
  .steps-list {
    flex-direction: row;
    gap: var(--md3-space-6);
    align-items: flex-start;
  }

  .step {
    flex: 1;
    flex-direction: column;
    align-items: center;
    gap: var(--md3-space-3);
  }

  /* No vertical connector on desktop (steps are horizontal) */
  .step:not(:last-child)::after {
    display: none;
  }

  .step-card {
    flex-direction: column;
    align-items: flex-start;
    text-align: left;
    width: 100%;
    box-sizing: border-box;
  }

  /* Preview: side by side */
  .preview-card {
    flex-wrap: nowrap;
  }

  /* CTA title bigger on desktop */
  .cta-title {
    font-size: var(--md3-headline-lg);
  }

  .cta-card {
    padding: var(--md3-space-12) var(--md3-space-16);
  }
}
</style>
