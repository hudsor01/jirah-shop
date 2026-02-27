"use client";

/** Renders the current year on the client to avoid hydration mismatches. */
export function FooterYear() {
  return <>{new Date().getFullYear()}</>;
}
