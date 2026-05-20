/**
 * Thrown when a user without a Stripe customer ID tries to open
 * the billing portal. Maps to HTTP 404 Not Found.
 */

import { NotFoundError } from '../../../../shared/errors/index.js'

export class MissingStripeCustomerException extends NotFoundError {
  constructor() {
    super('Suscripción de Stripe')
  }
}
