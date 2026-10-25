#!/usr/bin/env node
/* ──────────────────────────────────────────────────────────────────────────
 * D2/FAP tap-target + label law check — static, dependency-free.
 *
 * Laws (public + onboarding surfaces):
 *   1. Tap-target law: every interactive-looking element (button, anchor/Link
 *      with href or to, role=button/switch/tab/link, submit inputs) declared
 *      on the public surfaces must carry a ≥44px box:
 *      - a height/min-height token resolving to ≥44px (h-11+, min-h-11+),
 *      - or box paddings that reasonably reach 44px are NOT assumed — the
 *        token itself must state ≥44. Any h-/min-h-/size-/h-[px] under 44 on
 *        an interactive element FAILS.
 *      Decorative content (aria-hidden, pointer-events-none) inside larger
 *      controls is exempt — the law is on the control, and only control tags
 *      are inspected.
 *   2. Label law: onboarding-related surfaces must not set type below 12px
 *      (text-[10px]/text-[11px], font-size 0.625rem/0.6875rem, 10px/11px).
 *
 * Exceptions: the register below records every measured/verified exception
 * with its reason (Apple boats the same pattern: measured 24/36/38px tiers on
 * apple.com ARE shipped for secondary controls — Visionary keeps 44 for
 * primary controls; exceptions must be duplicated-capability or
 * precision-media controls, never primary CTAs/nav).
 *
 * Exit 0 when the laws hold. `--out <file>` writes a JSON receipt.
 * QA_TAPS_QUIET=1 suppresses the console summary (tests).
 * ────────────────────────────────────────────────────────────────────────── */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const frontendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC_ROOT = path.join(frontendRoot, 'src');

/* Public-path roots: every landing source plus the shared ui primitives. */
const PUBLIC_DIRS = [
  path.join(SRC_ROOT, 'pages', 'landing'),
  path.join(SRC_ROOT, 'components', 'landing'),
  path.join(SRC_ROOT, 'components', 'ui'),
];
/* Sheets carrying public interactive controls (tap law scope). */
const PUBLIC_SHEETS = [
  'src/index.css',
  'src/styles/public-system.css',
  'src/styles/premium.css',
  'src/components/landing/cast.css',
];
/* Sheets carrying onboarding interface classes (label law scope). */
const LABEL_SHEETS = [...PUBLIC_SHEETS, 'src/styles/workspace-design.css'];

/* Onboarding-relevant sources (file-name matched; label law scope). */
const ONBOARDING_HINT = /(?:onboarding|decisionhome|setup)/i;
/* Onboarding-class hint for stylesheet selectors. */
const ONBOARDING_CLASS_HINT = /(?:onboarding|decisionhome|setup|v-home-local)/i;

/* Measured/verified exceptions: precision-media or duplicated-capability
   controls recorded with reason. Static law only flags sites NOT in here. */
const EXCEPTIONS = [
  {
    file: 'src/components/ui/carousel.jsx',
    line: 155,
    reason: 'shadcn embla paddle — zero imports across src (unused primitive); must be converted to >=44px if this primitive is ever consumed by a public surface',
  },
  {
    file: 'src/components/ui/carousel.jsx',
    line: 176,
    reason: 'shadcn embla paddle — zero imports across src (unused primitive); must be converted to >=44px if this primitive is ever consumed by a public surface',
  },
  {
    file: 'src/components/ui/sidebar.jsx',
    line: 223,
    reason: 'SidebarTrigger — no external consumers in src (dashboard topbars render their own controls); conversion belongs to the dashboard polish epic (FAP Epic D)',
  },
];

function* walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else yield full;
  }
}

const rel = (file) => path.relative(frontendRoot, file).split(path.sep).join('/');

function lineAt(text, index) {
  return text.slice(0, index).split(/\r?\n/).length;
}

/* Height token → px. Tailwind spacing scale: 1 unit = 4px (h-11 => 44). */
const HEIGHT_PX = {
  1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 7: 28, 8: 32, 9: 36, 10: 40, 11: 44, 12: 48,
};
const HEIGHT_BAD_TOKEN = /\b(?:h|min-h|size)-(1|2|3|4|5|6|7|8|9|10)\b/;
const ARBITRARY_HEIGHT_BAD = /\b(?:h|min-h|size)-\[([0-9.]+)(px|rem)\]/g;
const ARBITRARY_PX = (value, unit) => (unit === 'rem' ? Number(value) * 16 : Number(value));

