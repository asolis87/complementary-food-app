<template>
  <div class="legal-page">
    <div class="legal-content">
      <RouterLink to="/" class="back-link" aria-label="Volver al inicio">
        <span class="material-symbols-outlined back-icon" aria-hidden="true">arrow_back</span>
        Volver
      </RouterLink>

      <h1 class="page-title">Términos de Uso</h1>
      <p class="effective-date">Vigente desde: marzo 2026</p>

      <p class="intro">
        Al usar <strong>Pakulab — Alimentación Complementaria</strong> (en adelante "Pakulab"), aceptás los siguientes términos. Si no estás de acuerdo, por favor no uses la aplicación.
      </p>

      <!-- Medical disclaimer — highlighted -->
      <div class="medical-disclaimer" role="note" aria-label="Aviso médico importante">
        <div class="disclaimer-icon-wrap" aria-hidden="true">
          <span class="material-symbols-outlined disclaimer-icon">stethoscope</span>
        </div>
        <div class="disclaimer-body">
          <strong>Pakulab NO sustituye al pediatra.</strong>
          <p>
            Esta aplicación es una <strong>herramienta informativa</strong>. No es un dispositivo médico y no debe usarse como sustituto de la atención médica profesional. <strong>Siempre consultá a tu pediatra</strong> antes de introducir nuevos alimentos, especialmente si tu bebé tiene alergias, condiciones médicas o necesidades especiales.
          </p>
        </div>
      </div>

      <section class="legal-section" aria-labelledby="sec-uso">
        <h2 id="sec-uso">1. Uso de la aplicación</h2>
        <p>
          Pakulab es una <strong>herramienta informativa</strong> diseñada para ayudar a padres y cuidadores a planificar la alimentación complementaria de bebés. La app <strong>NO es un dispositivo médico</strong> y no debe usarse como sustituto de la atención médica profesional.
        </p>
        <p>
          <strong>Siempre consultá a tu pediatra</strong> antes de introducir nuevos alimentos, especialmente si tu bebé tiene alergias, condiciones médicas o necesidades especiales.
        </p>
      </section>

      <section class="legal-section" aria-labelledby="sec-informativa">
        <h2 id="sec-informativa">2. Carácter informativo</h2>
        <p>
          La clasificación astringente/laxante (A/L) de los alimentos es orientativa y se basa en fuentes médicas generales. Estas clasificaciones pueden variar según el individuo, la preparación del alimento y la cantidad consumida.
        </p>
        <p>
          Pakulab no garantiza resultados específicos en la digestión o salud de tu bebé basados en el uso de esta herramienta.
        </p>
      </section>

      <section class="legal-section" aria-labelledby="sec-cuentas">
        <h2 id="sec-cuentas">3. Cuentas de usuario</h2>
        <p>
          Podés usar Pakulab de forma anónima (sin registro). Si creás una cuenta, sos responsable de mantener la seguridad de tus credenciales. Notificanos de inmediato si sospechás acceso no autorizado.
        </p>
      </section>

      <section class="legal-section" aria-labelledby="sec-suscripcion">
        <h2 id="sec-suscripcion">4. Suscripción Pro</h2>
        <ul>
          <li><strong>Período de prueba</strong> — Si se ofrece, el período de prueba gratuito dura el tiempo indicado al momento de la suscripción.</li>
          <li><strong>Renovación automática</strong> — La suscripción Pro se renueva automáticamente cada mes (o año, según el plan elegido) hasta que la cancelés.</li>
          <li><strong>Cancelación</strong> — Podés cancelar en cualquier momento desde tu perfil. El acceso Pro se mantiene hasta el final del período ya pagado.</li>
          <li><strong>Reembolsos</strong> — No ofrecemos reembolsos por períodos parciales, salvo lo requerido por la legislación aplicable.</li>
          <li><strong>Precios</strong> — Nos reservamos el derecho de modificar los precios con previo aviso.</li>
        </ul>
      </section>

      <section class="legal-section" aria-labelledby="sec-propiedad">
        <h2 id="sec-propiedad">5. Propiedad intelectual</h2>
        <p>
          Todo el contenido de Pakulab (diseño, código, textos, datos de alimentos) es propiedad de Pakulab o de sus licenciantes. No podés reproducir, distribuir ni crear trabajos derivados sin autorización expresa.
        </p>
        <p>
          Los datos que vos generás (platos, bitácora) son tuyos. Podés exportarlos o solicitar su eliminación en cualquier momento.
        </p>
      </section>

      <section class="legal-section" aria-labelledby="sec-limitacion">
        <h2 id="sec-limitacion">6. Limitación de responsabilidad</h2>
        <p>
          En la máxima medida permitida por la ley, Pakulab no será responsable por daños directos, indirectos, incidentales o consecuentes derivados del uso o la imposibilidad de uso de la aplicación.
        </p>
        <p>
          Pakulab se provee "tal como está" y "según disponibilidad". No garantizamos disponibilidad ininterrumpida del servicio.
        </p>
      </section>

      <section class="legal-section" aria-labelledby="sec-jurisdiccion">
        <h2 id="sec-jurisdiccion">7. Jurisdicción</h2>
        <p>
          Estos términos se rigen por las leyes de los Estados Unidos Mexicanos. Cualquier controversia será sometida a los tribunales competentes de la Ciudad de México, renunciando a cualquier otro fuero que pudiera corresponder.
        </p>
      </section>

      <section class="legal-section" aria-labelledby="sec-cambios-terminos">
        <h2 id="sec-cambios-terminos">8. Cambios a los términos</h2>
        <p>
          Podemos actualizar estos términos. Los cambios materiales se notificarán con al menos 15 días de anticipación. El uso continuado de Pakulab después de esa fecha implica aceptación de los nuevos términos.
        </p>
      </section>

      <section class="legal-section" aria-labelledby="sec-contacto-terminos">
        <h2 id="sec-contacto-terminos">9. Contacto</h2>
        <p>
          Para consultas sobre estos términos: <a href="mailto:legal@pakulab.mx">legal@pakulab.mx</a>
        </p>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
