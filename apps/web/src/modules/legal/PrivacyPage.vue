<template>
  <div class="legal-page">
    <div class="legal-content">
      <RouterLink to="/" class="back-link" aria-label="Volver al inicio">← Volver</RouterLink>

      <h1 class="page-title">Aviso de Privacidad</h1>
      <p class="effective-date">Vigente desde: marzo 2026</p>

      <p class="intro">
        En <strong>CFA — Alimentación Complementaria</strong> (en adelante "CFA", "nosotros"), respetamos tu privacidad y estamos comprometidos con la protección de tus datos personales, de conformidad con la <em>Ley Federal de Protección de Datos Personales en Posesión de los Particulares</em> (LFPDPPP) de México.
      </p>

      <section class="legal-section" aria-labelledby="sec-datos">
        <h2 id="sec-datos">1. ¿Qué datos recopilamos?</h2>
        <ul>
          <li><strong>Correo electrónico</strong> — para crear tu cuenta y enviarte notificaciones del servicio.</li>
          <li><strong>Perfiles de bebés</strong> — nombre y fecha de nacimiento de tu bebé, que vos proporcionás voluntariamente.</li>
          <li><strong>Platos y registros alimentarios</strong> — los platos que armás y tu bitácora de alimentos.</li>
          <li><strong>Datos de sesión</strong> — cookies de sesión para mantenerte autenticado.</li>
          <li><strong>Datos de pago</strong> — procesados directamente por Stripe. CFA NO almacena números de tarjeta.</li>
          <li><strong>Datos anónimos</strong> — si usás la app sin registrarte, se genera una sesión anónima temporal.</li>
        </ul>
      </section>

      <section class="legal-section" aria-labelledby="sec-finalidad">
        <h2 id="sec-finalidad">2. ¿Para qué usamos tus datos?</h2>
        <ul>
          <li>Brindarte el servicio de CFA y almacenar tus platos y bitácora.</li>
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
          <a href="mailto:privacidad@cfa-app.mx">privacidad@cfa-app.mx</a>
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
          CFA recopila información de bebés únicamente a través de sus padres o tutores. No recopilamos datos directamente de menores de edad.
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
          Para cualquier consulta sobre privacidad: <a href="mailto:privacidad@cfa-app.mx">privacidad@cfa-app.mx</a>
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

code {
  background: #f3f4f6;
  padding: 0.1rem 0.35rem;
  border-radius: 0.25rem;
  font-size: 0.8rem;
  color: #374151;
}
</style>
