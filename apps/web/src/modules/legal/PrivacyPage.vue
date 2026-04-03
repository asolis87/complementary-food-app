<template>
  <div class="legal-page">
    <div class="legal-content">
      <RouterLink to="/" class="back-link" aria-label="Volver al inicio">
        <span class="material-symbols-outlined back-icon" aria-hidden="true">arrow_back</span>
        Volver
      </RouterLink>

      <h1 class="page-title">Aviso de Privacidad</h1>
      <p class="effective-date">Vigente desde: marzo 2026</p>

      <p class="intro">
        En <strong>Pakulab — Alimentación Complementaria</strong> (en adelante "Pakulab", "nosotros"), respetamos tu privacidad y estamos comprometidos con la protección de tus datos personales, de conformidad con la <em>Ley Federal de Protección de Datos Personales en Posesión de los Particulares</em> (LFPDPPP) de México.
      </p>

      <section class="legal-section" aria-labelledby="sec-datos">
        <h2 id="sec-datos">1. ¿Qué datos recopilamos?</h2>
        <ul>
          <li><strong>Correo electrónico</strong> — para crear tu cuenta y enviarte notificaciones del servicio.</li>
          <li><strong>Perfiles de bebés</strong> — nombre y fecha de nacimiento de tu bebé, que vos proporcionás voluntariamente.</li>
          <li><strong>Platos y registros alimentarios</strong> — los platos que armás y tu bitácora de alimentos.</li>
          <li><strong>Datos de sesión</strong> — cookies de sesión para mantenerte autenticado.</li>
          <li><strong>Datos de pago</strong> — procesados directamente por Stripe. Pakulab NO almacena números de tarjeta.</li>
          <li><strong>Datos anónimos</strong> — si usás la app sin registrarte, se genera una sesión anónima temporal.</li>
        </ul>
      </section>

      <section class="legal-section" aria-labelledby="sec-finalidad">
        <h2 id="sec-finalidad">2. ¿Para qué usamos tus datos?</h2>
        <ul>
          <li>Brindarte el servicio de Pakulab y almacenar tus platos y bitácora.</li>
          <li>Gestionar tu suscripción y pagos (a través de Stripe).</li>
          <li>Enviarte correos transaccionales (confirmación de cuenta, recibos).</li>
          <li>Mejorar la app mediante análisis anónimos de uso.</li>
        </ul>
        <p>NO compartimos ni vendemos tus datos personales con terceros para fines publicitarios.</p>
      </section>

      <section class="legal-section" aria-labelledby="sec-almacenamiento">
        <h2 id="sec-almacenamiento">3. ¿Cómo almacenamos tus datos?</h2>
        <p>
          Tus datos se almacenan en servidores seguros con acceso restringido. La base de datos (PostgreSQL) utiliza cifrado en tránsito y en reposo. Las contraseñas nunca se almacenan en texto plano.
        </p>
      </section>

      <section class="legal-section" aria-labelledby="sec-terceros">
        <h2 id="sec-terceros">4. Terceros con acceso a datos</h2>
        <ul>
          <li>
            <strong>Stripe</strong> — procesamiento de pagos. Sus propios avisos de privacidad aplican.
            <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer">Privacidad de Stripe</a>
          </li>
          <li>
            <strong>BetterAuth</strong> — gestión de sesiones y autenticación.
          </li>
        </ul>
      </section>

      <section class="legal-section" aria-labelledby="sec-arco">
        <h2 id="sec-arco">5. Derechos ARCO</h2>
        <p>
          De conformidad con la LFPDPPP, tenés derecho a:
        </p>
        <ul>
          <li><strong>Acceso</strong> — saber qué datos tenemos sobre vos.</li>
          <li><strong>Rectificación</strong> — corregir datos inexactos o incompletos.</li>
          <li><strong>Cancelación</strong> — solicitar la eliminación de tus datos. Atendemos en un plazo máximo de 72 horas hábiles.</li>
          <li><strong>Oposición</strong> — oponerte al tratamiento de tus datos.</li>
        </ul>
        <p>
          Para ejercer tus derechos ARCO, escribinos a:
          <a href="mailto:privacidad@pakulab.mx">privacidad@pakulab.mx</a>
        </p>
      </section>

      <section class="legal-section" aria-labelledby="sec-cookies">
        <h2 id="sec-cookies">6. Cookies y almacenamiento local</h2>
        <p>
          Usamos cookies de sesión necesarias para el funcionamiento de la app. También usamos <code>localStorage</code> del navegador para cachear el catálogo de alimentos offline y guardar preferencias del usuario (como la aceptación de este aviso).
        </p>
        <p>No usamos cookies de rastreo publicitario ni analítica de terceros.</p>
      </section>

      <section class="legal-section" aria-labelledby="sec-menores">
        <h2 id="sec-menores">7. Datos de menores</h2>
        <p>
          Pakulab recopila información de bebés únicamente a través de sus padres o tutores. No recopilamos datos directamente de menores de edad.
        </p>
      </section>

      <section class="legal-section" aria-labelledby="sec-cambios">
        <h2 id="sec-cambios">8. Cambios a este aviso</h2>
        <p>
          Podemos actualizar este aviso periódicamente. Te notificaremos de cambios materiales por correo electrónico o mediante un aviso en la app.
        </p>
      </section>

      <section class="legal-section" aria-labelledby="sec-contacto">
        <h2 id="sec-contacto">9. Contacto</h2>
        <p>
          Para cualquier consulta sobre privacidad: <a href="mailto:privacidad@pakulab.mx">privacidad@pakulab.mx</a>
        </p>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
// T-031: Privacy Policy (LFPDPPP compliant basics)
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

code {
  background: var(--md3-surface-container);
  padding: 0.1rem var(--md3-space-1);
  border-radius: var(--md3-rounded-sm);
  font-size: var(--md3-label-md);
  color: var(--md3-on-surface);
  font-family: monospace;
}
</style>
