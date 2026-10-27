#!/usr/bin/env node
/* ──────────────────────────────────────────────────────────────────────────
 * E1/FAP continuity law check — static, dependency-free.
 *
 * Public landing system scope: src/pages/landing + src/components/landing.
 * Enforces the recorded, evidence-backed laws; nothing else fails:
 *
 *   1. Tap-target law (D2 slice): every interactive <button>/<a> control on
 *      the public surface is ≥44px (h-11 or larger). Sub-44px (h-9/h-10)
 *      height utilities inside button/anchor tags fail. aria-hidden and
 *      pointer-events-none marks are exempt; the ICON size inside a control
 *      is not the control size.
 *   2. Uppercase-kicker law (B2): no text-transform:uppercase (CSS or style
 *      object) and no standalone `uppercase` utility inside class
 *      attributes. Prose that merely mentions uppercase is not a hit.
 *   3. Legacy-hex residue (A3 receipt): the recorded banned Google/legacy
 *      value set must never appear as a raw value in public UI files. The
 *      alias site itself (system/tokens.js) is reported, not failed.
 *   4. Law-palette freeze (E1): every raw hex in public scope must belong to
 *      the measured law family — the values defined in tokens.js plus the
 *      recorded static core and receipt-justified exceptions. Unknown hexes
 *      fail, so the palette cannot drift without a recorded decision.
 *   5. Invalid `#rgba(` artifacts (A3 artifact pass) never reappear.
 *
 * Reported-only metrics: per-page raw-hex counts and raw #0066cc link sites
 * (the A3 retag keeps law values inline in the shared measured components).
 *
 * Exit 0 when all laws pass; failures print as file:line and exit 1.
 * `--out <file>` writes a JSON receipt (directories auto-created); `-q` quiets.
 * ────────────────────────────────────────────────────────────────────────── */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const frontendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const SCOPED_DIRS = [
  path.join(frontendRoot, 'src', 'pages', 'landing'),
  path.join(frontendRoot, 'src', 'components', 'landing'),
];
const SCOPED_EXT = /\.(jsx?|css)$/;
const HEX_RE_GLOBAL = /#[0-9a-fA-F]{3,8}\b/g;

/* Pure law helpers (exercised by scripts/tests/continuity-law.test.mjs). */

export const countRawHex = (text) => (text.match(HEX_RE_GLOBAL) || []).length;

const LEGACY_HEXES = new Set([
  // recorded A3 remap table (legacy Google/public palette)
  '#4285f4', '#1a73e8', '#0b57d0', '#174ea6', '#3367d6', '#5f6368', '#9aa0a6',
  '#dadce0', '#f8f9fa', '#f1f3f4', '#202124', '#121317', '#3c4043', '#2c2d31',
  '#ea4335', '#34a853', '#fbbc04', '#e8f0fe', '#e8f0fd', '#d2e3fc', '#e6f4ea',
  '#8ab4f8', '#ecbc8e',
]);

const LAW_HEXES = new Set([
  // measured law core (tokens.js values + recorded measured families)
  '#1d1d1f', '#272729', '#6e6e73', '#86868b', '#d2d2d7', '#f5f5f7',
  '#ffffff', '#fff', '#000000', '#000',
  '#0066cc', '#0071e3', '#0077ed', '#006edb', '#2997ff',
  '#e30000', '#34c759', '#ff9500',
  // receipt-justified additions (E1 2026-10-23; see the file header receipt)
  '#e8e8ed', // chip/hover depth above the #f5f5f7 ground (greyPill/chipPill hover slot)
  '#188038', // success-ink green, AA-safe for 12–13px trust captions on white/#f5f5f7
]);

/* File-scoped exemptions: recorded so the freeze stays honest. Art palettes
 * are not UI tokens; PremiumPersona stage values are design-governed and
 * documented as token-export candidates.
 * F10 split (2026-10-26): monolith paths moved to per-section modules — the
 * SAME approved values re-registered under the new paths; no value added
 * or removed (abbreviated-split verified byte-verbatim). */
