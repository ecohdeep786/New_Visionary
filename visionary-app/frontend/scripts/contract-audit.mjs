/* F-24 (Platform Engineer): backend contract integration audit.
 * Dependency-free static cross-reference between the frontend's real network
 * call surface and the backend-owned API contracts (pinned NestJS source).
 * Produces docs/visionary/baseline/f24-backend-contracts-2026-11-06/contract-audit.json:
 *   - frontendCalls: every extracted network path (file:line, method, via)
 *   - backendProductRoutes / backendLegacyRoutes: @Controller/@Method routes
 *     (product = FirebaseProductModule files started by main-product.ts/
 *     main-auth.ts; legacy = AppModule started only by src/main.ts)
 *   - matched / frontendOnly / backendUnconsumed cross-reference
 * Fail-closed: a frontend call with no product backend route must be on the
 * recorded-dependency allowlist or the audit exits 1 (drift guard).
 * Env: CONTRACT_EVIDENCE_DIR (default docs/visionary/baseline/f24-backend-contracts-2026-11-06). */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const productRoot = fileURLToPath(new URL('../../', import.meta.url));
const frontendSrc = path.join(productRoot, 'frontend', 'src');
const backendSrc = path.join(productRoot, 'backend', 'upstream', 'backend', 'src');
const evidenceDir = path.resolve(productRoot, process.env.CONTRACT_EVIDENCE_DIR || 'docs/visionary/baseline/f24-backend-contracts-2026-11-06');
fs.mkdirSync(evidenceDir, { recursive: true });

const walk = (dir, out = []) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
};
const rel = (p) => path.relative(productRoot, p).replaceAll('\\', '/');
const collapse = (text) => {
  /* Replace innermost ${...} expressions with :x repeatedly so nested template
   * literals collapse into static path shapes. */
  let prev = text;
  for (;;) {
    const next = prev.replace(/\$\{[^{}]*\}/g, ':x');
    if (next === prev) return next;
    prev = next;
  }
};

/* ── frontend side ─────────────────────────────────────────────────────────── */
const frontendFiles = walk(frontendSrc).filter((f) => /\.(js|jsx|ts|tsx)$/.test(f) && !/\.test\./.test(f));
const texts = new Map(frontendFiles.map((f) => [f, collapse(fs.readFileSync(f, 'utf8'))]));

