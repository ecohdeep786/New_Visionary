#!/usr/bin/env node
/* ──────────────────────────────────────────────────────────────────────────
 * D1/FAP motion law check — static, dependency-free.
 *
 * Scope: every product-motion declaration site in source — all src CSS sheets,
 * src JS/JSX motion strings (inline styles, <style> blocks, template literals,
 * reduced-motion conditional guards), curve constants, and tailwind.config.js
 * (which generates the utility classes the codebase carries). Build output is
 * not scanned: the source is the contract.
 *
 *   1. Curve law (D1): every transition/animation timing resolves on the one
 *      recorded product curve — var(--ease-out-apple) from tokens.css
 *      (cubic-bezier(0.16,1,0.3,1)) or its exact literal. Shorthand values
 *      that carry a duration but no timing signature FAIL (the CSS default
 *      `ease` sneaks in otherwise). A declared easing keyword (ease-in,
 *      ease-out, ease-in-out, step-*) or any other cubic-bezier FAILS.
 *   2. Self-running exception: `linear` is legal only inside animation values
 *      that also declare `infinite` (spinner, marquee, progress loops).
 *      `ease-linear` Tailwind classes are exempt under the same exception
 *      (pointer-driven drags).
 *   3. Bounce law (D1 "no bounce"): any cubic-bezier whose output overshoots
 *      (y2 outside 0–1) or whose x1 leaves [0,1] FAILS wherever it is
 *      declared.
 *   4. Retired curves: --ease-spring (bounce spring) and --ease-google
 *      (duplicate resolve curve) may not be defined (`name:`) or referenced
 *      (var(name)) anywhere in source.
 *   5. Single token home: --ease-out-apple and each of the five duration-scale
 *      tokens are defined exactly once — in tokens.css. Re-definitions FAIL
 *      so the curve can never fork again the way the 0.22/0.16 families did.
 *   6. Tailwind law: tailwind.config.js must redirect every easing key
 *      (DEFAULT/linear/in/out/in-out — DEFAULT to the law curve) and the
 *      generated accordion animations must carry var(--ease-out-apple).
 *   7. Ease-class law: Tailwind `ease-in`/`ease-out`/`ease-in-out` utility
 *      names may not appear in class attributes (poison keys; use the bare
 *      transition utilities, which resolve to the law curve via config).
 *   8. Reduced-motion contract: the global kill block in index.css plus the
 *      per-sheet contracts in premium.css, workspace.css, workspace-design.css
 *      and cast.css must stay in place. Falling below this set FAILS.
 *
 * Reported-only metric: the duration histogram across motion values.
 *
 * Exit 0 when all laws hold; failures print as file:line and exit 1.
 * `--out <file>` writes a JSON receipt (directories auto-created); the env
 * var QA_MOTION_QUIET=1 suppresses the console summary (used by tests).
 * ────────────────────────────────────────────────────────────────────────── */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const frontendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC_ROOT = path.join(frontendRoot, 'src');
const TOKENS_HOME = 'src/styles/tokens.css';
const TAILWIND_CONFIG = path.join(frontendRoot, 'tailwind.config.js');
const MOTION_SRC_EXT = /\.(jsx?|css)$/;

export const LAW_CURVE_VAR = 'var(--ease-out-apple)';
export const LAW_CURVE_LITERAL = 'cubic-bezier(0.16, 1, 0.3, 1)';
const CLIENT_LAW_CURVE_VAR = 'var(--ease-out-apple)';
const CLIENT_LAW_CURVE_LITERAL = 'cubic-bezier(0.16,1,0.3,1)';

const CURVE_VAR_DEF_HINT = '--ease-out-apple:';
const SCALE_TOKENS = ['fast', 'base', 'slow', 'statement', 'cinematic'];

