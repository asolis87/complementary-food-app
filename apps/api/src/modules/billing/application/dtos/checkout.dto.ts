/**
 * Checkout DTO — input/output boundaries for the create-checkout use case.
 */

export interface CreateCheckoutDto {
  userId: string
  userEmail?: string
  priceId: string
}
