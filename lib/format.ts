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

/** Format a numeric price as "$12.99". */
export function formatPrice(price: number): string {
  return priceFormatter.format(price);
}

/** Alias for formatPrice — kept for semantic clarity in order/account contexts. */
export const formatCurrency = formatPrice;

/** Format an ISO date string as "Jan 15, 2025". */
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** Format an ISO date string as "January 15, 2025" (used in blog/reviews). */
export function formatDateLong(dateString: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(dateString));
}