/* The sheets that must each keep a prefers-reduced-motion contract. */
const REDUCED_MOTION_CONTRACTS = [
  { file: 'src/index.css', mustKill: true },
  { file: 'src/styles/premium.css', mustKill: false },
  { file: 'src/components/dashboard/workspace.css', mustKill: false },
  { file: 'src/components/dashboard/workspace-design.css', mustKill: false },
  { file: 'src/components/landing/cast.css', mustKill: false },
];

/* Pure helpers (exercised by visionary-app/scripts/tests/motion-law.test.mjs). */

export function normalizeLiteral(raw) {
  return String(raw).replace(/\s+/g, '').toLowerCase();
}

/* Drop block comments *without removing length*: every comment character is
 * swapped for a space so extraction indices still map 1:1 onto the original
 * text (exact file:line reporting). */
export function stripBlockComments(text) {
  const body = String(text);
  const out = body.split('');
  let i = 0;
  while (i < out.length - 1) {
    if (out[i] === '/' && out[i + 1] === '*') {
      const close = body.indexOf('*/', i + 2);
      const end = close < 0 ? out.length : close + 2;
      for (let k = i; k < end && k < out.length; k++) out[k] = ' ';
      i = end;
    } else {
      i++;
    }
  }
  return out.join('');
}

/* Blank `//` line comments (length-preserving) unless they are clearly a URL
 * fragment (`://` and `//` inside a word) — string-prefixed template CSS
 * contains local URLs and must not be corrupted. */
export function stripLineComments(text) {
  const body = String(text);
  const out = body.split('');
  let quote = null;
  for (let i = 0; i < out.length - 1; i++) {
    const ch = out[i];
    if (ch === '\n') { quote = null; continue; }
    if (quote) { if (ch === quote) quote = null; continue; }
    if (ch === '"' || ch === "'" || ch === '`') { quote = ch; continue; }
    if (ch === '/' && out[i + 1] === '/' && (i === 0 || out[i - 1] !== ':')) {
      let j = i;
      while (j < out.length && out[j] !== '\n') { out[j] = ' '; j++; }
      i = j;
    }
  }
  return out.join('');
}

const DURATION_HINT = /\b\d*\.?\d+(ms|s)\b/;

/* Verdict for ONE comma-separated motion-value segment.
 * Returns { status: 'pass' | 'fail' | 'skip', kind?, timing? }.
 * fail kinds: banned-curve (easing keyword or foreign bezier),
 * non-law-curve-var (a var() token that is not the law curve),
 * linear-without-infinite, missing-curve (duration with no timing). */
export function timingSignal(segment) {
  const raw = String(segment);
  const norm = normalizeLiteral(raw);
  if (!norm) return { status: 'skip' };
  const hasDuration = DURATION_HINT.test(norm);
  const hasInfinite = /\binfinite\b/.test(raw);
  /* Easing keywords are matched case-SENSITIVELY on the raw text with word
   * boundaries and never INSIDE a variable name — `var(--ease-out-apple)`
   * must not read as the `ease` keyword (lookbehind excludes hyphen-led
   * occurrences, which is precisely variable-name position). */
  const keywords = raw.match(/(?<!-)\bease(?:-in(?:-out)?)?\b|(?<!-)\blinear\b|\bsteps\([^()]*\)|(?<!-)\bstep-(?:start|end)\b/g) || [];
  const bezierVars = norm.match(/cubic-bezier\([^()]*\)|var\(--[a-z0-9-]+\)/g) || [];

  if (keywords.includes('linear')) {
    return hasInfinite
      ? { status: 'pass', timing: 'linear' }
      : { status: 'fail', kind: 'linear-without-infinite', timing: 'linear' };
  }
  const keyword = keywords.find(k => k !== 'linear');
  if (keyword) return { status: 'fail', kind: 'banned-curve', timing: keyword };
  if (bezierVars.includes(CLIENT_LAW_CURVE_VAR)) return { status: 'pass', timing: CLIENT_LAW_CURVE_VAR };
  const canon = bezierVars.find(t => t === CLIENT_LAW_CURVE_LITERAL);
  if (canon) return { status: 'pass', timing: canon };
  if (bezierVars.length) {
    return {
      status: 'fail',
      kind: bezierVars[0].startsWith('cubic-bezier(') ? 'banned-curve' : 'non-law-curve-var',
      timing: bezierVars[0],
    };
  }
  if (!hasDuration) return { status: 'skip' };
  return { status: 'fail', kind: 'missing-curve', timing: null };
}

