import Stripe from "stripe";

// Lazy-initialise so the module can be imported at build time
// (when STRIPE_SECRET_KEY may not be set yet).
let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error(
        "Missing STRIPE_SECRET_KEY — set it in your environment variables."
      );
    }
    _stripe = new Stripe(key, { typescript: true });
  }
  return _stripe;
}

/** Lazy-initialised Stripe client — initialises on first property access. */
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop, receiver) {
    return Reflect.get(getStripe(), prop, receiver);
  },
});
