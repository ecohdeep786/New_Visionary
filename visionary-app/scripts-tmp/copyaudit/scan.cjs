const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const DIRS = ['src/pages', 'src/components/landing', 'src/components/dashboard', 'src/data', 'src/domain', 'src/services'];

function walk(d, out) {
  if (!fs.existsSync(d)) return;
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(jsx|js|ts|tsx)$/.test(e.name)) out.push(p);
  }
}

const files = [];
DIRS.forEach((d) => walk(path.join(ROOT, d), files));

const results = [];

const WS = /\s+/g;
function words(s) {
  return s.trim().split(WS).filter((w) => /[A-Za-z]/.test(w));
}

// ---- prose filter -------------------------------------------------------
function notProse(s) {
  if (!s || !/[a-zA-Z]{3,}/.test(s)) return true;
  const w = words(s);
  if (w.length === 0) return true;
  if (w.length === 1 && !/[A-Z]/.test(s) && !/[.!?]/.test(s)) return true; // single lowercase word -> not prose
  // must start with a letter or quote-word (catches ", problem:" fragment captures)
  if (!/^[A-Za-z]/.test(s)) return true;
  // code fragments
  if (/[=;{}<>`]|=>|\$\{|className|style=|http|www\.|\.(jsx?|tsx?|webp|png|jpe?g|svg|css|js)\b/.test(s)) return true;
  if (/^[a-z0-9][a-zA-Z0-9._/-]*$/.test(s)) return true; // single-token id/slug/path
  if (/^[#\d.,%:+-\/ ]+$/.test(s)) return true;
  if (/rgba?\(|hsl\(|px\b|vh\b|vw\b|clamp\(|#[0-9a-fA-F]{3,8}\b/.test(s)) return true;
  if (/^[A-Z][a-z]+[A-Z]/.test(s) && !/[.!?]/.test(s) && words(s).length === 1) return true; // camelCase identifier
  if (/^[a-z]+(-[a-z0-9]+)+$/.test(s)) return true; // kebab css
  if (/^[A-Z0-9_]+$/.test(s)) return true; // CONSTANT
  if (/^(import|export|from|require)/.test(s)) return true;
  if (/[\u0080-\uffff]/.test(s) && !/[a-zA-Z]{3,}[a-zA-Z ]{3,}/.test(s)) return true; // non-latin script only
  if (/@|'[^']*'\s*,|system-ui|sans-serif|font/i.test(s)) return true; // imports, font stacks
  if (/^[a-z0-9_-]+\/[a-z0-9_-]+/.test(s)) return true; // paths like /student, lucide/Icon, @/components/...
  // tailwind/design-system class strings: tokens like `v-muted mt-2`, `lg:px-8`, `h-[2px]` — no capitals, no sentence punctuation
  if (!/[A-Z.!?"]/.test(s) && /^[\w:\/()\[\].,%#&' -]+$/.test(s)) {
    const toks = s.split(' ');
    const clsTok = /^[a-z][a-z0-9]*(-[a-z0-9]+)*(:[a-z0-9()\[\].,%#-]+)?$/;
    const numeric = toks.filter((t) => /-\d|\d|:\[|\[[\d.]+\]|px\b|vh\b|vw\b|gap|flex|grid|col|row|mt|mb|ml|mr|py|px|pt|pb|w-|h-|text-|bg-|border|rounded/i.test(t)).length;
    if (toks.every((t) => clsTok.test(t)) && numeric >= Math.ceil(toks.length / 2)) return true;
  }
  if (/^from |^export |^React|^Node/.test(s)) return true;
  if (/\b(aria|role|tabindex|viewBox|strokeWidth|translate|scale|rotate|matrix|cubic-bezier|keyframes|animation|rgba)\b/.test(s)) return true;
  return false;
}

// ---- flag engine --------------------------------------------------------
const BUZZ = ['empower', 'empowering', 'empowers', 'seamless', 'seamlessly', 'unlock', 'unlocking', 'unlocks', 'leverage', 'leveraging', 'revolutionize', 'revolutionizing', 'revolutionary', 'unleash', 'supercharge', 'cutting-edge', 'cutting edge', 'next-gen', 'harness', 'harnessing', 'elevate', 'elevating', 'transformative', 'delve', 'delving', 'unravel', 'streamline', 'streamlining', 'synergy', 'synergies', 'paradigm', 'bespoke', 'tailored', 'effortless', 'innovative', 'game-changer', 'game changer', 'world-class', 'state-of-the-art', 'best-in-class', 'robust', 'scalable', 'holistic', 'utilization', 'utilizing', 'pedagogical', 'autonomous', 'immersive', 'unparalleled', 'reimagine', 'reimagined', 'reimagining', 'empowerment'];
const FILLER = ['in today\\S+ fast-paced world', 'unlock the power', 'at the end of the day', 'when it comes to', 'in order to', 'it should be noted', 'needless to say', 'take it to the next level', 'revolutionize the way', 'transform the way', 'in this fast-paced'];
const STOPW = /^(a|an|the|and|or|of|to|in|on|for|is|are|it|this|that|with|by|as|at|be|from|your|you|we|our|how|what|why|not|do|does|so|if|then|than|that|its|his|her|their|can|will|would|should|could|may|might|have|has|had)$/i;
const EM = String.fromCharCode(8212);

function flagsFor(role, str) {
  const out = [];
  const w = words(str);
  const n = w.length;
  const lw = str.toLowerCase();
  for (const b of BUZZ) {
    if (b.includes(' ') || b.includes('-')) {
      if (lw.includes(b)) { out.push('BUZZWORD(' + b + ')'); break; }
    } else if (new RegExp('\\b' + b + '\\b').test(lw)) { out.push('BUZZWORD(' + b + ')'); break; }
  }
  for (const f of FILLER) {
    if (new RegExp(f, 'i').test(str)) { out.push('FILLER_PHRASE'); break; }
  }
  const headingish = ['HEADLINE', 'SUBHEAD', 'BUTTON', 'LINK', 'LABEL'].includes(role);
  if (headingish && n >= 2) {
    const PROPER = new Set(['visionary', 'learn', 'build', 'ask', 'explore', 'children', 'child', 'connections', 'connection', 'people', 'person', 'insights', 'insight', 'profile', 'settings', 'home', 'guide', 'practice', 'plans', 'support', 'download', 'pricing', 'help', 'about', 'terms', 'privacy', 'android', 'ios', 'windows', 'mac', 'linux', 'dpdp', 'sync', 'encrypted', 'id', 'web', 'english', 'hindi', 'bengali', 'tamil', 'telugu', 'marathi', 'kannada', 'punjabi', 'k-12', 'pdf', 'sms', 'qr', 'ai', 'oauth']);
    const normTok = (x) => x.toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/-/g, '');
    const nonFirstCaps = w.slice(1).filter((x) => !STOPW.test(x) && /^[A-Z]/.test(x) && !PROPER.has(normTok(x)));
    const firstLower = /^[a-z]/.test(str.trim());
    if (!firstLower && nonFirstCaps.length >= 1 && !new RegExp("\\b(Visionary)\\b").test(str)) out.push('TITLE_CASE');
  }
  if (role === 'HEADLINE' && n > 8) out.push('LONG_HEADING');
  if ((role === 'HEADLINE' || role === 'SUBHEAD') && /;\s/.test(str)) out.push('DOUBLE_IDEA');
  if ((role === 'BODY' || role === 'HEADLINE' || role === 'SUBHEAD') && /\b(is|are|was|were|be|been|being)\s+(built|designed|made|created|powered|engineered|crafted|intended|sold|kept|treated|provided|offered|supported|generated|used)\b/i.test(str)) out.push('PASSIVE');
  if (/ {2,}/.test(str)) out.push('ODD_PUNCT(double-space)');
  if ((role === 'HEADLINE' || role === 'SUBHEAD') && str.includes(EM)) out.push('AI_SLOP(em-dash)');
  if (role === 'BODY' && str.includes(EM)) out.push('EM_DASH(body)');
  if (/\bnot just\b/i.test(str) && /\b(but|also)\b/i.test(str)) out.push('AI_SLOP(not-just-but)');
  if ((role === 'BODY' || role === 'SUBHEAD' || role === 'HEADLINE') && /\butili[sz]ing\b|\bsubsequent(ly)?\b|\bfundamental(ly)?\b|\bcomprehensi[vs]e\b|\bmethodolog/i.test(str)) out.push('HARD_WORD');
  return out;
}

// ---- extractors ---------------------------------------------------------
const COPY_PROPS = ['title', 'subtitle', 'description', 'desc', 'label', 'heading', 'eyebrow', 'tagline', 'placeholder', 'aria-label', 'question', 'copy', 'body', 'message', 'titleLine', 'lead', 'blurb', 'caption', 'prompt', 'hint', 'error', 'success', 'cta', 'link', 'text', 'name', 'headingLine', 'kicker', 'overline', 'section', 'buttonText', 'btnText', 'sub', 'srSentence', 'ctaLabel', 'secondaryLabel', 'ctaTo', 'sr', 'lede', 'deck'];
const PROP_RE = new RegExp("\\b(" + COPY_PROPS.join("|") + ")\\s*=\\s*(?:\"([^\"]{2,500})\"|'([^']{2,500})'|\\{`([^`]{2,500})`|\\{\"([^\"]{2,500})\"\\}|\\{'([^']{2,500})'\\})", "g");

const DATA_KEYS = 'title|subtitle|heading|label|copy|body|desc|description|eyebrow|tagline|cta|link|quote|question|answer|q|a|message|hint|placeholder|error|success|prompt|text|name|tab|chip|persona|black|blue|lead|leadBlack|midBlack|leadBlue|state|option|heading2|subhead|lede|deck|btn|button|kicker|step|title_s|primary|secondary|sub|srSentence|ctaLabel|secondaryLabel|sr';
const DATA_RE = new RegExp("(?:^|[{,(\\s])(" + DATA_KEYS + ")\\s*:\\s*(?:\"([^\"]{2,500})\"|'([^']{2,500})')", "g");

const LIT_RE = /"([^"\n]{6,500})"|'([^'\n]{6,500})'/g;

function roleForKey(k) {
  if (['title', 'heading', 'title2', 'black', 'blue', 'lead', 'leadBlack', 'midBlack', 'leadBlue', 'headingLine', 'title_s', 'kicker', 'overline', 'primary', 'heroTitle'].includes(k)) return 'HEADLINE';
  if (['subtitle', 'tagline', 'eyebrow', 'persona', 'state', 'subhead', 'lede', 'deck', 'section', 'tab'].includes(k)) return 'SUBHEAD';
  if (['cta', 'link', 'btn', 'button', 'buttonText', 'btnText', 'chip'].includes(k)) return 'LINK';
  if (['placeholder'].includes(k)) return 'META-placeholder';
  if (['aria-label'].includes(k)) return 'META-aria';
  if (['label', 'name', 'option', 'hint'].includes(k)) return 'LABEL';
  return 'BODY';
}

for (const f of files) {
  const rel = path.relative(ROOT, f).split(path.sep).join('/');
  const src = fs.readFileSync(f, 'utf8');
  const lines = src.split(/\r?\n/);
  const isDataOrService = /^(src\/data\/|src\/services\/|src\/domain\/)/.test(rel);
  const isDashboard = rel.includes('/dashboard/');
  const isLanding = /^(src\/pages\/landing\/|src\/components\/landing\/|src\/pages\/Landing\.jsx)/.test(rel);
  const area = isDashboard ? 'dashboard' : isLanding ? 'landing' : isDataOrService ? 'data' : 'other';

  let inBlockComment = false;
  lines.forEach((line, idx) => {
    const ln = idx + 1;
    const trimmed = line.trim();
    if (inBlockComment) {
      if (trimmed.includes('*/')) inBlockComment = false;
      return;
    }
    if (trimmed.startsWith('/*')) {
      if (!trimmed.includes('*/')) inBlockComment = true;
      return;
    }
    if (trimmed.startsWith('//') || trimmed.startsWith('/*')) return;

    const matchedSpans = [];
    let m;

    PROP_RE.lastIndex = 0;
    while ((m = PROP_RE.exec(line)) !== null) {
      const val = m[2] || m[3] || m[4] || m[5] || m[6] || '';
      const s = val.replace(WS, ' ').trim();
      if (!notProse(s)) {
        const role = roleForKey(m[1]);
        results.push({ file: rel, line: ln, prop: m[1], role, str: s, area, flags: flagsFor(role, s) });
      }
      matchedSpans.push([m.index, m.index + m[0].length]);
    }

    const spanCovered = (a, b) => matchedSpans.some(([s, e]) => a >= s - 1 && b <= e + 1);

    DATA_RE.lastIndex = 0;
    while ((m = DATA_RE.exec(line)) !== null) {
      if (spanCovered(m.index, m.index + m[0].length)) continue;
      const val = m[2] || m[3] || '';
      const s = val.replace(WS, ' ').trim();
      if (!notProse(s)) {
        const role = roleForKey(m[1]);
        results.push({ file: rel, line: ln, prop: 'data:' + m[1], role, str: s, area, flags: flagsFor(role, s) });
      }
      matchedSpans.push([m.index, m.index + m[0].length]);
    }

    LIT_RE.lastIndex = 0;
    while ((m = LIT_RE.exec(line)) !== null) {
      if (spanCovered(m.index, m.index + m[0].length)) continue;
      const val = m[1] || m[2] || '';
      const s = val.replace(WS, ' ').trim();
      if (notProse(s)) continue;
      const role = words(s).length <= 4 && /^[A-Z]/.test(s) && !/[.!?]$/.test(s) ? 'LABEL' : 'BODY';
      results.push({ file: rel, line: ln, prop: 'literal', role, str: s, area, flags: flagsFor(role, s) });
      matchedSpans.push([m.index, m.index + m[0].length]);
    }

    // inline JSX text  >Copy text<
    const INLINE_RE = />([A-Z'"][A-Za-z0-9 ,.'""&:;!?()\-–—…]{3,400})</g;
    while ((m = INLINE_RE.exec(line)) !== null) {
      const s = m[1].replace(WS, ' ').trim();
      if (notProse(s) || s === m[1]) {
        if (notProse(s)) continue;
      }
      const roleGuess = /<h1|<h2/.test(line) ? 'HEADLINE' : /<h[345]/.test(line) ? 'SUBHEAD' : /<(Link|button|a[\s>])/i.test(line) ? 'BUTTON' : 'BODY';
      results.push({ file: rel, line: ln, prop: 'inline-jsx', role: roleGuess, str: s, area, flags: flagsFor(roleGuess, s) });
    }

    // bare JSX text lines (multi-line paragraphs)
    if (trimmed.length > 3 && /^[A-Z]/.test(trimmed) && !line.includes('="') && !line.includes(': "') && !line.includes('{"')) {
      const cleaned = trimmed.replace(/\s+/g, ' ').replace(/[;]$/, '').replace(/[.,]$/, '');
      if (!notProse(cleaned) && words(cleaned).length >= 2) {
        const roleGuess = /<h1|<h2/.test(trimmed) ? 'HEADLINE' : /<h[345]/.test(trimmed) ? 'SUBHEAD' : 'BODY';
        results.push({ file: rel, line: ln, prop: 'jsxtext', role: roleGuess, str: cleaned, area, flags: flagsFor(roleGuess, cleaned) });
      }
    }
  });
}

const seen = new Set();
const dedup = results.filter((r) => {
  const k = r.file + ':' + r.line + ':' + r.role + ':' + r.str;
  if (seen.has(k)) return false;
  seen.add(k);
  return true;
});

fs.writeFileSync('scripts-tmp/copyaudit/raw.json', JSON.stringify(dedup));
console.log('total strings:', dedup.length);
console.log('by area:', JSON.stringify(dedup.reduce((a, r) => ((a[r.area] = (a[r.area] || 0) + 1), a), {})));
console.log('by role:', JSON.stringify(dedup.reduce((a, r) => ((a[r.role] = (a[r.role] || 0) + 1), a), {})));
const flagged = dedup.filter((r) => r.flags.length);
console.log('flagged:', flagged.length, 'pct:', ((flagged.length / dedup.length) * 100).toFixed(1));
