// Extract text content of h1/h2/h3 tags and small uppercase eyebrow <p> tags, multi-line aware.
const fs = require('fs');
const path = require('path');

const files = process.argv.slice(2);
for (const f of files) {
  const src = fs.readFileSync(f, 'utf8');
  const rel = f;
  console.log('===== ' + rel + ' =====');
  // match <h1...>...</h1> etc. DOTALL
  const re = /<(h[1-4])[^>]*>([\s\S]*?)<\/\1>/g;
  let m;
  while ((m = re.exec(src)) !== null) {
    const tag = m[1];
    let inner = m[2];
    // line number
    const ln = src.slice(0, m.index).split(/\r?\n/).length;
    // strip nested tags but keep their text, mark spans
    inner = inner.replace(/\{`[\s\S]*?`\}/g, ' ');
    // detect if inner is pure expression {x} -> skip or annotate
    const exprs = inner.match(/\{[^{}]*\}/g) || [];
    let text = inner.replace(/<[^>]+>/g, ' ').replace(/\{[^{}]*\}/g, ' ').replace(/\s+/g, ' ').trim();
    if (!text && exprs.length) text = '(dynamic: ' + exprs.map((e) => e.slice(1, -1).trim()).join(' + ') + ')';
    if (text || exprs.length) {
      console.log(ln + ' ' + tag.toUpperCase() + ': ' + (text || '(dynamic)') + (exprs.length ? ' [dyn:' + exprs.map((e) => e.slice(1, -1).trim().slice(0, 40)).join(',') + ']' : ''));
    }
  }
  // eyebrow paragraphs: className includes uppercase tracking -> text
  const ere = /<p[^>]*className="[^"]*(?:uppercase|eyebrow)[^"]*"[^>]*>([\s\S]*?)<\/p>/g;
  while ((m = ere.exec(src)) !== null) {
    const ln = src.slice(0, m.index).split(/\r?\n/).length;
    const text = m[1].replace(/<[^>]+>/g, ' ').replace(/\{[^{}]*\}/g, ' ').replace(/\s+/g, ' ').trim();
    const exprs = m[1].match(/\{[^{}]*\}/g) || [];
    if (text) console.log(ln + ' EYEBROW: ' + text);
    else if (exprs.length) console.log(ln + ' EYEBROW: (dyn:' + exprs.map((e) => e.slice(1, -1).trim()).join(',') + ')');
  }
  console.log('');
}