const FILE_HEX_EXCEPTIONS = {
  'src/components/landing/persona/premium/PremiumIntelligenceSection.jsx': {
    values: new Set(['#0d1017', '#0a0d14', '#6bb6ff']),
    reason: 'Premium stage near-black grounds + on-dark link:hover tone; token-export candidates (E1 receipt 2026-10-23). Path from PremiumPersonaSections.jsx after the F10 split.',
  },
  'src/components/landing/persona/premium/PremiumCTASection.jsx': {
    values: new Set(['#0d1017', '#0a0d14', '#6bb6ff']),
    reason: 'Premium stage near-black grounds + on-dark link:hover tone; token-export candidates (E1 receipt 2026-10-23). Path from PremiumPersonaSections.jsx after the F10 split.',
  },
  'src/components/landing/AboutUsHero.jsx': {
    values: new Set(['#e9f5ef', '#fef3df', '#f3edff', '#fcebe8']),
    reason: 'Persona door tints — design-governed pastels; tint-token family candidate (E1 receipt 2026-10-23).',
  },
  'src/components/landing/SpotIllustration/palette.jsx': {
    allowAll: true,
    reason: 'Editorial illustration palette (art, not UI law). Path from SpotIllustration.jsx after the F10 split.',
  },
  'src/components/landing/SpotIllustration/scenes-primary.jsx': {
    allowAll: true,
    reason: 'Editorial illustration palette (art, not UI law). Path from SpotIllustration.jsx after the F10 split.',
  },
  'src/components/landing/SpotIllustration/scenes-academic.jsx': {
    allowAll: true,
    reason: 'Editorial illustration palette (art, not UI law). Path from SpotIllustration.jsx after the F10 split.',
  },
  'src/components/landing/SpotIllustration/scenes-portraits.jsx': {
    allowAll: true,
    reason: 'Editorial illustration palette (art, not UI law). Path from SpotIllustration.jsx after the F10 split.',
  },
  'src/components/landing/SpotIllustration/scenes-wide.jsx': {
    allowAll: true,
    reason: 'Editorial illustration palette (art, not UI law). Path from SpotIllustration.jsx after the F10 split.',
  },
  'src/components/landing/SpotIllustration/index.jsx': {
    allowAll: true,
    reason: 'Editorial illustration palette (art, not UI law). Path from SpotIllustration.jsx after the F10 split.',
  },
};

export function hexLawViolations(text, allowed = new Set()) {
  const violations = [];
  HEX_RE_GLOBAL.lastIndex = 0;
  let m;
  while ((m = HEX_RE_GLOBAL.exec(text))) {
    const value = m[0].toLowerCase();
    if (LAW_HEXES.has(value) || allowed.has(value)) continue;
    violations.push({ kind: LEGACY_HEXES.has(value) ? 'legacy-hex' : 'unknown-law-hex', value, index: m.index });
  }
  return violations;
}

export function artifactViolations(text) {
  const out = [];
  const re = /#rgba\(/g;
  let m;
  while ((m = re.exec(text))) out.push({ kind: 'invalid-rba-artifact', index: m.index });
  return out;
}

const SUB44_RE = /\b(?:h-9|h-10)(?![0-9a-z])/;
const CLASS_ATTR_RE = /\bclass[A-Za-z]*\s*=\s*(?:"((?:\\.|[^"\\])*)"|'((?:\\.|[^'\\])*)'|`((?:\\.|[^`\\])*)`)/g;

export function uppercaseVoiceViolations(text, isCss = false) {
  const hits = [];
  if (isCss) {
    if (/text-transform\s*:\s*uppercase/i.test(text)) hits.push({ kind: 'css-uppercase' });
    return hits;
  }
  if (/textTransform\s*:\s*["'`]uppercase["'`]/i.test(text)) hits.push({ kind: 'textTransform-uppercase' });
  CLASS_ATTR_RE.lastIndex = 0;
  let m;
  while ((m = CLASS_ATTR_RE.exec(text))) {
    const value = m[1] ?? m[2] ?? m[3] ?? '';
    if (/(^|[\s"{(,:])uppercase(?=[\s"}),;]|$)/m.test(value)) hits.push({ kind: 'uppercase-class', index: m.index });
  }
  return hits;
}

