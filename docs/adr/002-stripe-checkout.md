# ADR-002: Stripe Checkout (Redirect-Based)

## Status

Accepted

## Context

The platform needs payment processing for product purchases. Two primary Stripe integration approaches were considered:

- **Stripe Elements** (embedded): Collect card details in a custom form on our site using `@stripe/react-stripe-js`
- **Stripe Checkout** (redirect): Redirect customers to a Stripe-hosted payment page

Key requirements:
- PCI compliance with minimal scope
- Support for guest checkout (no account required)
- Coupon/discount support
- Shipping address collection
- Reliable order creation after payment

## Decision

Use Stripe Checkout (redirect-based) for payment processing. The implementation:

1. `createCheckoutSession` server action validates cart items against database prices (never trusts client prices)
2. Creates Stripe Checkout session with line items, shipping, and metadata
3. Returns redirect URL to client
4. Customer completes payment on Stripe-hosted page
5. Webhook at `/api/webhooks/stripe` handles `checkout.session.completed` event
6. Webhook creates order, decrements stock atomically, and increments coupon usage

Session metadata carries coupon code, discount amount, and original subtotal for accurate order recording.

## Consequences

**Benefits:**
- Zero PCI scope -- card details never touch our servers
- Stripe handles all payment UI, 3D Secure, and error states
- Built-in support for shipping address collection and billing address
- Guest checkout works via session metadata (no user account needed)
- Stripe handles receipts and payment confirmation emails

**Trade-offs:**
- Less UI control -- cannot customize the checkout page appearance beyond Stripe's theming
- Redirect flow interrupts the user experience (leaves our site)
- Webhook required for order completion -- adds complexity and requires reliable webhook handling
- Must verify webhook signatures for security (`STRIPE_WEBHOOK_SECRET`)
- Coupon discounts are applied proportionally across line items (not as a separate discount line)
