/**
 * Email templates for transactional emails.
 */

// ─── Verification Email ─────────────────────────────────────────────────────

export interface VerificationEmailVars {
  name: string
  url: string
}

/**
 * Generates HTML content for email verification.
 */
export function verificationEmailHtml(vars: VerificationEmailVars): string {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verifica tu email</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #1a1a1a;">
  <div style="text-align: center; margin-bottom: 32px;">
    <h1 style="color: #2563eb; font-size: 24px; margin-bottom: 8px;">¡Bienvenido a Pakulab!</h1>
    <p style="color: #6b7280; font-size: 16px;">Confirma tu dirección de email para continuar</p>
  </div>

  <div style="background: #f9fafb; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
    <p style="margin: 0 0 16px; font-size: 14px;">Hola <strong>${vars.name}</strong>,</p>
    <p style="margin: 0 0 24px; font-size: 14px; color: #4b5563;">Gracias por registrarte. Por favor verifica tu email haciendo clic en el siguiente enlace:</p>

    <a href="${vars.url}"
       style="display: inline-block; background: #2563eb; color: white; text-decoration: none; padding: 14px 24px; border-radius: 8px; font-weight: 600; font-size: 16px;">
      Verificar mi email
    </a>

    <p style="margin: 24px 0 0; font-size: 12px; color: #9ca3af;">
      Este enlace expira en 1 hora. Si no solicitaste este email, puedes ignorarlo.
    </p>
  </div>
</body>
</html>
`.trim()
}

/**
 * Generates plain text content for email verification.
 */
export function verificationEmailText(vars: VerificationEmailVars): string {
  return `
¡Bienvenido a Pakulab!

Hola ${vars.name},

Gracias por registrarte. Por favor verifica tu email visitando el siguiente enlace:

${vars.url}

Este enlace expira en 1 hora. Si no solicitaste este email, puedes ignorarlo.
`.trim()
}

// ─── Reset Password Email ─────────────────────────────────────────────────────

export interface ResetPasswordEmailVars {
  name: string
  url: string
}

/**
 * Generates HTML content for password reset.
 */
export function resetPasswordEmailHtml(vars: ResetPasswordEmailVars): string {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Restablece tu contraseña</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #1a1a1a;">
  <div style="text-align: center; margin-bottom: 32px;">
    <h1 style="color: #2563eb; font-size: 24px; margin-bottom: 8px;">Restablecer contraseña</h1>
    <p style="color: #6b7280; font-size: 16px;">Solicitaste cambiar tu contraseña</p>
  </div>

  <div style="background: #f9fafb; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
    <p style="margin: 0 0 16px; font-size: 14px;">Hola <strong>${vars.name}</strong>,</p>
    <p style="margin: 0 0 24px; font-size: 14px; color: #4b5563;">Recibimos una solicitud para restablecer tu contraseña. Haz clic en el siguiente enlace para crear una nueva:</p>

    <a href="${vars.url}"
       style="display: inline-block; background: #2563eb; color: white; text-decoration: none; padding: 14px 24px; border-radius: 8px; font-weight: 600; font-size: 16px;">
      Restablecer mi contraseña
    </a>

    <p style="margin: 24px 0 0; font-size: 12px; color: #9ca3af;">
      Este enlace expira en 1 hora. Si no solicitaste este cambio, puedes ignorarlo — tu contraseña seguirá siendo la misma.
    </p>
  </div>
</body>
</html>
`.trim()
}

/**
 * Generates plain text content for password reset.
 */
export function resetPasswordEmailText(vars: ResetPasswordEmailVars): string {
  return `
Restablecer contraseña

Hola ${vars.name},

Recibimos una solicitud para restablecer tu contraseña. Visita el siguiente enlace para crear una nueva:

${vars.url}

Este enlace expira en 1 hora. Si no solicitaste este cambio, puedes ignorarlo — tu contraseña seguirá siendo la misma.
`.trim()
}
