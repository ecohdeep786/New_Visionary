#!/usr/bin/env node
/* F-04 (Chief Experience Architecture & Page Journey Engineer): CTA trace.
 *
 * Walks every public page family with the surface audit's control extractor,
 * resolves each control destination against the declared route graph (the
 * single truth from scripts/route-graph.mjs), and classifies the outcome:
 *
 *   internal-route      declared public/auth/dashboard route — traceable CTA
 *   internal-anchor     declared route with a #hash section target
 *   redirect-alias      declared redirect (/signin, /career)
 *   external            absolute http(s) link (recorded, not traced further)
 *   contact-scheme      mailto:/tel:
 *   DEAD-END            destination that is NOT a declared route, NOT an
 *                       external link and NOT a scheme — a broken promise
 *
 * Output: CTA_TRACE.csv (source file:line, control, destination, class,
 * resolved route) into the F-04 evidence directory, plus a console defect
 * list. Exit 1 when a dead end exists — a CTA that promises a destination
 * the product does not declare is an information-architecture defect.
 *
 * CLI: node scripts/cta-trace.mjs [--out <dir>]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { inspectSource } from './surface-audit-lib.mjs';
import { buildRouteGraph } from './route-graph.mjs';

const frontendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const productRoot = path.resolve(frontendRoot, '..');
const outIndex = process.argv.indexOf('--out');
const outDir = outIndex > -1 ? path.resolve(process.argv[outIndex + 1])
  : path.join(productRoot, 'docs/visionary/baseline/f04-experience-map-2026-11-07');

/* The public page families a visitor can actually reach (F-04 scope). */
const SCAN_FILES = [
  'src/pages/Landing.jsx',
  ...fs.readdirSync(path.join(frontendRoot, 'src/pages/landing')).filter(f => f.endsWith('.jsx')).map(f => `src/pages/landing/${f}`),
  ...fs.readdirSync(path.join(frontendRoot, 'src/components/landing')).filter(f => f.endsWith('.jsx')).map(f => `src/components/landing/${f}`),
  ...fs.readdirSync(path.join(frontendRoot, 'src/components/landing/LandingNav')).filter(f => f.endsWith('.jsx')).map(f => `src/components/landing/LandingNav/${f}`),
];

const read = relative => fs.readFileSync(path.join(frontendRoot, relative), 'utf8');

function buildTrace({ appText, routeMetaText, pageMetaText, sitemapXml, robotsTxt, sources }) {
  const graph = buildRouteGraph({ appText, routeMetaText, pageMetaText, sitemapXml, robotsTxt });
  const declared = new Map(graph.routes.filter(r => !r.redirect).map(r => [r.path, r]));
  const redirectMap = new Map(graph.redirects.map(r => [r.from, r.to]));

  function classify(destination) {
    if (!destination) return { class: 'no-destination', route: null };
    if (/^(https?:)?\/\//.test(destination)) return { class: 'external', route: destination };
    if (/^(mailto:|tel:)/.test(destination)) return { class: 'contact-scheme', route: destination };
    const [pathPart, hash] = destination.split('#');
    const clean = pathPart === '' ? '/' : pathPart.replace(/\/+$/, '') || '/';
    if (redirectMap.has(clean)) return { class: 'redirect-alias', route: `${redirectMap.get(clean)}${hash ? `#${hash}` : ''}` };
    if (declared.has(clean)) return { class: hash ? 'internal-anchor' : 'internal-route', route: `${clean}${hash ? `#${hash}` : ''}` };
    if (clean.startsWith('/dashboard')) return { class: 'dashboard-route', route: clean };
    return { class: 'DEAD-END', route: destination };
  }

  const rows = [];
  for (const [file, text] of Object.entries(sources)) {
    let scan;
    try {
      scan = inspectSource(file, text);
    } catch (error) {
      throw new Error(`scan failed for ${file}: ${String(error).slice(0, 120)}`);
    }
    for (const control of scan.controls) {
      if (control.destination === undefined) continue;
      const verdict = classify(control.destination);
      rows.push({
        source: `${file}:${control.line}`,
        tag: control.tag,
        text: (text.split('\n')[control.line - 1] ?? '').replace(/\s+/g, ' ').trim().slice(0, 120),
        destination: control.destination,
        class: verdict.class,
        resolved: verdict.route,
      });
    }
  }
  return { rows, graph };
}

const deadEndsOf = rows => rows.filter(row => row.class === 'DEAD-END');

function main() {
  const outDir = outIndex > -1 ? path.resolve(process.argv[outIndex + 1])
    : path.join(productRoot, 'docs/visionary/baseline/f04-experience-map-2026-11-07');
  const sources = Object.fromEntries(SCAN_FILES.filter(f => fs.existsSync(path.join(frontendRoot, f))).map(f => [f, read(f)]));
  const { rows } = buildTrace({
    appText: read('src/App.jsx'),
    routeMetaText: read('src/lib/routeMeta.js'),
    pageMetaText: read('src/lib/PageMeta.jsx'),
    sitemapXml: read('public/sitemap.xml'),
    robotsTxt: read('public/robots.txt'),
    sources,
  });
  const deadEnds = deadEndsOf(rows);
  fs.mkdirSync(outDir, { recursive: true });
  const csvEscape = value => `"${String(value ?? '').replaceAll('"', '""')}"`;
  const csv = ['source,tag,text,destination,class,resolved', ...rows.map(r => [r.source, r.tag, r.text, r.destination, r.class, r.resolved].map(csvEscape).join(','))].join('\n');
  fs.writeFileSync(path.join(outDir, 'CTA_TRACE.csv'), `${csv}\n`);
  console.log(`CTA trace: ${rows.length} destination-bearing controls across ${Object.keys(sources).length} page-family files -> ${path.join(outDir, 'CTA_TRACE.csv')}`);
  const byClass = {};
  for (const row of rows) byClass[row.class] = (byClass[row.class] ?? 0) + 1;
  console.log(JSON.stringify(byClass));
  if (deadEnds.length) {
    console.log(`FAIL ${deadEnds.length} dead-end CTA(s):`);
    for (const row of deadEnds) console.log(` - ${row.source} "${row.text}" -> ${row.destination}`);
    process.exit(1);
  }
  console.log('PASS every traced destination resolves to a declared route, alias, external link or contact scheme.');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
export { buildTrace, deadEndsOf, SCAN_FILES };
