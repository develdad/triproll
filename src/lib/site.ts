/**
 * Canonical public site URL. Used for metadata, OpenGraph, robots and sitemap.
 * Override with NEXT_PUBLIC_SITE_URL when a custom domain is live.
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
  "https://triproll.vercel.app";
