/**
 * A3 hex sweep (FAP-43) — mechanical legacy→law remapping on the PUBLIC surface only.
 * tokens.js is exempt (it is the source defining the alias values).
 * Brand glyph files are exempt (Google logo multicolor is a brand asset, not UI).
 * Prints per-file/per-value counts; --apply performs edits, default is a dry run.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SRC = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..', 'src');
const APPLY = process.argv.includes('--apply');

const PUBLIC_FILES = [
  'App.jsx',
  'data/landingCategories.js',
  'index.css',
  'lib/PageNotFound.jsx',
  'components/AuthLayout.jsx',
  'components/UserNotRegisteredError.jsx',
  'components/VisionaryLogo.jsx',
  'components/ProtectedRoute.jsx',
  'components/landing/AboutUsHero.jsx',
  'components/landing/Breadcrumb.jsx',
  'components/landing/HeroFanCards.jsx',
  'components/landing/LandingFAQ.jsx',
  'components/landing/LandingFooter.jsx',
  'components/landing/PolicyTabs.jsx',
  'components/landing/ValuesStrip.jsx',
  'components/landing/persona/PersonaSections.jsx',
  'components/landing/persona/PremiumPersonaSections.jsx',
  'components/landing/system/ui.jsx',
  'components/auth/AuthUI.jsx',
  'components/auth/EmailVerification.jsx',
  'components/auth/LanguageSelector.jsx',
  'components/auth/BillingAuthNotice.jsx',
  'pages/Login.jsx',
  'pages/Register.jsx',
  'pages/ForgotPassword.jsx',
  'pages/ForgotUserId.jsx',
  'pages/ResetPassword.jsx',
  'styles/public-bridge.css',
  'styles/public-system.css',
  'styles/rhythm.css',
  'styles/feedback.css',
  'styles/apple-typography.css',
];

// all pages/landing/*.jsx
import { readdirSync, statSync } from 'node:fs';
const landing = readdirSync(path.join(SRC, 'pages', 'landing')).filter(f => f.endsWith('.jsx'));
for (const f of landing) PUBLIC_FILES.push(`pages/landing/${f}`);

/* value → law (case-insensitive hex literals; keep alpha suffix) */
const HEX_MAP = [
  [/4285F4/gi, '0066cc'],   // Google blue 500 → law link/interaction blue
  [/3367d6/gi, '0071e3'],   // Google blue 700 (hover) → law commerce hover
  [/0b57d0/gi, '0066cc'],   // Google deep blue → law link blue
  [/5f6368/gi, '6e6e73'],   // Google grey 700 → graphite
  [/9AA0A6/gi, '86868b'],   // Google grey 400 → muted
  [/dadce0/gi, 'd2d2d7'],   // Google grey 300 → line
  [/f8f9fa/gi, 'f5f5f7'],   // Common ground
  [/f1f3f4/gi, 'f5f5f7'],   // Strictly forbidden (track wash)
  [/202124/gi, '1d1d1f'],   // Google ink → ink
  [/121317/gi, '1d1d1f'],   // legacy graphite ink → ink
  [/2c2d31/gi, '272729'],   // legacy ink hover → law ink hover
  [/3c4043/gi, '1d1d1f'],   // Google grey 800 → ink
  [/EA4335/gi, 'e30000'],   // Google red → Apple web red
  [/34A853/gi, '34c759'],   // Google green → Apple system green
  [/FBBC04/gi, 'ff9500'],   // Google yellow → Apple orange
  [/e8f0fe/gi, 'rgba(0,102,204,0.10)'], // blue tint wash → law wash (chip/border context)
  [/e8f0fd/gi, 'rgba(0,102,204,0.10)'],
  [/e6f4ea/gi, 'rgba(52,199,89,0.12)'], // green tint wash → law green wash
  [/rgba\(66,\s?133,\s?244/gi, 'rgba(0,102,204'],
  [/8ab4f8/gi, '2997ff'],   // light google blue → dark-scene reserved blue
  [/174ea6/gi, '0066cc'],   // Google blue 900 (chip text) → law link blue
  [/D2E3FC/gi, 'rgba(0,102,204,0.10)'], // Google blue 100 (chips/selection) → law wash
  [/1a73e8/gi, '0066cc'],   // Google blue 600 → law link blue
];

const counts = {};
for (const rel of PUBLIC_FILES) {
  const abs = path.join(SRC, rel);
  let text;
  try { text = readFileSync(abs, 'utf8'); } catch { continue; }
  let out = text, fileHits = 0;
  for (const [re, to] of HEX_MAP) {
    const m = out.match(re);
    if (m) {
      counts[rel] = counts[rel] || {};
      counts[rel][m[0] + ' -> ' + to] = (counts[rel][m[0] + ' -> ' + to] || 0) + m.length;
      fileHits += m.length;
      out = out.replace(re, to);
    }
  }
  if (APPLY && fileHits > 0) writeFileSync(abs, out);
  if (fileHits > 0) counts[rel]['__total'] = fileHits + 0;
}

let total = 0;
for (const [rel, vals] of Object.entries(counts)) {
  total += Number(vals.__total);
  console.log(rel, JSON.stringify(vals.__total) + ' hits');
  if (!APPLY) for (const k of Object.keys(vals)) if (k !== '__total') console.log('   ' + k + ' x' + vals[k]);
}
console.log(APPLY ? `APPLIED: ${total} replacements` : `DRY RUN: ${total} total hits across ${Object.keys(counts).length} files`);
