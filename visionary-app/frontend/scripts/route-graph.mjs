#!/usr/bin/env node
/* F-01 (Principal Frontend Architecture & Route Engineer): route graph builder.
 *
 * Extracts the ACTUAL route table from src/App.jsx with the surface audit's
 * route parser (extractRoutes), classifies segment/auth/guard per route,
 * separates redirects, and cross-checks the route truth sources against the
 * declared routes so SEO meta cannot declare content that is absent:
 *
 *   1. A catch-all '*' route rendering PageNotFound must exist.
 *   2. /onboarding is auth-required behind ProtectedRoute.
 *   3. Every /dashboard route is auth-required behind ProtectedRoute AND
 *      OnboardingGate (workspace gating law).
 *   4. Every ROUTE_META key (src/lib/routeMeta.js) is a declared public
 *      non-redirect route, and every public page route has meta — the meta
 *      matrix cannot describe absent content nor miss a public page.
 *   5. SITEMAP_ROUTES equals the declared public non-redirect route set.
 *   6. Every public/sitemap.xml <loc> uses the SITE_URL origin (the live
 *      origin recorded in src/lib/PageMeta.jsx) and a declared public path;
 *      the DNS-dead visionary.app origin must never reappear.
 *   7. public/robots.txt must point Sitemap: at the same live origin.
 *
 * CLI: node scripts/route-graph.mjs [--out <file>]
 * Default output: docs/visionary/baseline/f01-route-graph-2026-11-07/ROUTE_GRAPH.json
 * Exports buildRouteGraph for tests/route-contract.test.mjs (single truth).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { extractRoutes } from './surface-audit-lib.mjs';

const parse = (file, text) => ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, /\.[jt]sx$/.test(file) ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
const walk = (node, visit) => { visit(node); ts.forEachChild(node, child => walk(child, visit)); };
const literal = node => node && (ts.isStringLiteralLike(node) ? node.text : ts.isJsxExpression(node) ? literal(node.expression) : undefined);

const AUTH_PATHS = ['/signin', '/login', '/register', '/forgot-password', '/forgot-user-id', '/reset-password', '/auth/action'];

function exportedArrayStrings(sourceFile, name) {
  let values;
  walk(sourceFile, node => {
    if (ts.isVariableStatement(node) && node.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword)) {
      for (const decl of node.declarationList.declarations) {
        if (decl.name.getText(sourceFile) === name && decl.initializer && ts.isArrayLiteralExpression(decl.initializer)) {
          const items = decl.initializer.elements.map(literal);
          if (items.some(v => v === undefined)) throw new Error(`Route contract ${name} contains a non-literal entry`);
          values = items;
        }
      }
    }
  });
  if (!values) throw new Error(`Cannot resolve exported array: ${name}`);
  return values;
}

function exportedObjectStringKeys(sourceFile, name) {
  const keys = [];
  walk(sourceFile, node => {
    if (ts.isVariableStatement(node) && node.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword)) {
      for (const decl of node.declarationList.declarations) {
        if (decl.name.getText(sourceFile) === name && decl.initializer && ts.isObjectLiteralExpression(decl.initializer)) {
          for (const prop of decl.initializer.properties) {
            if (!ts.isPropertyAssignment(prop) && !ts.isShorthandPropertyAssignment(prop)) continue;
            const key = prop.name.getText(sourceFile).replace(/^["'`]|["'`]$/g, '');
            if (!key.startsWith('/')) continue; // non-route exports inside the same object are outside this contract
            keys.push(key);
          }
        }
      }
    }
  });
  if (!keys.length) throw new Error(`Cannot resolve exported object keys: ${name}`);
  return keys.sort();
}

/* SITE_URL lives in JSX (src/lib/PageMeta.jsx) with import.meta.env, so the
 * default origin is read with a pinned expression rather than an import. */
export const siteUrlDefault = pageMetaText => {
  const match = /export const SITE_URL = \(import\.meta\.env\.VITE_SITE_URL \|\| "([^"]+)"\)/.exec(pageMetaText);
  if (!match) throw new Error('Cannot resolve SITE_URL default from src/lib/PageMeta.jsx');
  return match[1].replace(/\/+$/, '');
};

