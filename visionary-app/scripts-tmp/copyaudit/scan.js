const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const DIRS = ['src/pages','src/components/landing','src/components/dashboard','src/data','src/domain','src/services'];

function walk(d, out) {
  if (!fs.existsSync(d)) return;
  for (const e of fs.readdirSync(d, {withFileTypes:true})) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(jsx|js|ts|tsx)$/.test(e.name)) out.push(p);
  }
}

const files = [];
DIRS.forEach(d => walk(path.join(ROOT,d), files));

const results = [];

// prop patterns to capture
const PROP_RE = /\b(title|subtitle|description|desc|label|heading|eyebrow|tagline|placeholder|aria-label|question|copy|body|text|message|titleLine|lead|blurb|caption|prompt|hint|error|success|cta|link|lead)\s*=\s*(?:"([^"]{2,400})"|'([^']{2,400})'|\{`([^`]{2,400})`|\{"([^"]{2,400})"\}|\{\'([^\']{2,400})\'\})/g;

// JSX text node: lines that are pure text between tags (heuristic: line trimmed starting/ending not with <, /, {, }, etc.)
function isCodeLike(s) {
  return /^(import|export|const|let|var|function|return|if|else|\/\/|\/\*|\*|from|=>|\}|{|<|>|\/|\[|\]|\)|\(|=|\+|-|\.\.\.)/.test(s) || /[;{}<>=]|\$\{|https?:|\.jsx|\.js|className|style|font|#[0-9a-fA-F]{3}/.test(s);
}

const STOPWORDS = new Set(['the','a','an','and','or','of','to','in','on','for','is','are','it','this','that','with','by','as','at','be','from','your','you','we','our']);

function words(s){ return s.trim().split(/\s+/).filter(w=>/[A-Za-z]/.test(w)); }

const BUZZ = ['empower','seamless','unlock','leverage','revolutioniz','unleash','supercharge','cutting-edge','next-gen','harness','elevate','transformative','delve','unravel','streamline','synergy','paradigm','bespoke','tailored','effortless','innovative','game-changer','game changer','world-class','state-of-the-art','best-in-class','robust','scalable','holistic','utilization','pedagogical','autonomous','synergies','immersive','unparalleled','seamlessly','empowering'];
const FILLER = ['in today\S+ fast-paced world','unlock the power','at the end of the day','when it comes to','in order to','it should be noted','needless to say','the power of','take it to the next level','revolutionize the way','transform the way'];

function classify(file, line, role0, str, isDataKey) {
  let role = role0;
  if (!role) {
    if (isDataKey) role = 'BODY';
    else role = 'BODY';
  }
  return role;
}

function flagsFor(role, str) {
  const out = [];
  const w = words(str);
  const n = w.length;
  const lower = str.toLowerCase();
  // buzzword
  for (const b of BUZZ) {
    const re = new RegExp('\b' + b + '\b', 'i');
    if (re.test(lower)) { out.push('BUZZWORD:' + b); break; }
  }
  for (const f of FILLER) {
    if (new RegExp(f, 'i').test(str)) { out.push('FILLER_PHRASE'); break; }
  }
  // title case headings
  if (role === 'HEADLINE' || role === 'SUBHEAD' || role === 'BUTTON' || role === 'LINK' || role === 'LABEL') {
    if (n >= 2) {
      const capd = w.filter(x => /^[A-Z]/.test(x)).length;
      const allcap = w.filter(x => /^[A-Z]{2,}$|^[A-Z]$/.test(x)).length; // acronyms/single letters
      const ratio = capd / n;
      const firstLower = /^[a-z]/.test(str.trim());
      if (!firstLower && ratio > 0.6 && n <= 12 && role !== 'BODY') {
        // exclude ones where all content words are proper-nounish single words like "Sign in"? too complex; flag
        out.push('TITLE_CASE');
      }
    }
  }
  if ((role === 'HEADLINE') && n > 8 && !str.includes('\n')) out.push('LONG_HEADING');
  // double idea in heading
  if ((role === 'HEADLINE' || role === 'SUBHEAD') && / — |; /.test(str) && n > 6) out.push('DOUBLE_IDEA');
  // passive
  if ((role === 'BODY' || role === 'HEADLINE' || role === 'SUBHEAD') && /\b(is|are|was|were|be|been|being)\s+(built|designed|made|created|powered|engineered|crafted|intended|used|sold|kept|treated|provided|offered|supported|connected|generated)\b/i.test(str)) out.push('PASSIVE');
  // double space
  if (/  +/.test(str.replace(/\n/g,' ').trim()) && !/^\s/.test(str)) out.push('ODD_PUNCT:double-space');
  // AI slop em-dash overuse in short strings
  if ((role==='HEADLINE'||role==='SUBHEAD') && /—/.test(str) && n < 12) out.push('AI_SLOP:em-dash');
  return out;
}

for (const f of files) {
  const rel = f.slice(ROOT.length+1).replace(/\/g,'/');
  const src = fs.readFileSync(f,'utf8');
  const lines = src.split(/\r?\n/);
  const isData = rel.startsWith('src/data/') || rel.startsWith('src/services/') || rel.startsWith('src/domain/');
  const isDashboard = rel.includes('/dashboard/');
  lines.forEach((line, idx) => {
    const ln = idx+1;
    // props
    PROP_RE.lastIndex = 0;
    let m;
    while ((m = PROP_RE.exec(line)) !== null) {
      const prop = m[1];
      const val = m[2] || m[3] || m[4] || m[5] || m[6] || '';
      if (!val) continue;
      const s = val.replace(/\s+/g,' ').trim();
      if (!/[a-zA-Z]{2,}/.test(s)) continue;
      if (/^[#0-9a-fA-F]+$|^\d+$|^[a-z]+-[a-z0-9-]*$/.test(s)) continue; // colors/numbers/css ids
      if (/^[a-z][a-zA-Z]*$/.test(s) && !['Sign in','Start free'].includes(s)) {
        // single lowercase word props are usually ids/routes -> skip unless aria/placeholder
        if (!['placeholder','aria-label','title','label'].includes(prop)) continue;
      }
      let role;
      if (['title','heading','titleLine','lead'].includes(prop)) role = 'HEADLINE';
      else if (['subtitle','tagline','eyebrow'].includes(prop)) role = 'SUBHEAD';
      else if (['description','desc','body','copy','blurb','text','message','caption','question','prompt','hint'].includes(prop)) role = 'BODY';
      else if (['placeholder'].includes(prop)) role = 'META-placeholder';
      else if (['aria-label'].includes(prop)) role = 'META-aria';
      else if (['label'].includes(prop)) role = 'LABEL';
      else if (['cta','link'].includes(prop)) role = 'LINK';
      else role = 'BODY';
      results.push({file: rel, line: ln, role, str: s, dashboard: isDashboard, flags: flagsFor(role, s)});
    }
    // JSX text lines: trimmed content that's plain prose
    const t = line.trim();
    if (t.length > 1 && !line.includes('=' + '"') ) {
      // capture JSX raw text lines: not starting with < or { or } or / or quote-assignment; must contain 2+ words and lowercase-ish prose
      if (/^[A-Z"']/.test(t) && (t.match(/[a-z]{3,}/g)||[]).length >= 2 && !isCodeLike(t)) {
        const s = t.replace(/;$/,'');
        results.push({file: rel, line: ln, role: 'BODY-jsxtext', str: s, dashboard: isDashboard, flags: []});
      }
    }
  });
}

// dedupe identical (file,line,role,str)
const seen = new Set();
const dedup = results.filter(r => {
  const k = r.file + ':' + r.line + ':' + r.role + ':' + r.str;
  if (seen.has(k)) return false;
  seen.add(k); return true;
});

fs.writeFileSync('scripts-tmp/copyaudit/raw.json', JSON.stringify(dedup, null, 0));
console.log('total strings:', dedup.length);
console.log('files scanned:', files.length);