/* Per-segment verdicts for one motion declaration value. Splits on
 * top-level commas only — cubic-bezier(0.16, 1, 0.3, 1) holds commas of its
 * own and must stay one segment. */
function splitTopLevel(value) {
  const parts = [];
  let depth = 0;
  let current = '';
  for (const ch of String(value)) {
    if (ch === '(') depth++;
    if (ch === ')') depth = Math.max(0, depth - 1);
    if (ch === ',' && depth === 0) {
      parts.push(current);
      current = '';
      continue;
    }
    current += ch;
  }
  parts.push(current);
  return parts;
}

export function motionValueVerdicts(value) {
  const verdicts = [];
  const segments = splitTopLevel(stripBlockComments(String(value)))
    .map(seg => seg.trim())
    .filter(Boolean);
  for (const segment of segments) {
    if (/^(none|unset|initial)/.test(segment.toLowerCase()) && !/\d/.test(segment)) continue;
    if (!/\d/.test(segment) && !/(cubic-bezier|var\(|ease|linear|steps|step-)/.test(segment)) continue;
    const signal = timingSignal(segment);
    if (signal.status === 'fail') {
      verdicts.push({ kind: signal.kind, timing: signal.timing, segment });
    }
  }
  return verdicts;
}

/* Analytic bounce check on any cubic-bezier inside a value. Bounce/elastic
 * motion is manufactured by control-point y values outside the [0,1] output
 * range — on EITHER side (the old 0.22,1.4 spring overshoots at y1). x
 * control points must also stay inside [0,1] (CSS-invalid otherwise). */
export function bounceViolations(value) {
  const hits = [];
  const re = /cubic-bezier\s*\(\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*\)/g;
  for (const [, x1, y1, x2, y2] of String(value).matchAll(re)) {
    const shape = `cubic-bezier(${x1},${y1},${x2},${y2})`;
    for (const raw of [x1, x2]) {
      const n = Number(raw);
      if (n < 0 || n > 1) hits.push({ kind: 'invalid-curve-x-bound', value: shape });
    }
    for (const raw of [y1, y2]) {
      const n = Number(raw);
      if (n > 1 || n < 0) hits.push({ kind: 'banned-bounce-curve', value: shape });
    }
  }
  return hits;
}

/* CSS: pull every motion declaration value (comments pre-stripped). */
export function cssMotionValues(text) {
  const stripped = stripBlockComments(text);
  const out = [];
  const re = /\b(transition|transition-property|transition-timing-function|animation|animation-name|animation-timing-function)\s*:\s*([^;{}]+)[;}]/g;
  let m;
  while ((m = re.exec(stripped))) out.push({ name: m[1], value: m[2], index: m.index });
  return out;
}

/* JS/JSX motion sites. Comments are stripped first so prose never trips the
 * scanner. Extraction covers: keyed declaration strings, the reduced-motion
 * conditional guard (`name: reduced ? "none" : "<value>"` — judge the
 * fallback branch, the one that animates), named curve constants, Tailwind
 * arbitrary animations, and un-quoted inline CSS (template <style> blocks). */