export function buildRouteGraph({ appText, routeMetaText, pageMetaText, sitemapXml, robotsTxt }) {
  const routes = extractRoutes(appText).map(route => {
    const redirect = route.redirect ?? null;
    const segment = redirect ? 'redirect'
      : route.path === '*' ? 'catch-all'
      : route.path.startsWith('/dashboard') || route.path === '/onboarding' ? 'protected'
      : AUTH_PATHS.includes(route.path) ? 'auth'
      : 'public';
    const auth = segment === 'protected' ? 'required' : 'public-or-provider-action';
    const guards = segment === 'protected' && route.path.startsWith('/dashboard') ? ['ProtectedRoute', 'OnboardingGate'] : segment === 'protected' ? ['ProtectedRoute'] : [];
    return { id: route.id, path: route.path, index: route.index, component: route.component,
      componentImport: route.componentImport, redirect, segment, auth, guards, environment: route.environment };
  });

  const catchAll = routes.find(r => r.path === '*');
  if (!catchAll || catchAll.component !== 'PageNotFound' || catchAll.redirect) throw new Error('Route contract: missing or wrong catch-all 404 route');
  const onboarding = routes.find(r => r.path === '/onboarding');
  if (!onboarding || onboarding.guards.join() !== 'ProtectedRoute') throw new Error('Route contract: /onboarding must sit behind ProtectedRoute');
  for (const route of routes.filter(r => r.path.startsWith('/dashboard'))) {
    if (route.guards.join() !== 'ProtectedRoute,OnboardingGate') throw new Error(`Route contract: ${route.id} must sit behind ProtectedRoute+OnboardingGate`);
  }

  const metaSource = parse('routeMeta.js', routeMetaText);
  const routeMetaKeys = exportedObjectStringKeys(metaSource, 'ROUTE_META');
  const sitemapRoutes = exportedArrayStrings(metaSource, 'SITEMAP_ROUTES');
  const publicPages = routes.filter(r => r.segment === 'public').map(r => r.path).sort();
  const declaredPublic = new Set(publicPages);

  const metaUnknown = routeMetaKeys.filter(key => !declaredPublic.has(key));
  if (metaUnknown.length) throw new Error(`ROUTE_META declares absent routes: ${metaUnknown.join(', ')}`);
  const missingMeta = publicPages.filter(p => !routeMetaKeys.includes(p));
  if (missingMeta.length) throw new Error(`Public routes without ROUTE_META: ${missingMeta.join(', ')}`);
  const sitemapUnknown = sitemapRoutes.filter(p => !declaredPublic.has(p));
  if (sitemapUnknown.length) throw new Error(`SITEMAP_ROUTES declares absent routes: ${sitemapUnknown.join(', ')}`);
  const undeclaredPublic = publicPages.filter(p => !sitemapRoutes.includes(p));
  if (undeclaredPublic.length) throw new Error(`Public routes missing from SITEMAP_ROUTES: ${undeclaredPublic.join(', ')}`);

  const siteOrigin = new URL(siteUrlDefault(pageMetaText)).origin;
  const locs = [...sitemapXml.matchAll(/<loc>(.*?)<\/loc>/g)].map(match => new URL(match[1]));
  if (!locs.length) throw new Error('sitemap.xml exposes no <loc> entries');
  const deadOrigin = locs.filter(u => u.origin !== siteOrigin);
  if (deadOrigin.length) throw new Error(`sitemap.xml <loc> entries off the live SITE_URL origin (${siteOrigin}): ${[...new Set(deadOrigin.map(u => u.origin))].join(', ')}`);
  const locUnknown = locs.map(u => u.pathname.replace(/\/$/, '') || '/').filter(p => !declaredPublic.has(p));
  if (locUnknown.length) throw new Error(`sitemap.xml lists undeclared routes: ${[...new Set(locUnknown)].join(', ')}`);
  const robotsSitemap = /Sitemap:\s*(\S+)/.exec(robotsTxt)?.[1];
  if (robotsSitemap !== `${siteOrigin}/sitemap.xml`) throw new Error(`robots.txt Sitemap must be ${siteOrigin}/sitemap.xml, found: ${robotsSitemap}`);

  const redirects = routes.filter(r => r.redirect).map(r => ({ from: r.path, to: r.redirect }));
  const summary = {
    total: routes.length,
    public: publicPages.length,
    auth: routes.filter(r => r.segment === 'auth').length,
    protected: routes.filter(r => r.segment === 'protected' && !r.index).length,
    redirects: redirects.length,
    catchAll: '*',
    siteOrigin,
  };

  return {
    generatedFrom: 'visionary-app/frontend/src/App.jsx',
    routes, redirects, summary,
    contracts: { routeMetaKeys, sitemapRoutes, publicPages, sitemapLocs: locs.map(u => `${u.origin}${u.pathname === '/' ? '/' : u.pathname.replace(/\/$/, '')}`) },
  };
}

function main() {
  const frontendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const outIndex = process.argv.indexOf('--out');
  const out = outIndex > -1 ? path.resolve(process.argv[outIndex + 1])
    : path.join(frontendRoot, '..', 'docs/visionary/baseline/f01-route-graph-2026-11-07/ROUTE_GRAPH.json');
  const read = relative => fs.readFileSync(path.join(frontendRoot, relative), 'utf8');
  const graph = buildRouteGraph({
    appText: read('src/App.jsx'),
    routeMetaText: read('src/lib/routeMeta.js'),
    pageMetaText: read('src/lib/PageMeta.jsx'),
    sitemapXml: read('public/sitemap.xml'),
    robotsTxt: read('public/robots.txt'),
  });
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, `${JSON.stringify(graph, null, 2)}\n`);
  console.log(`route graph written: ${out}`);
  console.log(JSON.stringify(graph.summary));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
