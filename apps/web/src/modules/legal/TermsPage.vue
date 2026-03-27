<template>
  <div class="legal-page">
    <div class="legal-content">
      <RouterLink to="/" class="back-link" aria-label="Volver al inicio">← Volver</RouterLink>

      <h1 class="page-title">Términos de Uso</h1>
      <p class="effective-date">Vigente desde: marzo 2026</p>

      <p class="intro">
        Al usar <strong>CFA — Alimentación Complementaria</strong> (en adelante "CFA"), aceptás los siguientes términos. Si no estás de acuerdo, por favor no uses la aplicación.
      </p>

      <section class="legal-section" aria-labelledby="sec-uso">
        <h2 id="sec-uso">1. Uso de la aplicación</h2>
        <p>
          CFA es una <strong>herramienta informativa</strong> diseñada para ayudar a padres y cuidadores a planificar la alimentación complementaria de bebés. La app <strong>NO es un dispositivo médico</strong> y no debe usarse como sustituto de la atención médica profesional.
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
          CFA no garantiza resultados específicos en la digestión o salud de tu bebé basados en el uso de esta herramienta.
        </p>
      </section>

      <section class="legal-section" aria-labelledby="sec-cuentas">
        <h2 id="sec-cuentas">3. Cuentas de usuario</h2>
        <p>
          Podés usar CFA de forma anónima (sin registro). Si creás una cuenta, sos responsable de mantener la seguridad de tus credenciales. Notificanos de inmediato si sospechás acceso no autorizado.
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
          Todo el contenido de CFA (diseño, código, textos, datos de alimentos) es propiedad de CFA o de sus licenciantes. No podés reproducir, distribuir ni crear trabajos derivados sin autorización expresa.
        </p>
        <p>
          Los datos que vos generás (platos, bitácora) son tuyos. Podés exportarlos o solicitar su eliminación en cualquier momento.
        </p>
      </section>

      <section class="legal-section" aria-labelledby="sec-limitacion">
        <h2 id="sec-limitacion">6. Limitación de responsabilidad</h2>
        <p>
          En la máxima medida permitida por la ley, CFA no será responsable por daños directos, indirectos, incidentales o consecuentes derivados del uso o la imposibilidad de uso de la aplicación.
        </p>
        <p>
          CFA se provee "tal como está" y "según disponibilidad". No garantizamos disponibilidad ininterrumpida del servicio.
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
          Podemos actualizar estos términos. Los cambios materiales se notificarán con al menos 15 días de anticipación. El uso continuado de CFA después de esa fecha implica aceptación de los nuevos términos.
        </p>
      </section>

      <section class="legal-section" aria-labelledby="sec-contacto-terminos">
        <h2 id="sec-contacto-terminos">9. Contacto</h2>
        <p>
          Para consultas sobre estos términos: <a href="mailto:legal@cfa-app.mx">legal@cfa-app.mx</a>
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
  max-width: 720px;
  margin: 0 auto;
  padding-bottom: 3rem;
}

.legal-content {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.back-link {
  color: #10b981;
  text-decoration: none;
  font-size: 0.875rem;
  display: inline-block;
  margin-bottom: 1.5rem;
  font-weight: 600;
}

.back-link:hover {
  text-decoration: underline;
}

.page-title {
  margin: 0 0 0.25rem;
  font-size: 1.75rem;
  font-weight: 800;
  color: #111827;
}

.effective-date {
  margin: 0 0 1.5rem;
  font-size: 0.8rem;
  color: #9ca3af;
}

.intro {
  margin: 0 0 1.5rem;
  font-size: 0.95rem;
  color: #374151;
  line-height: 1.7;
}

.legal-section {
  margin-bottom: 1.75rem;
}

.legal-section h2 {
  font-size: 1rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 0.75rem;
  padding-bottom: 0.4rem;
  border-bottom: 2px solid #e5e7eb;
}

.legal-section p,
.legal-section ul {
  margin: 0 0 0.75rem;
  font-size: 0.875rem;
  color: #4b5563;
  line-height: 1.7;
}

.legal-section ul {
  padding-left: 1.5rem;
}

.legal-section li {
  margin-bottom: 0.35rem;
}

.legal-section a {
  color: #10b981;
  text-decoration: none;
}

.legal-section a:hover {
  text-decoration: underline;
}
</style>
