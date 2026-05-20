/**
 * Thrown when a user tries to start a trial or subscription
 * while already having an ACTIVE or TRIALING subscription.
 * Maps to HTTP 409 Conflict.
 */

import { ConflictError } from '../../../../shared/errors/index.js'

export class DuplicateSubscriptionException extends ConflictError {
  constructor() {
    super('Ya tienes una suscripción activa')
  }
}
