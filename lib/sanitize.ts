import DOMPurify from "isomorphic-dompurify";
import type { Config } from "dompurify";

/**
 * Allowed tags and attributes for rich HTML content (blog posts, product descriptions).
 * Blocks script, iframe, style attributes, event handlers, and all other dangerous vectors.
 */
const RICH_HTML_CONFIG: Config = {
  ALLOWED_TAGS: [
    "h1", "h2", "h3", "h4", "h5", "h6",
    "p", "br", "strong", "em", "b", "i", "u", "s",
    "a", "ul", "ol", "li",
    "blockquote", "pre", "code",
    "img",
    "table", "thead", "tbody", "tr", "th", "td",
    "hr", "span", "div",
    "figure", "figcaption",
    "sup", "sub",
  ],
  ALLOWED_ATTR: [
    "href", "target", "rel",       // anchor tags
    "src", "alt", "width", "height", // img tags
  ],
};

/**
 * Sanitize rich HTML content for safe rendering.
 * Permits structural/formatting tags but strips scripts, iframes, event handlers,
 * style/class/id attributes, and any tag not on the allowlist.
 */
export function sanitizeRichHTML(html: string): string {
  return DOMPurify.sanitize(html, RICH_HTML_CONFIG);
}

/**
 * Strip ALL HTML tags, returning plain text only.
 * Use for user-generated plain text fields (reviews, names, contact form messages).
 */
export function sanitizeText(text: string): string {
  return DOMPurify.sanitize(text, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
}
