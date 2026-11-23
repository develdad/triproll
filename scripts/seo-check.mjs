#!/usr/bin/env node
// SEO + indexability gate. Zero dependencies beyond Node 22.
//   node scripts/seo-check.mjs                 local mode: checks dist/ (runs as `postbuild`)
//   node scripts/seo-check.mjs --live <url>    live mode: fetches as GPTBot, works on ANY site
// Exit code 1 on any error. Warnings never fail.
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, extname, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const GPTBOT = 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; GPTBot/1.2; +https://openai.com/gptbot)';
const TITLE_MAX = 60, TITLE_IDEAL_MIN = 30;
const DESC_MIN = 70, DESC_MAX = 170, DESC_IDEAL_MIN = 120, DESC_IDEAL_MAX = 160;
const FORBIDDEN_LD_KEYS = ['aggregateRating', 'review', 'reviews', 'geo', 'foundingDate', 'ratingValue', 'reviewCount'];

const findings = []; // { level: 'ERROR'|'WARN', where, msg }
const err = (where, msg) => findings.push({ level: 'ERROR', where, msg });
const warn = (where, msg) => findings.push({ level: 'WARN', where, msg });

// ---------- html helpers ----------
const decode = (s) =>
  s.replace(/&quot;/g, '"').replace(/&#39;|&#x27;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const stripComments = (h) => h.replace(/<!--[\s\S]*?-->/g, '');
function attrs(tag) {
  const out = {};
  for (const m of tag.matchAll(/([a-zA-Z_:][-a-zA-Z0-9_:.]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g)) {
    if (m.index === 0) continue;
    out[m[1].toLowerCase()] = decode(m[2] ?? m[3] ?? m[4] ?? '');
  }
  return out;
}
const allTags = (html, name) => [...html.matchAll(new RegExp(`<${name}\\b[^>]*>`, 'gi'))].map((m) => ({ raw: m[0], a: attrs(m[0]) }));

function analyze(rawHtml) {
  const html = stripComments(rawHtml);
  const head = (html.match(/<head[^>]*>([\s\S]*?)<\/head>/i) || [])[1] || '';
  const bodyHtml = (html.match(/<body[^>]*>([\s\S]*)<\/body>/i) || [, html])[1];
  const metas = allTags(head, 'meta');
  const metaBy = (key, val) => metas.filter((m) => (m.a[key] || '').toLowerCase() === val);
  const content = (list) => list.map((m) => m.a.content ?? '');
  const titles = [...head.matchAll(/<title[^>]*>([\s\S]*?)<\/title>/gi)].map((m) => decode(m[1].trim()));
  const canon = allTags(head, 'link').filter((l) => (l.a.rel || '').toLowerCase().split(/\s+/).includes('canonical'));
  const og = {};
  for (const k of ['og:title', 'og:description', 'og:url', 'og:image']) og[k] = content(metaBy('property', k));
  const robots = content(metaBy('name', 'robots')).join(',').toLowerCase();
  const ld = [];
  for (const m of html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try { ld.push({ ok: true, data: JSON.parse(m[1]) }); } catch (e) { ld.push({ ok: false, error: e.message }); }
  }
  const visible = bodyHtml
    .replace(/<(script|style|noscript|svg|template)\b[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ');
  const words = decode(visible).split(/\s+/).filter((w) => /[A-Za-z0-9]/.test(w)).length;
  const h1 = (bodyHtml.match(/<h1\b/gi) || []).length;
  const imgs = allTags(bodyHtml, 'img');
  const links = [
    ...allTags(bodyHtml, 'a').map((t) => t.a.href).filter((v) => v !== undefined),
    ...allTags(bodyHtml, 'form').map((t) => t.a.action).filter((v) => v !== undefined),
  ];
  return {
    titles,
    descs: content(metaBy('name', 'description')),
    canon: canon.map((c) => c.a.href ?? ''),
    og, robots, ld, words, h1, imgs, links,
    scripts: [...html.matchAll(/<script\b([^>]*)>/gi)].filter((m) => !/application\/ld\+json/i.test(m[1])).length,
  };
}

function imgProblems(a) {
  const out = [];
  for (const { a: at } of a.imgs) {
    const src = at.src || '(no src)';
    if (!('alt' in at)) out.push(`<img> without alt: ${src}`);
    else if (at.alt.trim() === '' && !(at.role === 'presentation' || at['aria-hidden'] === 'true'))
      out.push(`<img> with empty alt but no role="presentation": ${src}`);
  }
  return out;
}

function walkLd(node, fn) {
  if (Array.isArray(node)) return node.forEach((n) => walkLd(n, fn));
  if (node && typeof node === 'object') {
    for (const [k, v] of Object.entries(node)) { fn(k, v, node); walkLd(v, fn); }
  }
}

function headChecks(where, a, { canonicalPath, domainHost }) {
  const idealWarn = !/noindex/.test(a.robots);
  const label = where;
  if (a.titles.length !== 1) err(label, `expected exactly 1 <title>, found ${a.titles.length}`);
  const title = a.titles[0] || '';
  if (!title.trim()) err(label, 'empty title');
  else if (title.length > TITLE_MAX) err(label, `title is ${title.length} chars (max ${TITLE_MAX})`);
  else if (idealWarn && title.length < TITLE_IDEAL_MIN) warn(label, `title is ${title.length} chars (ideal ${TITLE_IDEAL_MIN} to ${TITLE_MAX})`);
  if (a.descs.length !== 1) err(label, `expected exactly 1 meta description, found ${a.descs.length}`);
  const d = a.descs[0] || '';
  if (a.descs.length && (d.length < DESC_MIN || d.length > DESC_MAX)) err(label, `description is ${d.length} chars (allowed ${DESC_MIN} to ${DESC_MAX})`);
  else if (idealWarn && a.descs.length && (d.length < DESC_IDEAL_MIN || d.length > DESC_IDEAL_MAX)) warn(label, `description is ${d.length} chars (ideal ${DESC_IDEAL_MIN} to ${DESC_IDEAL_MAX})`);
  if (a.canon.length !== 1) err(label, `expected exactly 1 canonical, found ${a.canon.length}`);
  else {
    const c = a.canon[0];
    let u;
    try { u = new URL(c); } catch { err(label, `canonical is not an absolute URL: "${c}"`); }
    if (u) {
      if (u.protocol !== 'https:') err(label, `canonical is not https: ${c}`);
      if (domainHost && u.host !== domainHost) err(label, `canonical host ${u.host} is not ${domainHost}`);
      const p = u.pathname;
      if (canonicalPath !== undefined && p !== canonicalPath) err(label, `canonical path ${p} does not match page path ${canonicalPath}`);
      if (p.length > 1 && p.endsWith('/')) err(label, `canonical has a trailing slash: ${c}`);
      if (p.endsWith('.html')) err(label, `canonical ends in .html: ${c}`);
    }
  }
  for (const k of ['og:title', 'og:description', 'og:url', 'og:image']) {
    if (a.og[k].length !== 1 || !a.og[k][0]) err(label, `expected exactly 1 ${k}, found ${a.og[k].length}`);
  }
  if (a.og['og:url'][0] && a.canon[0] && a.og['og:url'][0] !== a.canon[0]) err(label, 'og:url differs from canonical');
  if (a.h1 !== 1) err(label, `expected exactly 1 <h1>, found ${a.h1}`);
  a.ld.forEach((b, i) => { if (!b.ok) err(label, `JSON-LD block ${i + 1} does not parse: ${b.error}`); });
  imgProblems(a).forEach((m) => err(label, m));
}

// ---------- shared output ----------
function printTable(rows, header) {
  const widths = header.map((h, i) => Math.max(h.length, ...rows.map((r) => String(r[i]).length)));
  const line = (r) => r.map((c, i) => String(c).padEnd(widths[i])).join('  ');
  console.log(line(header));
  console.log(widths.map((w) => '-'.repeat(w)).join('  '));
  rows.forEach((r) => console.log(line(r)));
}
function finish(label, pageCount) {
  const errors = findings.filter((f) => f.level === 'ERROR');
  const warns = findings.filter((f) => f.level === 'WARN');
  console.log('');
  for (const f of [...errors, ...warns]) console.log(`${f.level.padEnd(5)}  ${f.where}: ${f.msg}`);
  console.log(`\nseo-check ${label}: ${pageCount} pages, ${errors.length} errors, ${warns.length} warnings => ${errors.length ? 'FAIL' : 'PASS'}`);
  process.exit(errors.length ? 1 : 0);
}
const statusFor = (where) => {
  const f = findings.filter((x) => x.where === where || x.where.startsWith(where + ' '));
  return f.some((x) => x.level === 'ERROR') ? 'ERR' : f.length ? 'warn' : 'ok';
};

// ====================================================================
// LOCAL MODE
// ====================================================================
async function local() {
  if (!existsSync(DIST)) { console.error('seo-check: dist/ not found. Run `npm run build` first.'); process.exit(1); }
  let cfg;
  try {
    cfg = await import(pathToFileURL(join(ROOT, 'src/site.config.ts')).href);
  } catch (e) {
    console.error('seo-check: cannot load src/site.config.ts\n' + e.message);
    process.exit(1);
  }
  const { site, noindexPaths } = cfg;
  const live = site.mode === 'live';
  const domainHost = new URL(site.domain).host;
  const noindexSet = new Set(noindexPaths);

  const files = [];
  (function walk(dir) {
    for (const n of readdirSync(dir)) {
      const p = join(dir, n);
      statSync(p).isDirectory() ? walk(p) : files.push(p);
    }
  })(DIST);
  const htmlFiles = files.filter((f) => f.endsWith('.html'));
  const rel = (f) => relative(DIST, f).split('\\').join('/');
  const pathOf = (f) => {
    let r = '/' + rel(f).replace(/\.html$/, '');
    if (r === '/index') return '/';
    return r.replace(/\/index$/, '') || '/';
  };

  if (!existsSync(join(DIST, '404.html'))) err('dist', '404.html is missing');
  if (!existsSync(join(DIST, 'index.html'))) err('dist', 'index.html is missing');

  // does an internal path resolve to a file in dist?
  const resolves = (p) => {
    if (p === '/' || p === '') return existsSync(join(DIST, 'index.html'));
    const clean = decodeURIComponent(p.replace(/^\//, ''));
    const cands = [clean, clean + '.html', join(clean, 'index.html')];
    return cands.some((c) => existsSync(join(DIST, c)) && statSync(join(DIST, c)).isFile());
  };

  const pages = [];
  const seenTitles = new Map(), seenDescs = new Map();
  for (const f of htmlFiles) {
    const path = pathOf(f);
    const a = analyze(readFileSync(f, 'utf8'));
    pages.push({ path, a });
    headChecks(path, a, { canonicalPath: path, domainHost });
    const t = a.titles[0], d = a.descs[0];
    if (t) { if (seenTitles.has(t)) err(path, `duplicate title (also on ${seenTitles.get(t)}): "${t}"`); else seenTitles.set(t, path); }
    if (d) { if (seenDescs.has(d)) err(path, `duplicate description (also on ${seenDescs.get(d)})`); else seenDescs.set(d, path); }

    // robots meta vs mode
    const noindexed = /noindex/.test(a.robots);
    if (live) {
      if (noindexSet.has(path) && !noindexed) err(path, 'listed in noindexPaths but has no noindex meta');
      if (!noindexSet.has(path) && noindexed) err(path, 'noindex found in live mode on an indexable page');
    } else if (!noindexed) {
      err(path, 'demo mode: page is missing the noindex meta');
    }

    // JSON-LD
    const nodes = [];
    a.ld.filter((b) => b.ok).forEach((b) => (b.data['@graph'] || [b.data]).forEach((n) => nodes.push(n)));
    walkLd(nodes, (k) => { if (FORBIDDEN_LD_KEYS.includes(k)) err(path, `JSON-LD contains forbidden property "${k}"`); });
    const biz = nodes.find((n) => String(n['@id'] || '').endsWith('#business'));
    if (path === '/' && !biz) err(path, 'LocalBusiness JSON-LD missing on the home page');
    if (biz) traceBusiness(path, biz, site);
    if (!noindexSet.has(path) && path !== '/' && !nodes.some((n) => n['@type'] === 'BreadcrumbList')) err(path, 'BreadcrumbList JSON-LD missing');
    if (path.startsWith('/services/')) {
      const svc = nodes.find((n) => n['@type'] === 'Service');
      if (!svc) err(path, 'Service JSON-LD missing');
      else if (!svc.provider || svc.provider['@id'] !== biz?.['@id']) err(path, 'Service.provider does not point at the business @id');
    }

    // links
    for (const href of a.links) {
      if (!href || /^(mailto:|tel:|sms:|javascript:|data:)/i.test(href) || href.startsWith('#')) continue;
      let target;
      if (/^https?:\/\//i.test(href)) {
        let u; try { u = new URL(href); } catch { err(path, `malformed link ${href}`); continue; }
        if (u.host !== domainHost) continue;
        target = u.pathname;
      } else if (href.startsWith('//')) continue;
      else if (href.startsWith('/')) target = href.split('#')[0].split('?')[0];
      else target = new URL(href.split('#')[0].split('?')[0], 'https://x.test' + (path === '/' ? '/' : path + '/../')).pathname;
      if (!resolves(target)) err(path, `broken internal link: ${href}`);
      else if (target.length > 1 && target.endsWith('/')) warn(path, `internal link with trailing slash: ${href}`);
    }
    if (a.words < 50 && !noindexSet.has(path)) err(path, `only ${a.words} visible words`);
    else if (a.words < 100 && !noindexSet.has(path)) warn(path, `thin content: ${a.words} words`);
  }

  // sitemap
  const sitemapIndex = join(DIST, 'sitemap-index.xml');
  const sitemapUrls = [];
  if (!existsSync(sitemapIndex)) err('sitemap', 'dist/sitemap-index.xml is missing');
  else {
    const idx = readFileSync(sitemapIndex, 'utf8');
    for (const m of idx.matchAll(/<loc>([^<]+)<\/loc>/g)) {
      const name = m[1].split('/').pop();
      if (!m[1].startsWith(site.domain + '/')) err('sitemap', `sitemap file URL not on the domain: ${m[1]}`);
      if (!existsSync(join(DIST, name))) { err('sitemap', `listed sitemap file missing: ${name}`); continue; }
      for (const u of readFileSync(join(DIST, name), 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)) sitemapUrls.push(u[1]);
    }
    const expected = new Set(
      pages
        .filter((p) => (live ? !/noindex/.test(p.a.robots) : !noindexSet.has(p.path)))
        .map((p) => (p.path === '/' ? site.domain + '/' : site.domain + p.path)),
    );
    const got = new Set(sitemapUrls);
    for (const u of expected) if (!got.has(u)) err('sitemap', `indexable page missing from sitemap: ${u}`);
    for (const u of got) if (!expected.has(u)) err('sitemap', `sitemap lists a page that should not be there: ${u}`);
  }

  // robots.txt
  const robotsPath = join(DIST, 'robots.txt');
  if (!existsSync(robotsPath)) err('robots.txt', 'missing from dist');
  else {
    const r = readFileSync(robotsPath, 'utf8');
    const disallowAll = /^\s*Disallow:\s*\/\s*$/m.test(r);
    if (live) {
      if (disallowAll) err('robots.txt', 'live mode but robots.txt disallows everything');
      if (!r.includes(`Sitemap: ${site.domain}/sitemap-index.xml`)) err('robots.txt', 'live mode but robots.txt does not name the sitemap');
    } else if (!disallowAll) err('robots.txt', 'demo mode but robots.txt does not Disallow: /');
  }

  // REPLACE markers in every text output
  const marked = [];
  for (const f of files) {
    if (!['.html', '.xml', '.txt', '.json', '.js', '.css', '.svg', '.webmanifest'].includes(extname(f))) continue;
    if (readFileSync(f, 'utf8').includes('REPLACE:')) marked.push(rel(f));
  }
  if (marked.length) {
    const msg = `unreplaced "REPLACE:" markers in: ${marked.join(', ')}`;
    live ? err('placeholders', msg) : warn('placeholders', msg + ' (allowed in demo mode, fatal in live)');
  }

  // netlify.toml gate config
  const tomlPath = join(ROOT, 'netlify.toml');
  if (existsSync(tomlPath)) {
    const toml = readFileSync(tomlPath, 'utf8');
    if (/to\s*=\s*"\/index\.html"/.test(toml)) err('netlify.toml', 'SPA catch-all redirect to /index.html found; static sites must 404 natively');
    if (!/@netlify\/plugin-lighthouse/.test(toml)) err('netlify.toml', 'Lighthouse plugin is not configured');
    if (!/fail_deploy_on_score_thresholds\s*=\s*"true"/.test(toml)) err('netlify.toml', 'Lighthouse plugin must set fail_deploy_on_score_thresholds = "true"');
    for (const key of ['performance', 'accessibility', 'best-practices']) {
      const m = toml.match(new RegExp(`^\\s*${key}\\s*=\\s*([0-9.]+)`, 'm'));
      if (!m || Number(m[1]) < 0.95) err('netlify.toml', `Lighthouse ${key} threshold must be at least 0.95`);
    }
    const seo = toml.match(/^\s*seo\s*=\s*([0-9.]+)/m);
    if (live && (!seo || Number(seo[1]) !== 1)) err('netlify.toml', 'live mode requires Lighthouse seo threshold = 1 (set it back at cutover)');
    for (const m of toml.matchAll(/path\s*=\s*"([^"]+)"/g)) {
      if (!existsSync(join(DIST, m[1]))) err('netlify.toml', `Lighthouse audit path not in dist: ${m[1]}`);
    }
  } else warn('netlify.toml', 'not found');

  const rows = pages
    .sort((x, y) => x.path.localeCompare(y.path))
    .map((p) => [p.path, p.a.titles[0]?.length ?? 0, p.a.descs[0]?.length ?? 0, p.a.h1, p.a.words, p.a.scripts, /noindex/.test(p.a.robots) ? 'noindex' : 'index', statusFor(p.path)]);
  console.log(`\nseo-check local | mode=${site.mode} | domain=${site.domain}`);
  printTable(rows, ['page', 'title', 'desc', 'h1', 'words', 'js', 'robots', 'status']);
  console.log(`sitemap urls: ${sitemapUrls.length} | 404.html: ${existsSync(join(DIST, '404.html')) ? 'yes' : 'NO'} | robots.txt: ${existsSync(robotsPath) ? 'yes' : 'NO'}`);
  finish('local', pages.length);
}

// every property on the business node must trace to config
function traceBusiness(where, biz, site) {
  const b = site.business;
  const allowed = ['@type', '@id', 'name', 'url', 'telephone', 'email', 'address', 'areaServed', 'openingHours', 'priceRange', 'logo', 'image', 'sameAs'];
  for (const k of Object.keys(biz)) if (!allowed.includes(k)) err(where, `business JSON-LD has untraceable property "${k}"`);
  const eq = (k, v) => { if (JSON.stringify(biz[k]) !== JSON.stringify(v)) err(where, `business JSON-LD ${k} does not match site.config`); };
  eq('@type', b.type);
  eq('name', b.name);
  if (biz.telephone !== undefined) eq('telephone', b.phone?.e164);
  else if (b.phone) err(where, 'business JSON-LD is missing telephone from site.config');
  eq('url', site.domain + '/');
  if (biz.email !== undefined) eq('email', b.email);
  if (biz.priceRange !== undefined) eq('priceRange', b.priceRange);
  if (biz.openingHours !== undefined) eq('openingHours', b.hours);
  if (biz.sameAs !== undefined) eq('sameAs', b.sameAs);
  if (biz.logo !== undefined) eq('logo', site.domain + b.logo);
  if (biz.image !== undefined) eq('image', site.domain + b.logo);
  if (biz.address) {
    const x = biz.address;
    if (!b.address || x.streetAddress !== b.address.street || x.addressLocality !== b.address.city || x.addressRegion !== b.address.region || x.postalCode !== b.address.postal || x.addressCountry !== b.address.country)
      err(where, 'business JSON-LD address does not match site.config');
  }
  if (biz.areaServed) {
    const names = biz.areaServed.map((n) => n.name);
    if (JSON.stringify(names) !== JSON.stringify(b.serviceArea || [])) err(where, 'business JSON-LD areaServed does not match site.config');
  }
}

// ====================================================================
// LIVE MODE
// ====================================================================
async function get(url, opts = {}) {
  return fetch(url, { headers: { 'User-Agent': GPTBOT, Accept: 'text/html,application/xml,text/plain,*/*' }, redirect: 'follow', signal: AbortSignal.timeout(25000), ...opts });
}
async function hops(url) {
  let cur = url, n = 0;
  const chain = [], urls = [url];
  while (n < 8) {
    const r = await fetch(cur, { headers: { 'User-Agent': GPTBOT }, redirect: 'manual', signal: AbortSignal.timeout(25000) });
    chain.push(r.status);
    const loc = r.headers.get('location');
    if (r.status >= 300 && r.status < 400 && loc) { cur = new URL(loc, cur).toString(); urls.push(cur); n++; } else break;
  }
  return { final: cur, count: n, chain, urls };
}
const normPath = (p) => { p = p.replace(/\.html$/, '').replace(/\/index$/, '').replace(/\/+$/, ''); return p === '' ? '/' : p; };

async function liveMode(arg) {
  let base;
  try { base = new URL(arg); } catch { console.error('usage: seo-check.mjs --live https://example.com'); process.exit(2); }
  const origin = base.origin;
  console.log(`\nseo-check live | ${origin} | UA GPTBot`);

  // robots.txt must be a real file
  let robotsText = '';
  try {
    const r = await get(origin + '/robots.txt');
    robotsText = await r.text();
    const ct = r.headers.get('content-type') || '';
    if (r.status !== 200) err('robots.txt', `HTTP ${r.status}`);
    else if (/html/i.test(ct) || /^\s*</.test(robotsText)) err('robots.txt', 'returns HTML, not a real file (SPA fallback or soft 404)');
  } catch (e) { err('robots.txt', `fetch failed: ${e.message}`); }
  const disallowAll = /^\s*Disallow:\s*\/\s*$/m.test(robotsText);

  // sitemap must be a real file
  const sitemapCandidates = [...robotsText.matchAll(/^\s*Sitemap:\s*(\S+)/gim)].map((m) => m[1]);
  if (!sitemapCandidates.length) sitemapCandidates.push(origin + '/sitemap-index.xml', origin + '/sitemap.xml');
  let sitemapPaths = [];
  let sitemapFound = false;
  async function readSitemap(u, depth = 0) {
    const url = origin + new URL(u).pathname; // always fetch from the host under test
    const r = await get(url);
    const text = await r.text();
    const isXml = r.status === 200 && /^\s*(<\?xml|<urlset|<sitemapindex)/.test(text);
    if (!isXml) return false;
    sitemapFound = true;
    const locs = [...text.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1]);
    if (/<sitemapindex/.test(text) && depth < 2) { for (const l of locs) await readSitemap(l, depth + 1); }
    else sitemapPaths.push(...locs.map((l) => new URL(l).pathname));
    return true;
  }
  for (const c of sitemapCandidates) { try { if (await readSitemap(c)) break; } catch {} }
  if (!sitemapFound && !disallowAll) err('sitemap', `no real sitemap XML found (tried ${sitemapCandidates.map((c) => new URL(c).pathname).join(', ')}); a 200 HTML response does not count`);

  // page list
  let paths;
  let source;
  if (disallowAll || !sitemapPaths.length) {
    source = disallowAll ? 'crawl (robots disallows all: demo site)' : 'crawl (no sitemap urls)';
    const seen = new Set(['/']), queue = ['/'];
    while (queue.length && seen.size < 80) {
      const p = queue.shift();
      try {
        const r = await get(origin + p);
        if (!/html/.test(r.headers.get('content-type') || '')) continue;
        for (const href of analyze(await r.text()).links) {
          if (!href || /^(mailto:|tel:|#|javascript:)/i.test(href)) continue;
          let u; try { u = new URL(href, origin + p); } catch { continue; }
          if (u.origin !== origin || extname(u.pathname)) continue;
          const np = u.pathname.length > 1 ? u.pathname.replace(/\/+$/, '') : '/';
          if (!seen.has(np)) { seen.add(np); queue.push(np); }
        }
      } catch {}
    }
    paths = [...seen];
  } else { source = 'sitemap'; paths = [...new Set(sitemapPaths)]; }
  console.log(`pages from ${source}: ${paths.length}`);

  const rows = [];
  const seenTitles = new Map(), seenDescs = new Map();
  const sitemapSet = new Set(sitemapPaths.map(normPath));
  let homeCanonHost = null;
  for (const p of paths) {
    let r, html;
    try { r = await get(origin + p); html = await r.text(); } catch (e) { err(p, `fetch failed: ${e.message}`); continue; }
    if (r.status !== 200) { err(p, `HTTP ${r.status}`); continue; }
    if (!/html/i.test(r.headers.get('content-type') || '')) { err(p, 'not HTML'); continue; }
    const a = analyze(html);
    headChecks(p, a, { canonicalPath: normPath(p) === '/' ? '/' : normPath(p) });
    if (p === '/' && a.canon[0]) { try { homeCanonHost = new URL(a.canon[0]).host; } catch {} }
    if (a.canon[0]) { try { if (new URL(a.canon[0]).host !== base.host) warn(p, `canonical host ${new URL(a.canon[0]).host} differs from fetched host ${base.host} (expected only on staging URLs)`); } catch {} }
    const t = a.titles[0], d = a.descs[0];
    if (t) { if (seenTitles.has(t)) err(p, `duplicate title (also ${seenTitles.get(t)})`); else seenTitles.set(t, p); }
    if (d) { if (seenDescs.has(d)) err(p, `duplicate description (also ${seenDescs.get(d)})`); else seenDescs.set(d, p); }
    if (sitemapSet.has(normPath(p)) && /noindex/.test(a.robots) && !disallowAll) err(p, 'in sitemap but has noindex');
    if (a.words < 50) err(p, `only ${a.words} words visible to GPTBot`);
    else if (a.words < 150) warn(p, `thin content: ${a.words} words visible to GPTBot`);
    if (/<div id="root">\s*<\/div>/.test(html)) err(p, 'empty <div id="root"> in served HTML (unprerendered SPA)');
    rows.push([p, a.titles[0]?.length ?? 0, a.descs[0]?.length ?? 0, a.h1, a.words, a.ld.length, /noindex/.test(a.robots) ? 'noindex' : 'index', statusFor(p)]);
  }

  // real 404
  try {
    const r = await get(origin + '/__not-a-page__');
    if (r.status !== 404) err('/__not-a-page__', `returned HTTP ${r.status}, must be 404 (soft 404 or SPA fallback)`);
  } catch (e) { err('/__not-a-page__', `fetch failed: ${e.message}`); }

  // protocol and host canonicalisation, one hop
  const host = base.host;
  const special = /(^localhost|\.netlify\.app$|^127\.|^\[::1\])/.test(base.hostname);
  if (!special) {
    const canonHost = homeCanonHost || host;
    const variants = [`http://${host}/`];
    const alt = host.startsWith('www.') ? host.slice(4) : 'www.' + host;
    variants.push(`https://${alt}/`, `http://${alt}/`);
    for (const v of variants) {
      try {
        const h = await hops(v);
        const fin = new URL(h.final);
        if (fin.protocol !== 'https:' || fin.host !== canonHost) err(v, `ends at ${h.final}, expected https://${canonHost}/`);
        // Hosts like Netlify force an http->https upgrade on the same host before any redirect rule runs.
        // Allow exactly that as an extra first hop; any other second hop still fails.
        else if (h.count > 1) {
          const [a, b] = [new URL(h.urls[0]), new URL(h.urls[1])];
          const platformUpgrade = h.count === 2 && a.protocol === 'http:' && b.protocol === 'https:' && a.host === b.host;
          if (platformUpgrade) warn(v, `2 hops: host-forced http->https on ${a.host}, then canonical host (platform behavior, accepted)`);
          else err(v, `${h.count} redirect hops (${h.chain.join('>')}), must be 1`);
        }
        console.log(`  ${v} -> ${h.final} (${h.count} hops)`);
      } catch (e) {
        if (v.includes(alt)) warn(v, `variant host did not resolve: ${e.cause?.code || e.message}`); else err(v, `fetch failed: ${e.message}`);
      }
    }
    try {
      const h = await hops(`https://${host}/`);
      if (h.count > 0 && new URL(h.final).host !== canonHost) err(`https://${host}/`, `redirects to ${h.final}`);
    } catch {}
  } else console.log('  host/protocol check skipped (netlify.app or localhost)');

  console.log('');
  printTable(rows.sort((x, y) => x[0].localeCompare(y[0])), ['page', 'title', 'desc', 'h1', 'words', 'ld', 'robots', 'status']);
  finish('live', rows.length);
}

const li = process.argv.indexOf('--live');
if (li !== -1) await liveMode(process.argv[li + 1]);
else await local();
