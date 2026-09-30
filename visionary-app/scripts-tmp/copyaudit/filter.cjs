// post-filter: remove css-class noise from raw.json
const fs = require('fs');
const d = JSON.parse(fs.readFileSync('scripts-tmp/copyaudit/raw.json', 'utf8'));

function isCssNoise(s) {
  if (!s) return true;
  if (/rgba?\(|hsl\(|\bclamp\(|calc\(|cubic-bezier|matrix|translate|scaleX|scaleY|rotate\(/.test(s)) return true;
  if (/#[0-9a-fA-F]{3,8}\b/.test(s)) return true;
  if (/animation|keyframe/.test(s)) return true;
  if (/\b(dvh|svh|vh|vw|px|rem|em|s)\)?\s*$/.test(s) && !/[.!?]/.test(s)) return true;
  if (/^\s*-?[\d.]+\w*\s*$/.test(s)) return true;
  // pure tailwind token string: every token matches utility shape and no uppercase prose word
  const toks = s.trim().split(/\s+/);
  const utility = /^(([a-z][a-z0-9]*)(-[a-z0-9]+)*:)*[a-z]+(-[a-z0-9]+)*(\[[^\]]*\])?(\/\d+)?$/;
  if (toks.every((t) => utility.test(t)) && toks.every((t) => !/[A-Z]/.test(t))) {
    // allow single-word capitalized-free English like "Sign in"? those have uppercase. all-lowercase utilities w/ digits/hyphens = css
    const cssy = toks.some((t) => /-[\d.]+|\[\d|\/\d|^h-|^w-|^p[xytblr]?-|^m[xytblr]?-|^gap|^flex|^grid|^bg-|^text-\d|^leading|^tracking|^rounded|^border|^opacity|^transition|^duration|^ease|^col-|^row-|^mt|^mb|^ml|^mr|^pt|^pb|^pl|^pr|^max-|^min-|^aspect|^object|^overflow|^whitespace|^backdrop|^pointer|^snap|^inline|^block|^absolute|^relative|^sticky|^z-\d|^top-|^left-|^right-|^bottom-|^inset|^sr-only|hidden|shrink|grow|italic|uppercase|truncate|^animate/.test(t));
    if (cssy) return true;
  }
  return false;
}

const clean = d.filter((r) => !isCssNoise(r.str));
fs.writeFileSync('scripts-tmp/copyaudit/raw.json', JSON.stringify(clean));
console.log('kept:', clean.length, 'removed:', d.length - clean.length);
