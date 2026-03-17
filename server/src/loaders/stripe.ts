import Stripe from 'stripe';
import { config } from '../config/index.js';

let stripeInstance: Stripe | null = null;

/**
 * Returns the Stripe client singleton. Throws if STRIPE_SECRET_KEY is not set,
 * so callers get a clear error when billing is used without configuration.
 */
export function getStripe(): Stripe {
  if (!stripeInstance) {
    if (!config.STRIPE_SECRET_KEY || config.STRIPE_SECRET_KEY.trim() === '') {
      throw new Error(
        'Stripe is not configured: STRIPE_SECRET_KEY is missing. Set it in .env or disable billing routes.'
      );
    }
    stripeInstance = new Stripe(config.STRIPE_SECRET_KEY, {
      typescript: true,
    });
  }
  return stripeInstance;
}