// T-031: Terms of Service
</script>

<style scoped>
.legal-page {
  max-width: 800px;
  margin: 0 auto;
  padding: var(--md3-space-3) var(--md3-space-3) var(--md3-space-12);
}

.legal-content {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: var(--md3-space-1);
  color: var(--md3-primary);
  text-decoration: none;
  font-size: var(--md3-body-md);
  font-weight: var(--md3-weight-semibold);
  margin-bottom: var(--md3-space-4);
  transition: color var(--md3-transition-fast);
}

.back-link:hover {
  color: var(--md3-primary-dim);
  text-decoration: underline;
}

.back-icon {
  font-size: 1.125rem !important;
}

.page-title {
  margin: 0 0 var(--md3-space-1);
  font-family: var(--md3-font-headline);
  font-size: var(--md3-headline-md);
  font-weight: var(--md3-weight-bold);
  color: var(--md3-on-surface);
  letter-spacing: var(--md3-headline-tracking);
  line-height: var(--md3-headline-line-height);
}

.effective-date {
  margin: 0 0 var(--md3-space-4);
  font-size: var(--md3-label-md);
  color: var(--md3-outline);
  letter-spacing: var(--md3-label-tracking);
}

.intro {
  margin: 0 0 var(--md3-space-4);
  font-size: var(--md3-body-lg);
  color: var(--md3-on-surface-variant);
  line-height: var(--md3-body-line-height);
}

/* ─── Medical disclaimer ─── */
.medical-disclaimer {
  display: flex;
  align-items: flex-start;
  gap: var(--md3-space-3);
  background: var(--md3-secondary-container);
  border: 1.5px solid var(--md3-secondary);
  border-radius: var(--md3-rounded-md);
  padding: var(--md3-space-4);
  margin-bottom: var(--md3-space-6);
}

.disclaimer-icon-wrap {
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  border-radius: var(--md3-rounded-full);
  background: var(--md3-on-secondary-container);
  display: flex;
  align-items: center;
  justify-content: center;
}

.disclaimer-icon {
  font-size: 1.5rem !important;
  color: var(--md3-secondary-container);
}

.disclaimer-body {
  flex: 1;
}

.disclaimer-body strong {
  display: block;
  font-size: var(--md3-body-lg);
  font-weight: var(--md3-weight-bold);
  color: var(--md3-on-secondary-container);
  margin-bottom: var(--md3-space-2);
}

.disclaimer-body p {
  margin: 0;
  font-size: var(--md3-body-md);
  color: var(--md3-on-secondary-container);
  line-height: var(--md3-body-line-height);
}

/* ─── Sections ─── */
.legal-section {
  margin-bottom: var(--md3-space-6);
}

.legal-section h2 {
  font-family: var(--md3-font-headline);
  font-size: var(--md3-title-lg);
  font-weight: var(--md3-weight-semibold);
  color: var(--md3-on-surface);
  margin: 0 0 var(--md3-space-3);
  padding-bottom: var(--md3-space-2);
  border-bottom: 2px solid var(--md3-outline-variant);
  letter-spacing: var(--md3-headline-tracking);
}

.legal-section p,
.legal-section ul {
  margin: 0 0 var(--md3-space-2);
  font-size: var(--md3-body-md);
  color: var(--md3-on-surface-variant);
  line-height: var(--md3-body-line-height);
}

.legal-section ul {
  padding-left: var(--md3-space-4);
}

.legal-section li {
  margin-bottom: var(--md3-space-2);
  color: var(--md3-on-surface-variant);
}

.legal-section strong {
  color: var(--md3-on-surface);
  font-weight: var(--md3-weight-semibold);
}

.legal-section a {
  color: var(--md3-primary);
  text-decoration: none;
  font-weight: var(--md3-weight-medium);
}

.legal-section a:hover {
  text-decoration: underline;
}
</style>