export function jsMotionValues(text) {
  const out = [];
  const stripped = stripLineComments(stripBlockComments(text));

  const keyed = /\b(transition|transitionProperty|animation|animationName|WebkitAnimation)\s*:\s*(["'`])((?:(?!\2).)*)\2/g;
  let m;
  while ((m = keyed.exec(stripped))) out.push({ name: m[1], value: m[3], index: m.index });

  const conditional = /\b(transition|transitionProperty|animation|animationName)\s*:\s*[^"'`{}()]*\?\s*(["'`])((?:(?!\2).)*)\2\s*:\s*(["'`])((?:(?!\4).)*)\4/g;
  while ((m = conditional.exec(stripped))) {
    out.push({ name: m[1], value: m[5], index: m.index, kind: 'conditional-fallback' });
  }

  const constant = /\b([A-Z][A-Z0-9_]{2,}(?:_EASE|_CURVE))\s*=\s*(["'`])((?:(?!\2).)*)\2/g;
  while ((m = constant.exec(stripped))) {
    out.push({ name: m[1], value: m[3], index: m.index, kind: 'constant' });
  }

  const arbitrary = /animate-\[((?:(?!\]).)*)\]/g;
  while ((m = arbitrary.exec(stripped))) {
    out.push({ name: 'animate-[]', value: m[1].replace(/_/g, ' '), index: m.index, kind: 'tailwind-arbitrary' });
  }

  const inlineCss = /\b(transition|transition-property|animation|animation-name|animation-timing-function)\s*:\s*([^;"'`{}\n\r]+)[;\n\r}]/g;
  while ((m = inlineCss.exec(stripped))) {
    out.push({ name: m[1], value: m[2], index: m.index, kind: 'inline-css' });
  }
  return out;
}

/* Class attributes carrying banned ease utilities. `ease-linear` is exempt
   (direct-manipulation drags and future self-running indicator classes). */
const CLASS_ATTR_HINT = 'class';
/* Brace-optional: catches className="…" AND className={`…`} templates (the
   template body — inner quotes included — is one class payload). */
const CLASS_ATTR_RE = /\bclass[A-Za-z]*\s*=\s*\{?\s*(?:"((?:\\.|[^"\\])*)"|'((?:\\.|[^'\\])*)'|`((?:\\.|[^`\\])*)`)/g;
const EASE_CLASS_RE = /(?<![-a-z])ease-(in|out|in-out|spring|google)(?![a-z-])/;

export function easeClassViolations(text) {
  const hits = [];
  let m;
  CLASS_ATTR_RE.lastIndex = 0;
  while ((m = CLASS_ATTR_RE.exec(text))) {
    const value = m[1] ?? m[2] ?? m[3] ?? '';
    if (EASE_CLASS_RE.test(value)) {
      hits.push({ index: m.index, ease: value.match(EASE_CLASS_RE)[1] });
    }
  }
  void CLASS_ATTR_HINT;
  return hits;
}

function lineAt(text, index) {
  return text.slice(0, index).split(/\r?\n/).length;
}

function* walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else yield full;
  }
}

const rel = (file) => path.relative(frontendRoot, file).split(path.sep).join('/');

function countCurvesIn(fileRel) {
  const file = path.join(frontendRoot, fileRel);
  if (!fs.existsSync(file)) return { curveDefs: 0, scaleDefs: {} };
  const text = fs.readFileSync(file, 'utf8');
  const scaleDefs = {};
  for (const token of SCALE_TOKENS) {
    const hits = text.split(`--motion-duration-${token}:`).length - 1;
    scaleDefs[token] = hits;
  }
  return { curveDefs: text.split(CURVE_VAR_DEF_HINT).length - 1, scaleDefs };
}

