/**
 * Centralized formatting utilities.
 *
 * Replaces inline formatPrice / formatCurrency / formatDate duplicated
 * across 7+ component and page files.
 */

const priceFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

const dateLongFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
});

/** Format a numeric price as "$12.99". */
export function formatPrice(price: number): string {
  return priceFormatter.format(price);
}

/** Format an ISO date string as "Jan 15, 2025". */
export function formatDate(dateString: string): string {
  return dateFormatter.format(new Date(dateString));
}

/** Format an ISO date string as "January 15, 2025" (used in blog/reviews). */
export function formatDateLong(dateString: string): string {
  return dateLongFormatter.format(new Date(dateString));
}