/* After-pseudo hit unions: `after:absolute after:-inset-y-*` / `after:-inset-x-*`
   extend the primary hit box (pointer events land on the pseudo elements too),
   so the law accounts the hit UNION — declared box plus pseudo expansion — and
   requires ≥44px on both axes. Dot rows use this pattern: the visual pill stays
   Apple-small while its touch target is full size, provided the union reaches
   44x44. Width absent from the class list falls back to the 8px pill floor
   (dot strips size the active pill via inline style). */
const HEIGHT_TOKEN_ALL = /\b(?:h|min-h|size)-(?:(1|2|3|4|5|6|7|8|9|10|11|12)\b|\[([0-9.]+)(px|rem)\])/g;
const WIDTH_TOKEN_ALL = /\bw-(?:(1|2|3|4|5|6|7|8|9|10|11|12)\b|\[([0-9.]+)(px|rem)\])/g;
const AFTER_INSET = {
  y: /after:-inset-y-(?:\[([0-9.]+)(px|rem)\]|([0-9]+)\b)/,
  x: /after:-inset-x-(?:\[([0-9.]+)(px|rem)\]|([0-9]+)\b)/,
};
function hitInsetPx(tag, axis) {
  const m = tag.match(AFTER_INSET[axis]);
  if (!m) return 0;
  return m[3] ? Number(m[3]) * 4 : ARBITRARY_PX(m[1], m[2]);
}
function computeHitUnion(tag) {
  const heightTokens = [...tag.matchAll(HEIGHT_TOKEN_ALL)].map((m) => (m[1] ? HEIGHT_PX[m[1]] : ARBITRARY_PX(m[2], m[3])));
  const widthTokens = [...tag.matchAll(WIDTH_TOKEN_ALL)].map((m) => (m[1] ? HEIGHT_PX[m[1]] : ARBITRARY_PX(m[2], m[3])));
  const baseH = heightTokens.length ? Math.min(...heightTokens) : 44;
  const baseW = widthTokens.length ? Math.min(...widthTokens) : 8;
  const effH = baseH + 2 * hitInsetPx(tag, 'y');
  const effW = baseW + 2 * hitInsetPx(tag, 'x');
  return { h: Math.round(effH), w: Math.round(effW), compliant: effH >= 44 && effW >= 44 };
}

/* Split one JSX opening tag. Segment stack keeps JSX braces, template text,
   ${…} interpolation code and strings separate so a '>' only terminates the
   tag when every nested template/interpolation has closed. */
function tagEndIndex(text, start) {
  const stack = [{ mode: 'CODE', depth: 0, interp: false }];
  let stringChar = null;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    const top = stack[stack.length - 1];
    if (top.mode === 'STRING') {
      if (ch === '\\') { i++; continue; }
      if (ch === stringChar) top.mode = 'CODE';
      continue;
    }
    if (top.mode === 'TEMPLATE') {
      if (ch === '$' && text[i + 1] === '{') { i++; stack.push({ mode: 'CODE', depth: 0, interp: true }); continue; }
      if (ch === '`') stack.pop();
      continue;
    }
    /* CODE */
    if (ch === '"' || ch === "'") { top.mode = 'STRING'; stringChar = ch; continue; }
    if (ch === '\\') { i++; continue; }
    if (ch === '`') { stack.push({ mode: 'TEMPLATE', depth: 0, interp: false }); continue; }
    if (ch === '{' || ch === '(' || ch === '[') { top.depth++; continue; }
    if (ch === '}' || ch === ')' || ch === ']') {
      if (top.depth === 0 && top.interp) { stack.pop(); continue; } /* closing } of a ${…} */
      top.depth = Math.max(0, top.depth - 1);
      continue;
    }
    if (ch === '>' && stack.length === 1 && stack[0].depth === 0) return i;
  }
  return -1;
}

