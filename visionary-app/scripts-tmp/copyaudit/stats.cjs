const fs = require('fs');
const d = JSON.parse(fs.readFileSync('scripts-tmp/copyaudit/raw.json', 'utf8'));

// ---- inventory.tsv ----
const rows = d.map((r) => [r.file, r.line, r.role, r.flags.join(' ') || '-', r.str.replace(/\t/g, ' ')].join('\t'));
fs.writeFileSync('scripts-tmp/copyaudit/inventory.tsv', 'file\tline\trole\tflag\tstring\n' + rows.join('\n') + '\n');

// ---- headline word-length buckets (all HEADLINE/SUBHEAD across product) ----
const heads = d.filter((r) => ['HEADLINE', 'SUBHEAD'].includes(r.role));
const bucket = { '1-2': 0, '3-4': 0, '5-6': 0, '7-8': 0, '9+': 0 };
const wc = (s) => s.trim().split(/\s+/).filter((w) => /[A-Za-z]/.test(w)).length;
heads.forEach((r) => {
  const n = wc(r.str);
  if (n <= 2) bucket['1-2']++;
  else if (n <= 4) bucket['3-4']++;
  else if (n <= 6) bucket['5-6']++;
  else if (n <= 8) bucket['7-8']++;
  else bucket['9+']++;
});
console.log('headline count (HEADLINE+SUBHEAD):', heads.length);
console.log('word-length buckets:', JSON.stringify(bucket));
console.log('HEADLINE-only >8 words:', d.filter((r) => r.role === 'HEADLINE' && wc(r.str) > 8).length);

// ---- repeated phrases (case-insensitive, >=2 repeats) ----
const norm = (s) => s.toLowerCase().replace(/\s+/g, ' ').trim();
const count = {};
d.forEach((r) => {
  const k = norm(r.str);
  if (wc(k) < 2) return;
  if (!count[k]) count[k] = { n: 0, files: new Set(), sample: r.str };
  count[k].n++;
  count[k].files.add(r.file);
});
const repeated = Object.entries(count)
  .filter(([, v]) => v.n >= 2 && v.files.size >= 2)
  .sort((a, b) => b[1].n - a[1].n)
  .slice(0, 25);
console.log('\n--- repeated phrases (>=2 files):');
repeated.forEach(([k, v]) => console.log(v.n + 'x', '"' + v.sample + '"', '| files:', v.files.size));

// ---- CTA vocabulary: BUTTON/LINK roles ----
const cta = {};
d.filter((r) => ['BUTTON', 'LINK'].includes(r.role) || (r.prop === 'data:cta') || (r.prop === 'data:link')).forEach((r) => {
  const k = norm(r.str);
  cta[k] = (cta[k] || 0) + 1;
});
const ctaSorted = Object.entries(cta).sort((a, b) => b[1] - a[1]);
console.log('\n--- CTA vocabulary (unique):', ctaSorted.length);
console.log(ctaSorted.slice(0, 40).map(([k, n]) => n + 'x ' + k).join('\n'));

// ---- worst files by flag count ----
const byFile = {};
d.forEach((r) => {
  if (!r.flags.length) return;
  byFile[r.file] = byFile[r.file] || { flagged: 0, total: 0 };
  byFile[r.file].flagged++;
});
d.forEach((r) => {
  byFile[r.file] = byFile[r.file] || { flagged: 0, total: 0 };
  byFile[r.file].total++;
});
const worst = Object.entries(byFile).sort((a, b) => b[1].flagged - a[1].flagged).slice(0, 12);
console.log('\n--- worst files by flag count:');
worst.forEach(([f, v]) => console.log(v.flagged + '/' + v.total, f));

// ---- dashboard vs landing flag counts ----
['landing', 'dashboard', 'data', 'other'].forEach((area) => {
  const a = d.filter((r) => r.area === area);
  const fl = a.filter((r) => r.flags.length);
  console.log('\nAREA', area, ': strings', a.length, 'flagged', fl.length, 'pct', ((fl.length / (a.length || 1)) * 100).toFixed(1));
});

// ---- flag type distribution ----
const flagTypes = {};
d.forEach((r) => r.flags.forEach((f) => {
  const base = f.split('(')[0];
  flagTypes[base] = (flagTypes[base] || 0) + 1;
}));
console.log('\nflag types:', JSON.stringify(flagTypes));
