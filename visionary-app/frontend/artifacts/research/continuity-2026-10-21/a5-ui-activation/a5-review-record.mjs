/** One-off: update the product-surface review record for the A5 ui.jsx activation. */
import { readFileSync, writeFileSync } from 'node:fs';

const p = '../integration/contracts/product-surface-review.json';
let t = readFileSync(p, 'utf8');
const before = t;
const re = /("frontend\/src\/components\/landing\/system\/ui\.jsx": \{)[\s\S]*?(\n    \})/;
if (!re.test(t)) throw new Error('record block not found');
const rep = '$1\n'
  + '      "profile": "client-presentation",\n'
  + '      "state": "connected",\n'
  + '      "execution": "client",\n'
  + '      "reason": "Measured landing-system primitives (CtaPair pill pair, Reveal, ProgressDots) are imported by the landing and persona pages. Client-side presentation and navigation only; no server connection, data authority or educational coverage is claimed.",\n'
  + '      "followUp": [\n'
  + '        "SCOPE-06",\n'
  + '        "PLAT-01"\n'
  + '      ]$2';
t = t.replace(re, rep);
if (t === before) throw new Error('no change');
writeFileSync(p, t);
const r = JSON.parse(readFileSync(p, 'utf8'));
console.log('updated record:', JSON.stringify(r.files['frontend/src/components/landing/system/ui.jsx'], null, 1));
console.log('file still valid JSON; files reviewed:', Object.keys(r.files).length);
