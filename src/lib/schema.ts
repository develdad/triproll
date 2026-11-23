// Builds the JSON-LD @graph ONLY from site.config.ts and page props.
// There are deliberately no fields for ratings, reviews, geo coordinates or
// founding dates, so they cannot be emitted. scripts/seo-check.mjs verifies
// every emitted property traces back to the config.
import type { Site } from '../site.config';

export type Crumb = { name: string; path: string };
export type ServiceNode = { name: string; description: string; path: string };

const url = (site: Site, path: string) => (path === '/' ? site.domain + '/' : site.domain + path);

export function businessId(site: Site) {
  return `${site.domain}/#business`;
}

export function buildGraph(
  site: Site,
  opts: { crumbs?: Crumb[]; service?: ServiceNode; extra?: Record<string, unknown>[] } = {},
) {
  const b = site.business;
  const business: Record<string, unknown> = {
    '@type': b.type,
    '@id': businessId(site),
    name: b.name,
    url: site.domain + '/',
    logo: site.domain + b.logo,
    image: site.domain + b.logo,
  };
  if (b.phone) business.telephone = b.phone.e164;
  if (b.email) business.email = b.email;
  if (b.address) {
    business.address = {
      '@type': 'PostalAddress',
      streetAddress: b.address.street,
      addressLocality: b.address.city,
      addressRegion: b.address.region,
      postalCode: b.address.postal,
      addressCountry: b.address.country,
    };
  }
  if (b.serviceArea?.length) {
    business.areaServed = b.serviceArea.map((name) => ({ '@type': 'City', name }));
  }
  if (b.hours?.length) business.openingHours = b.hours;
  if (b.priceRange) business.priceRange = b.priceRange;
  if (b.sameAs.length) business.sameAs = b.sameAs;

  const graph: Record<string, unknown>[] = [
    business,
    {
      '@type': 'WebSite',
      '@id': `${site.domain}/#website`,
      url: site.domain + '/',
      name: b.name,
      publisher: { '@id': businessId(site) },
    },
  ];

  if (opts.service) {
    graph.push({
      '@type': 'Service',
      '@id': url(site, opts.service.path) + '#service',
      name: opts.service.name,
      description: opts.service.description,
      url: url(site, opts.service.path),
      provider: { '@id': businessId(site) },
    });
  }

  if (opts.crumbs && opts.crumbs.length > 1) {
    graph.push({
      '@type': 'BreadcrumbList',
      itemListElement: opts.crumbs.map((c, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: c.name,
        item: url(site, c.path),
      })),
    });
  }

  if (opts.extra?.length) graph.push(...opts.extra);

  return { '@context': 'https://schema.org', '@graph': graph };
}