/* Does this opening tag declare an interactive control on a public surface? */
const INTERACTIVE_TAG = /\b(?:button|Link|Button)\b|<\ba\b(?![\w-])/;
const ROLE_RE = /role\s*=\s*["'](?:button|switch|tab|link)["']/;
const INTERACTIVE_INPUT = /<input\b[\s\S]{0,200}?type\s*=\s*["'](?:submit|button|image)["']/;
function isInteractiveTag(tag) {
  const hasRole = ROLE_RE.test(tag);
  const hasHref = /(?:href|to)\s*[=:]/.test(tag);
  if (/^<a\b/.test(tag)) return hasHref;           // anchors need href/target
  if (/^<input\b/.test(tag)) return INTERACTIVE_INPUT.test(tag);
  if (hasRole) return true;
  if (/\b(?:onClick|onSubmit)\s*[=]/.test(tag) && INTERACTIVE_TAG.test(tag)) return true;
  return INTERACTIVE_TAG.test(tag) && hasHref === true || /^<(?:button|Link|Button)\b/.test(tag);
}

function carveTags(text) {
  const tags = [];
  const tagOpen = /<(?:a|button|input|div|span|Link|Button)\b/g;
  let m;
  while ((m = tagOpen.exec(text))) {
    const end = tagEndIndex(text, m.index);
    if (end < 0) continue;
    tags.push({ tag: text.slice(m.index, end + 1), index: m.index, end });
    tagOpen.lastIndex = end; /* resume after the tag (skip over it) */
  }
  return tags;
}

function run({ out = console, outReceipt = null } = {}) {
  const failures = [];
  const push = (law, detail) => failures.push({ law, detail });
  const metrics = { scannedFiles: 0, components: 0, tags: 0, interactive: 0, violations: 0, labelViolations: 0, compliantUnions: 0, registeredExceptions: EXCEPTIONS.length };

  const files = [
    ...[...walk(SRC_ROOT)].filter((f) => PUBLIC_DIRS.some((d) => f.startsWith(d) && /\.jsx?$/i.test(f))),
  ];

  for (const file of files) {
    metrics.scannedFiles++;
    const text = fs.readFileSync(file, 'utf8');
    const label = rel(file);

    for (const { tag, index } of carveTags(text)) {
      metrics.tags++;
      if (!isInteractiveTag(tag)) continue;
      metrics.interactive++;

      /* Decorative controls: pointer-events disabled or fully hidden from AT
         are presentation surfaces (wrapped by a real control elsewhere). */
      if (/pointer-events-none/.test(tag) || /aria-hidden\s*=\s*["']true["']/.test(tag)) continue;

      const hToken = tag.match(HEIGHT_BAD_TOKEN);
      let badToken = hToken ? HEIGHT_PX[Number(hToken[1])] < 44 ? hToken[0] : null : null;
      if (!badToken) {
        let am;
        ARBITRARY_HEIGHT_BAD.lastIndex = 0;
        while ((am = ARBITRARY_HEIGHT_BAD.exec(tag))) {
          const px = ARBITRARY_PX(am[1], am[2]);
          if (px < 44) { badToken = `${am[0]} (${px}px)`; break; }
        }
      }
      if (badToken) {
        const union = computeHitUnion(tag);
        if (union.compliant) {
          metrics.compliantUnions++;
          continue;
        }
        const line = lineAt(text, index);
        const exempt = EXCEPTIONS.some((e) => e.file === label && e.line === line);
        if (!exempt) {
          metrics.violations++;
          push('tap-target-law', `${label}:${line} interactive control carries ${badToken} (hit union ${union.w}x${union.h}px <44) — ${tag.slice(0, 120).replace(/\s+/g, ' ')}`);
        }
      }
    }
  }

  /* Onboarding JSX sources: file-name matched across all pages/components,
     independent of the public scope (label law covers dashboard onboarding
     surfaces such as DecisionHome too). */
  const labelDirs = [
    path.join(SRC_ROOT, 'pages'),
    path.join(SRC_ROOT, 'components'),
  ];
  const onboardingFiles = [...walk(SRC_ROOT)].filter(
    (f) => labelDirs.some((d) => f.startsWith(d)) && /\.jsx?$/i.test(f) && ONBOARDING_HINT.test(path.basename(f))
  );
  metrics.components = onboardingFiles.length;
  for (const file of onboardingFiles) {
    const text = fs.readFileSync(file, 'utf8');
    const label = rel(file);
    const badFont = text.match(/(?:text-\[1[01]px\]|font-size:\s*(?:0\.(?:5|6)[0-9.]*rem|1[01]px)|text-\[0\.(?:5|6)[0-9]*rem\])/g) || [];
    if (badFont.length) {
      metrics.labelViolations++;
      push('label-law', `${label}: declares type below 12px on an onboarding surface (${badFont.slice(0, 3).join(', ')})`);
    }
  }

  /* Public sheets: tap law on interactive control selectors. */
  for (const sheetRel of PUBLIC_SHEETS) {
    const file = path.join(frontendRoot, sheetRel);
    if (!fs.existsSync(file)) continue;
    const text = fs.readFileSync(file, 'utf8');
    const rules = text.split('}');
    let cursor = 0;
    for (const rule of rules) {
      const at = cursor;
      cursor += rule.length + 1;
      const header = rule.slice(0, rule.indexOf('{'));
      const body = rule.slice(rule.indexOf('{') + 1);
      if (!header || !body) continue;
      const isInteractiveSheet = /(?:btn|button|action|switch|toggle|control|nav-link|link|pill|chip|dot)/i.test(header);
      if (isInteractiveSheet) {
        const min = body.match(/min-height:\s*(\d+(?:\.\d+)?)px/);
        const height = body.match(/(?:^|\s|;)height:\s*(\d+(?:\.\d+)?)px/);
        const px = min ? Number(min[1]) : height ? Number(height[1]) : null;
        if (px !== null && px < 44) {
          const line = lineAt(text, at);
          push('tap-target-law', `${sheetRel}:${line} interactive sheet class "${header.trim().replace(/\s+/g, ' ')}" resolves to ${px}px (<44px)`);
          metrics.violations++;
        }
      }
    }
  }

  /* Label-law sheets: onboarding classes must not set type below 12px. */
  for (const sheetRel of LABEL_SHEETS) {
    const file = path.join(frontendRoot, sheetRel);
    if (!fs.existsSync(file)) continue;
    const text = fs.readFileSync(file, 'utf8');
    const rules = text.split('}');
    let cursor = 0;
    for (const rule of rules) {
      const at = cursor;
      cursor += rule.length + 1;
      const header = rule.slice(0, rule.indexOf('{'));
      const body = rule.slice(rule.indexOf('{') + 1);
      if (!header || !body) continue;
      const badFont = body.match(/font-size:\s*(?:0\.(?:5|6)[0-9.]*rem|1[01]px)/);
      if (badFont && ONBOARDING_CLASS_HINT.test(header)) {
        const line = lineAt(text, at);
        push('label-law', `${sheetRel}:${line} onboarding class "${header.trim().slice(0, 60)}" sets ${badFont[0]} (below 12px)`);
        metrics.labelViolations++;
      }
    }
  }

  if (outReceipt) {
    fs.mkdirSync(path.dirname(outReceipt), { recursive: true });
    fs.writeFileSync(outReceipt, JSON.stringify({ generatedAt: new Date().toISOString(), lawVersion: 'D2-2026-10-24', metrics, failures }, null, 2) + '\n');
  }

  if (failures.length) {
    if (!process.env.QA_TAPS_QUIET) {
      out.error(`qa:taps — ${failures.length} tap/label failure(s)`);
      for (const f of failures) out.error(`  [${f.law}] ${f.detail}`);
      out.error('Law: interactive controls ≥44px on public surfaces; onboarding labels ≥12px; exceptions only via the measured register in scripts/qa-taps.mjs.');
    }
    return 1;
  }
  if (!process.env.QA_TAPS_QUIET) {
    out.log(`qa:taps — tap law holds (${metrics.interactive} interactive controls in ${metrics.scannedFiles} files; ${metrics.compliantUnions} pseudo hit-unions ≥44; exceptions: ${EXCEPTIONS.length})`);
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
export { computeHitUnion, carveTags, isInteractiveTag, tagEndIndex, hitInsetPx };