/* 1. transport bases per file (createAuthTransport; bare form = default /api/auth) */
const baseByFile = new Map();
for (const [file, text] of texts) {
  const m = text.match(/createAuthTransport\(\s*(\{[^}]*\})?\s*\)/);
  if (!m) continue;
  const body = m[1] || '';
  const b = body.match(/basePath\s*[:=]\s*['"]([^'"]+)['"]/);
  const c = body.match(/csrfBasePath\s*[:=]\s*['"]([^'"]+)['"]/);
  baseByFile.set(file, { basePath: b ? b[1] : '/api/auth', csrfBasePath: c ? c[1] : '/api/auth' });
}
/* 2. factories that receive `request` by injection (no default transport) */
const factoryFile = new Map();
for (const [file, text] of texts) {
  const m = text.match(/export function (create[A-Za-z]+)\(\s*\{[^}]*\brequest\b(?!\s*=)/);
  if (m) factoryFile.set(m[1], file);
}
/* 3. resolve injected bases from wiring sites */
const baseForFactory = new Map();
for (const [factory, defFile] of factoryFile) {
  if (baseByFile.has(defFile)) continue;
  for (const [wireFile, text] of texts) {
    if (!baseByFile.has(wireFile)) continue;
    const callRe = new RegExp(`${factory}\\(\\s*\\{[^}]*\\brequest\\b`);
    if (callRe.test(text)) { baseForFactory.set(defFile, baseByFile.get(wireFile)); break; }
  }
}
const baseOf = (file) => (baseByFile.get(file) || baseForFactory.get(file))?.basePath || null;

/* 4. path-builder helpers: `const xPath = ... => return \`seg/${...}\`` */
const builderByFile = new Map();
for (const [file, text] of texts) {
  const m = text.match(/return\s+`([a-z][\w\/\-:x]*)`\s*;?/);
  if (m) builderByFile.set(file, m[1]);
}

const frontendCalls = new Map();
const addCall = (file, line, rawPath, method, via) => {
  let p = rawPath.split('?')[0].replace(/\/+$/, '');
  /* a `:x` glued to the previous segment (no slash) comes from query-string
   * templates like `sessions${search ? ... : ''}` — it is not a path segment */
  p = p.replace(/([a-z]):x$/i, '$1');
  if (!p.startsWith('/')) return;
  const key = `${p} ${method}`;
  const existing = frontendCalls.get(key);
  if (existing) existing.sites.push({ file: rel(file), line, via });
  else frontendCalls.set(key, { path: p, method, via, sites: [{ file: rel(file), line, via }] });
};

const CALL_NAME = /(request|command|call|fetch|http)\s*\(/;
const HTTP_WORD = /^(GET|POST|PATCH|PUT|DELETE|OPTIONS|HEAD|true|false|null|undefined)$/;
for (const [file, rawText] of texts) {
  const lines = rawText.split('\n');
  const base = baseOf(file);
  const builder = builderByFile.get(file) || null;
  const isTransportModule = /authTransport\.js$/.test(file);
  lines.forEach((line, i) => {
    const lineNo = i + 1;
    if (isTransportModule && /['"`]\/csrf['"`]/.test(line)) {
      const csrfBase = baseByFile.get(file)?.csrfBasePath || '/api/auth';
      addCall(file, lineNo, csrfBase + '/csrf', 'GET', 'authTransport csrf');
      return;
    }
    /* continuation form: the call opens on a previous line and the path
     * literal sits alone on this line (e.g. multi-line fetch(url, {)) */
    const bare = line.trim().match(/^([`'"])(\/api\/[^`'"]*)\1,?\s*$/);
    if (bare) {
      for (let back = 1; back <= 3; back += 1) {
        if (CALL_NAME.test(lines[i - back] || '')) {
          const window2 = lines.slice(i, i + 4).join('\n');
          const mm2 = window2.match(/method:\s*['"]?(POST|PATCH|PUT|DELETE)['"]?/);
          addCall(file, lineNo, bare[2], mm2 ? mm2[1] : 'GET', /fetch/.test(lines[i - back]) ? 'direct fetch' : 'authTransport');
          break;
        }
      }
      return;
    }
    /* builder-identifier first arg: command(sessionPath(sessionId), ...) */
    if (builder && base) {
      if (/\b(?:request|command|call)\(\s*\w*Path\(/.test(line)) {
        const window3 = lines.slice(i, i + 3).join('\n');
        const mm3 = window3.match(/method:\s*['"]?(POST|PATCH|PUT|DELETE)['"]?/);
        addCall(file, lineNo, base.replace(/\/$/, '') + '/' + builder, mm3 ? mm3[1] : 'GET', 'authTransport');
      }
    }
    if (!CALL_NAME.test(line)) return;
    /* method: look on this line, then a short lookahead for multi-line fetch options */
    let method = 'GET';
    const window = lines.slice(i, i + 4).join('\n');
    const mm = window.match(/method:\s*['"]?(POST|PATCH|PUT|DELETE)['"]?/);
    if (mm) method = mm[1];
    /* per-occurrence call literals with their own second-arg detection */
    const occRe = /\b(?:request|command|call|fetch|http)\s*\(\s*([`'"])((?:(?!\1).)*)\1\s*(,)?/g;
    let occ;
    const seen = new Set();
    while ((occ = occRe.exec(line)) !== null) {
      if (occ.index > 0 && /[.)]\s*$/.test(line.slice(0, occ.index))) continue; /* method-style call, e.g. navigator.locks.request(...) */
      let lit = occ[2];
      if (builder && lit.startsWith(':x/')) lit = builder + lit.slice(2);
      if (builder && lit === builder.replace('/:x', '/${:x}')) lit = builder;
      let methodHere = method;
      if (occ[3] && /\bcall\(/.test(occ[0])) methodHere = 'POST'; /* call(path, body) wrapper */
      if (lit === '' && base) { addCall(file, lineNo, base, methodHere, 'authTransport'); seen.add(''); continue; }
      if (!/^\/[a-z]/.test(lit) && !(base && /^[a-z][\w\/\-:x]*$/.test(lit))) continue;
      if (HTTP_WORD.test(lit)) continue;
      const full = lit.startsWith('/api/') ? lit : (base && !lit.startsWith('/') ? base.replace(/\/$/, '') + '/' + lit : (base && lit.startsWith('/') && !lit.startsWith('/api/') ? base.replace(/\/$/, '') + lit : lit));
      if (!/^\/api\//.test(full)) continue;
      addCall(file, lineNo, full, methodHere, /fetch\s*\(/.test(occ[0]) ? 'direct fetch' : 'authTransport');
      seen.add(lit);
    }
    /* ternary/other path literals on call lines not captured as first args */
    if (base || /['"`]\/api\//.test(line)) {
      const litRe = /['"`](\/(?:api\/)?[a-zA-Z0-9\-_\/:x.?=&]*)['"`]/g;
      let lit;
      while ((lit = litRe.exec(line)) !== null) {
        const v = lit[1].split('?')[0];
        if (!v || seen.has(v) || seen.has(v.replace(/\/+$/, ''))) continue;
        if (HTTP_WORD.test(v)) continue;
        const full = v.startsWith('/api/') ? v : (base ? base.replace(/\/$/, '') + v : null);
        if (!full || !/^\/api\//.test(full)) continue;
        addCall(file, lineNo, full, method, 'authTransport');
      }
    }
  });
}

/* ── backend side ──────────────────────────────────────────────────────────── */
/* Product build (main-product.ts / main-auth.ts) starts FirebaseProductModule:
 * controllers under auth/firebase-product, billing, feedback, learning. Every
 * other controller belongs to the legacy AppModule (started only by main.ts). */
const PRODUCT_FILE = /(firebase-product|\/billing\/|\/feedback\/|\/learning\/)/;
const backendRoutes = [];
for (const file of walk(backendSrc).filter((f) => /\.controller\.ts$/.test(f))) {
  const text = fs.readFileSync(file, 'utf8');
  const controllerMatch = text.match(/@Controller\(\s*['"]([^'"]*)['"]?\s*\)/);
  if (!controllerMatch) continue;
  const prefix = controllerMatch[1].replace(/^\/+|\/+$/g, '');
  const isProduct = PRODUCT_FILE.test(rel(file).replace(/\\/g, '/'));
  const decoratorRe = /@(Get|Post|Patch|Delete|Put|Sse|All)\(\s*(?:['"]([^'"]*)['"])?\s*\)/g;
  let m;
  while ((m = decoratorRe.exec(text)) !== null) {
    const method = m[1] === 'Sse' ? 'GET(SSE)' : m[1].toUpperCase();
    const sub = (m[2] || '').replace(/^\/+|\/+$/g, '');
    const lineNo = text.slice(0, m.index).split('\n').length;
    const full = ('/api/' + prefix + (sub ? '/' + sub : '')).replace(/\/+$/, '');
    backendRoutes.push({ file: rel(file), line: lineNo, product: isProduct, method, path: full });
  }
}

/* ── cross-reference ───────────────────────────────────────────────────────── */
const routeMatches = (callPath, routePath) => {
  const a = callPath.split('/').filter(Boolean).slice(1); /* drop api */
  const b = routePath.replace(/^\/api/, '').split('/').filter(Boolean);
  if (a.length !== b.length) return false;
  return a.every((seg, i) => b[i].startsWith(':') || b[i] === seg);
};
const productRoutes = backendRoutes.filter((r) => r.product);
const legacyRoutes = backendRoutes.filter((r) => !r.product);

const matched = [];
const frontendOnly = [];
for (const call of frontendCalls.values()) {
  const hit = productRoutes.find((r) => r.method.split('(')[0] === call.method && routeMatches(call.path, r.path))
    || productRoutes.find((r) => routeMatches(call.path, r.path));
  if (hit) matched.push({ frontend: call, backend: { file: hit.file, line: hit.line, method: hit.method, path: hit.path } });
  else frontendOnly.push(call);
}

/* Recorded dependencies: frontend paths with no product backend contract,
 * accepted by this audit as recorded findings (F-24 receipt). Anything not on
 * this allowlist fails the audit so future drift is caught. */
const RECORDED_FRONTEND_ONLY = new Set([
  '/api/apps/:x/mcp/consent-info GET',
  '/api/apps/:x/mcp/authorize-grant POST',
]);
const unexpectedFrontendOnly = frontendOnly.filter((c) => !RECORDED_FRONTEND_ONLY.has(`${c.path} ${c.method}`));

const consumedRouteKeys = new Set(matched.map((m) => `${m.backend.method} ${m.backend.path}`));
const backendUnconsumed = productRoutes.filter((r) => !consumedRouteKeys.has(`${r.method} ${r.path}`));

const receipt = {
  task: 'F-24 backend contract integration audit',
  at: new Date().toISOString(),
  frontendRoot: 'frontend/src',
  backendRoot: 'backend/upstream/backend/src',
  summary: {
    frontendCalls: frontendCalls.size,
    backendProductRoutes: productRoutes.length,
    backendLegacyRoutes: legacyRoutes.length,
    matched: matched.length,
    frontendOnlyRecorded: frontendOnly.length - unexpectedFrontendOnly.length,
    frontendOnlyUnexpected: unexpectedFrontendOnly.length,
    backendUnconsumed: backendUnconsumed.length,
  },
  frontendCalls: [...frontendCalls.values()],
  backendProductRoutes: productRoutes,
  backendLegacyRoutes: legacyRoutes,
  matched,
  frontendOnly,
  backendUnconsumed,
};
const outPath = path.join(evidenceDir, 'contract-audit.json');
fs.writeFileSync(outPath, JSON.stringify(receipt, null, 2) + '\n');

console.log(`Frontend calls: ${frontendCalls.size}; backend product routes: ${productRoutes.length}; legacy routes: ${legacyRoutes.length}`);
console.log(`Matched: ${matched.length}; frontend-only (recorded deps): ${frontendOnly.length - unexpectedFrontendOnly.length}; backend unconsumed: ${backendUnconsumed.length}`);
for (const call of frontendOnly) console.log(`  frontend-only: ${call.method} ${call.path} <- ${call.sites.map((s) => `${s.file}:${s.line}`).join(', ')}`);
if (unexpectedFrontendOnly.length) {
  console.log('AUDIT FAIL: frontend calls with no product backend contract and not on the recorded-dependency allowlist:');
  for (const call of unexpectedFrontendOnly) console.log(`  UNMATCHED: ${call.method} ${call.path}`);
  process.exit(1);
}
console.log(`PASS contract audit: every frontend network call has a product backend route or a recorded dependency. Receipt: ${rel(outPath)}`);
