// THE single source of business facts. Everything on the site (footer NAP,
// JSON-LD, sitemap, robots) is derived from this file. Never hardcode a
// phone number, address, hour or link anywhere else.
// Only erasable TypeScript syntax is used here (no enums) because the SEO
// checker imports this file directly with Node.
import { z } from 'astro/zod';

const e164 = /^\+[1-9]\d{7,14}$/;
const httpsUrl = z
  .string()
  .refine((v) => /^https:\/\/[^\s/]+\.[^\s/]+(\/\S*)?$/.test(v), 'must be an absolute https URL');

const schema = z.object({
  // 'demo' = noindex everywhere + robots Disallow (pitch sites before cutover).
  // 'live' = indexable. Flip to 'live' at cutover (see references/launch.md).
  mode: z.enum(['live', 'demo']),
  // Apex or www, whichever is the canonical host. No trailing slash, no path.
  domain: httpsUrl.refine((v) => !v.endsWith('/'), 'must not end with a slash'),
  // 'default' or 'chris' (Chris's own ventures only; client sites use client brand).
  theme: z.enum(['default', 'chris']).default('default'),
  business: z.object({
    name: z.string().min(2, 'business.name is required'),
    // Any schema.org LocalBusiness subtype, e.g. 'Plumber', 'RoofingContractor'.
    type: z.string().regex(/^[A-Z][A-Za-z]+$/, 'must be a schema.org type name').default('LocalBusiness'),
    tagline: z.string().min(3, 'business.tagline is required'),
    description: z.string().min(70, 'business.description must be 70 to 170 characters').max(170, 'business.description must be 70 to 170 characters'),
    // Optional: TripRoll is an online service with no public phone line. When set, it feeds tel: links and JSON-LD.
    phone: z
      .object({
        e164: z.string().regex(e164, 'phone.e164 must be E.164, e.g. +14805550123'),
        display: z.string().min(7, 'phone.display is required'),
      })
      .optional(),
    email: z.string().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'must be an email address').optional(),
    address: z
      .object({
        street: z.string().min(1),
        city: z.string().min(1),
        region: z.string().min(1),
        postal: z.string().min(1),
        country: z.string().length(2, 'country is a 2-letter ISO code'),
      })
      .optional(),
    serviceArea: z.array(z.string().min(1)).optional(),
    // schema.org openingHours strings, e.g. 'Mo-Fr 08:00-17:00'.
    hours: z.array(z.string().regex(/^[A-Z][a-z](-[A-Z][a-z])?(,[A-Z][a-z])* \d{2}:\d{2}-\d{2}:\d{2}$/, "use 'Mo-Fr 08:00-17:00'")).optional(),
    priceRange: z.string().min(1).optional(),
    // Path inside /public. Square or wide logo, PNG or SVG.
    logo: z.string().startsWith('/', 'logo must be a path starting with /'),
    // Only real profile links: Google Business Profile, Facebook, Yelp, LinkedIn.
    sameAs: z.array(httpsUrl).default([]),
  }),
  nav: z.array(z.object({ label: z.string().min(1), href: z.string().startsWith('/') })).min(1),
  // Extra footer-only links (about, legal).
  footerNav: z.array(z.object({ label: z.string().min(1), href: z.string().startsWith('/') })).default([]),
  analytics: z
    .object({ posthogKey: z.string().optional(), posthogHost: z.string().optional() })
    .default({}),
  // Optional footer credit. null = none. Never an entity line.
  builtBy: z.object({ label: z.string().min(1), href: httpsUrl }).nullable().default(null),
});

const raw = {
  mode: 'live',
  domain: 'https://triproll.co',
  theme: 'default',
  business: {
    name: 'TripRoll',
    type: 'TravelAgency',
    tagline: 'Spin the globe. Get a trip.',
    description:
      'Set your budget, dates and rules, take the Travel DNA assessment, and request a surprise trip. A person plans it and keeps the place sealed until you fly.',
    logo: '/logo.png',
    sameAs: [],
  },
  nav: [
    { label: 'Roll a trip', href: '/roll' },
    { label: 'Travel DNA', href: '/travel-dna' },
    { label: 'How it works', href: '/how-it-works' },
    { label: 'FAQ', href: '/faq' },
  ],
  footerNav: [
    { label: 'About', href: '/about' },
    { label: 'Privacy', href: '/privacy' },
    { label: 'Terms', href: '/terms' },
  ],
  analytics: {},
  builtBy: null,
};

// Paths that must be noindex and kept out of the sitemap. Add any new
// non-indexable page here AND pass `noindex` to <Base>. The checker verifies both agree.
export const noindexPaths = ['/404', '/thank-you'];

const parsed = schema.safeParse(raw);
if (!parsed.success) {
  const lines = parsed.error.issues.map((i) => `  - ${i.path.join('.') || '(root)'}: ${i.message}`);
  throw new Error(`\n\nsrc/site.config.ts is invalid:\n${lines.join('\n')}\n`);
}

export const site = parsed.data;
export type Site = typeof site;
export const isDemo = site.mode === 'demo';
