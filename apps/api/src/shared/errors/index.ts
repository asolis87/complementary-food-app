/**
 * Centralized error types for the Pakulab API.
 * Use these to ensure consistent error response format.
 */

export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly code: string,
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} no encontrado`, 404, 'NOT_FOUND')
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'No autorizado') {
    super(message, 401, 'UNAUTHORIZED')
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Acceso denegado') {
    super(message, 403, 'FORBIDDEN')
  }
}

export class InsufficientTierError extends AppError {
  public readonly required: string
  public readonly current: string

  constructor(required: string, current: string) {
    super(
      `Esta función requiere plan ${required === 'PRO' ? 'Pro' : 'gratuito con cuenta'}. ` +
        `Tu plan actual es: ${current}`,
      403,
      'INSUFFICIENT_TIER',
    )
    this.required = required
    this.current = current
  }
}

export class TierLimitError extends AppError {
  constructor(message: string) {
    super(message, 402, 'TIER_LIMIT_EXCEEDED')
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, 'VALIDATION_ERROR')
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT')
  }
}