function run({ out = console, outReceipt = null } = {}) {
  const failures = [];
  const pushFailure = (law, detail) => failures.push({ law, detail });
  const metrics = { scanned: 0, curveFails: 0, bounceFails: 0, easeClassFails: 0, durations: {} };
  const noteDuration = (value) => {
    for (const token of String(value).match(/\b\d*\.?\d+ms\b|\b\d*\.?\d+s\b/g) || []) {
      metrics.durations[token] = (metrics.durations[token] || 0) + 1;
    }
  };

  const files = [...walk(SRC_ROOT)].filter(f => MOTION_SRC_EXT.test(f));
  if (fs.existsSync(TAILWIND_CONFIG)) files.push(TAILWIND_CONFIG);

  const tokensHomeText = fs.existsSync(path.join(frontendRoot, TOKENS_HOME))
    ? fs.readFileSync(path.join(frontendRoot, TOKENS_HOME), 'utf8')
    : '';
  if (!tokensHomeText) pushFailure('single-token-home', `${TOKENS_HOME} is missing — the motion token home file must exist`);

  for (const file of files) {
    metrics.scanned++;
    const text = fs.readFileSync(file, 'utf8');
    const label = rel(file);
    const isCss = file.endsWith('.css');
    const values = isCss ? cssMotionValues(text) : jsMotionValues(text);

    /* Law 4 — retired curve variables (definitions or references). */
    const usesRetired = /--ease-(?:spring|google)\s*:/.test(text) || /var\(\s*--ease-(?:spring|google)\b/.test(text);
    if (usesRetired) {
      pushFailure('retired-curve-var', `${label} defines or references the retired --ease-spring / --ease-google curve`);
    }

    /* Law 1/2/3 — curve law per motion value + analytic bounce check. */
    for (const { name, value, index, kind } of values) {
      noteDuration(value);
      if (kind === 'constant') {
        const norm = normalizeLiteral(value);
        const ok = norm === 'var(--ease-out-apple)' || norm === 'cubic-bezier(0.16,1,0.3,1)';
        if (!ok) {
          metrics.curveFails++;
          pushFailure('curve-law', `${label}:${lineAt(text, index)} ${name} constant does not hold the law curve (${value})`);
        }
        continue;
      }
      for (const v of motionValueVerdicts(value)) {
        metrics.curveFails++;
        pushFailure('curve-law', `${label}:${lineAt(text, index)} ${name}: ${v.kind}${v.timing ? ` (${v.timing})` : ''}`);
      }
      for (const v of bounceViolations(value)) {
        metrics.bounceFails++;
        pushFailure('no-bounce', `${label}:${lineAt(text, index)} ${name}: ${v.kind} — ${v.value}`);
      }
    }

    /* Law 7 — banned ease utility classes in class attributes. */
    for (const v of easeClassViolations(text)) {
      metrics.easeClassFails++;
      pushFailure('ease-class-law', `${label}:${lineAt(text, v.index)} carries the ease-${v.ease} utility class (use the bare transition utilities — config routes them to the law curve)`);
    }

    /* Law 5 — the curve and the scale live only in tokens.css. */
    if (label !== TOKENS_HOME) {
      if (text.includes(CURVE_VAR_DEF_HINT)) {
        pushFailure('single-token-home', `${label} re-defines --ease-out-apple (curve home is ${TOKENS_HOME})`);
      }
      for (const token of SCALE_TOKENS) {
        if (text.includes(`--motion-duration-${token}:`)) {
          pushFailure('single-token-home', `${label} re-defines --motion-duration-${token}`);
        }
      }
    }
  }

  /* Law 5 — tokens.css defines the curve once and every scale token once. */
  const home = countCurvesIn(TOKENS_HOME);
  if (home.curveDefs !== 1) {
    pushFailure('single-token-home', `${TOKENS_HOME} defines --ease-out-apple ${home.curveDefs}x (expected exactly 1)`);
  }
  for (const token of SCALE_TOKENS) {
    if (home.scaleDefs[token] !== 1) {
      pushFailure('single-token-home', `${TOKENS_HOME} defines --motion-duration-${token} ${home.scaleDefs[token]}x (expected exactly 1)`);
    }
  }

  /* Law 6 — tailwind configuration routes every easing key to the law. */
  if (fs.existsSync(TAILWIND_CONFIG)) {
    const cfg = fs.readFileSync(TAILWIND_CONFIG, 'utf8');
    const ttfWindow = cfg.slice(cfg.indexOf('transitionTimingFunction'), cfg.indexOf('transitionTimingFunction') + 700);
    if (!ttfWindow.includes("DEFAULT: 'var(--ease-out-apple)'") && !ttfWindow.includes('DEFAULT: "var(--ease-out-apple)"')) {
      pushFailure('tailwind-motion-law', 'tailwind.config.js: transitionTimingFunction.DEFAULT must resolve to var(--ease-out-apple)');
    }
    for (const key of ['linear', 'in', 'out', 'in-out']) {
      const keyDef = new RegExp(`["']?${key.replace('-', '\\-')}["']?\\s*:`).test(ttfWindow);
      if (!keyDef) {
        pushFailure('tailwind-motion-law', `tailwind.config.js: transitionTimingFunction.${key} redirect missing`);
      }
    }
    /* No foreign route can hide behind a named key: the whole override block
       must resolve curves through the law var only (past misuse: a `google`
       key carrying the retired 0.22-family bezier). */
    if (ttfWindow.includes('cubic-bezier(')) {
      pushFailure('tailwind-motion-law', 'tailwind.config.js: transitionTimingFunction block carries a raw cubic-bezier (route every key through var(--ease-out-apple))');
    }
    const accordion = cfg.match(/animation\s*:\s*\{([^}]*)\}/);
    if (!accordion || !accordion[1].includes(CLIENT_LAW_CURVE_VAR)) {
      pushFailure('tailwind-motion-law', 'tailwind.config.js: generated accordion animations must carry var(--ease-out-apple)');
    }
  }

  /* Law 8 — reduced-motion contracts stay present. */
  for (const contract of REDUCED_MOTION_CONTRACTS) {
    const file = path.join(frontendRoot, contract.file);
    if (!fs.existsSync(file)) {
      pushFailure('reduced-motion-contract', `${contract.file} is missing (reduced-motion contract sheet)`);
      continue;
    }
    const text = fs.readFileSync(file, 'utf8');
    const hasBlock = text.includes('prefers-reduced-motion');
    const hasKill = contract.mustKill ? text.includes('animation-duration:0.01ms') || text.includes('animation-duration: 0.01ms') : true;
    if (!hasBlock || !hasKill) {
      pushFailure('reduced-motion-contract', `${contract.file} lost its reduced-motion contract`);
    }
  }

  if (outReceipt) {
    fs.mkdirSync(path.dirname(outReceipt), { recursive: true });
    fs.writeFileSync(outReceipt, JSON.stringify({
      generatedAt: new Date().toISOString(),
      lawVersion: 'D1-2026-10-24',
      scannedFiles: metrics.scanned,
      curve: LAW_CURVE_LITERAL,
      durationScale: { fast: '180ms', base: '280ms', slow: '420ms', statement: '650ms', cinematic: '900ms' },
      failures,
      durationHistogram: metrics.durations,
    }, null, 2) + '\n');
  }

  if (failures.length) {
    if (!process.env.QA_MOTION_QUIET) {
      out.error(`qa:motion — ${failures.length} motion-law failure(s)`);
      for (const f of failures) out.error(`  [${f.law}] ${f.detail}`);
      out.error('Measure: one curve (tokens.css --ease-out-apple), one duration scale, no bounce, reduced-motion static-and-visible.');
    }
    return 1;
  }
  if (!process.env.QA_MOTION_QUIET) {
    out.log(`qa:motion — motion law holds (${metrics.scanned} motion-bearing source files scanned; durations: ${JSON.stringify(metrics.durations)})`);
  }
  return 0;
}

const invokedDirectly = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) {
  const outIndex = process.argv.indexOf('--out');
  const outReceipt = outIndex > -1 ? path.resolve(process.argv[outIndex + 1]) : null;
  process.exit(run({ out: console, outReceipt }));
}

export default run;
