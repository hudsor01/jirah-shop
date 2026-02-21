/**
 * Generate a URL-safe slug from a string.
 *
 * Used by product-form and blog-editor to auto-generate slugs from names/titles.
 */
export function generateSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