/* Extract one JSX tag starting at an interactive tag-open index. Walks
 * quotes (" ' `) and ANY `{…}` brace scope (templates `${…}` and plain
 * `{expr}` both balance), so the walk survives CRLF files and arrow
 * functions and still ends at this tag's closing `>`. */
export function extractTag(text, openIndex) {
  let depth = 0, quote = null, escaped = false;
  for (let i = openIndex + 1; i < text.length && i - openIndex < 8000; i++) {
    const ch = text[i];
    if (escaped) { escaped = false; continue; }
    if (quote) {
      if (ch === '\\') escaped = true;
      else if (quote !== '`' && ch === quote) quote = null;
      else if (quote === '`' && ch === '`') quote = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') { quote = ch; continue; }
    if (ch === '{') depth++;
    else if (ch === '}' && depth > 0) depth--;
    else if (ch === '>' && depth === 0) return text.slice(openIndex, i + 1);
  }
  return text.slice(openIndex, openIndex + 200);
}

const INTERACTIVE_TAG_RE = /<(button|a)(?=[\s>\n])/g;

export function findSub44pxControls(text) {
  const hits = [];
  INTERACTIVE_TAG_RE.lastIndex = 0;
  let match;
  while ((match = INTERACTIVE_TAG_RE.exec(text))) {
    const tag = extractTag(text, match.index);
    if (!SUB44_RE.test(tag)) continue;
    if (/aria-hidden\s*=\s*(?:"true"|\{true\})/.test(tag)) continue;
    if (/pointer-events-none/.test(tag)) continue;
    hits.push({
      line: text.slice(0, match.index).split(/\r?\n/).length,
      snippet: ((tag.match(/(?:focus:)?(?:h-9|h-10)/g) || []).slice(0, 3).join('+')) || '(height utility in template)',
    });
  }
  return hits;
}

/* Read tokens.js once — its values are law by definition. */
function readTokenHexes() {
  const file = path.join(frontendRoot, 'src', 'components', 'landing', 'system', 'tokens.js');
  try {
    const text = fs.readFileSync(file, 'utf8');
    return new Set((text.match(HEX_RE_GLOBAL) || []).map(v => v.toLowerCase()));
  } catch {
    return new Set();
  }
}

function* walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else yield full;
  }
}

const rel = (file) => path.relative(frontendRoot, file).split(path.sep).join('/');

function run({ out = console, outReceipt = null } = {}) {
  const failures = [];
  const metrics = { pages: [], controls: [], uppercase: [], hexAudit: [], artifacts: [], links: [], tokensLegacyAliases: [] };
  const tokenHexes = readTokenHexes();
  let scanned = 0;

  const pushFailure = (law, detail) => failures.push({ law, detail });

  for (const dir of SCOPED_DIRS) {
    if (!fs.existsSync(dir)) continue;
    for (const file of walk(dir)) {
      if (!SCOPED_EXT.test(file)) continue;
      scanned++;
      const text = fs.readFileSync(file, 'utf8');
      const label = rel(file);
      const isCss = file.endsWith('.css');
      const isTokens = label.endsWith('system/tokens.js');

      /* Law 1 — interactive tap targets ≥44px. */
      for (const hit of findSub44pxControls(text)) {
        metrics.controls.push(`${label}:${hit.line} ${hit.snippet}`);
        pushFailure('tap-target-44px', `${label}:${hit.line} ${hit.snippet}`);
      }

      /* Law 2 — uppercase kickers stay dead. */
      for (const hit of uppercaseVoiceViolations(text, isCss)) {
        const at = hit.index !== undefined ? ':' + (text.slice(0, hit.index).split(/\r?\n/).length) : '';
        metrics.uppercase.push(label + at + ' (' + hit.kind + ')');
        pushFailure('no-uppercase-kickers', `${label}${at} carries an uppercase ${hit.kind.replace('-uppercase', '')}`);
      }

      /* Laws 3–5 — hex/artifact audit. tokens.js is the definition site:
         its own values are law (auto-added above) and its legacy aliases are
         reported, not failed. */
      if (!isCss) {
        const exception = FILE_HEX_EXCEPTIONS[label];
        const allowed = new Set(tokenHexes);
        let audit = true;
        if (exception && exception.allowAll) audit = false;
        if (exception && exception.values) for (const v of exception.values) allowed.add(v);
        if (audit) {
          for (const v of hexLawViolations(text, allowed)) {
            metrics.hexAudit.push({ file: label, kind: v.kind, value: v.value });
            if (v.kind === 'legacy-hex') {
              if (!isTokens) pushFailure('legacy-hex-residue', `${label} carries legacy ${v.value}`);
            } else if (v.kind === 'unknown-law-hex') {
              pushFailure('unknown-law-hex', `${label} carries ${v.value} — law value or new leak?`);
            }
          }
        }
        if (isTokens) {
          for (const v of hexLawViolations(text, new Set())) {
            if (v.kind === 'legacy-hex') metrics.tokensLegacyAliases.push({ value: v.value });
          }
        }
        for (const v of artifactViolations(text)) {
          metrics.artifacts.push(label);
          pushFailure('invalid-rba-artifact', `${label} carries an invalid #rgba( artifact`);
        }
      }

      /* Metric — page hex counts. */
      if (label.includes('/pages/landing/') && !isCss) {
        const hexes = (text.toLowerCase().match(HEX_RE_GLOBAL) || []);
        metrics.pages.push({ file: label, hexes: hexes.length, unique: new Set(hexes).size });
      }

      /* Metric — raw link hex sites. */
      if (!isTokens) {
        const lower = text.toLowerCase();
        let at = lower.indexOf('#0066cc');
        while (at !== -1) {
          metrics.links.push({ file: label, line: text.slice(0, at).split(/\r?\n/).length });
          if (metrics.links.length >= 200) break;
          at = lower.indexOf('#0066cc', at + 1);
        }
      }
    }
  }

  const failuresListed = [];
  const seen = new Set();
  for (const f of failures) {
    const key = f.law + '|' + f.detail;
    if (seen.has(key)) continue;
    seen.add(key);
    failuresListed.push(f);
  }

  out.log?.('qa:continuity — public-surface law check');
  out.log?.(`  files scanned: ${scanned}`);
  for (const key of Object.keys(metrics)) {
    if (!metrics[key].length) continue;
    out.log?.(`  ${key}:`);
    for (const row of metrics[key].slice(0, 200)) out.log?.(`    - ${typeof row === 'string' ? row : JSON.stringify(row)}`);
  }
  if (failuresListed.length) {
    out.log?.('  FAIL:');
    for (const f of failuresListed) out.log?.(`    [${f.law}] ${f.detail}`);
  } else {
    out.log?.('  all recorded public-surface laws pass');
  }

  if (outReceipt) {
    const receiptPath = path.isAbsolute(outReceipt) ? outReceipt : path.resolve(process.cwd(), outReceipt);
    fs.mkdirSync(path.dirname(receiptPath), { recursive: true });
    fs.writeFileSync(receiptPath, JSON.stringify({
      generatedAt: new Date().toISOString(),
      filesScanned: scanned,
      laws: ['tap-target-44px', 'no-uppercase-kickers', 'legacy-hex-residue', 'unknown-law-hex', 'invalid-rba-artifact'],
      tokensLegacyAliases: Object.keys(metrics).includes('tokensLegacyAliases') ? metrics.tokensLegacyAliases : [],
      failures: failuresListed,
      metrics,
    }, null, 2) + '\n');
  }

  return { failures: failuresListed, metrics, scanned };
}

const invokedDirect = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (invokedDirect) {
  const outFlag = process.argv.indexOf('--out');
  const outReceipt = outFlag !== -1 ? process.argv[outFlag + 1] : null;
  const quiet = process.argv.includes('-q');
  const result = run({ out: quiet ? null : console, outReceipt });
  process.exit(result.failures.length ? 1 : 0);
}
