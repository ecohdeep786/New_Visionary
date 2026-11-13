import fs from 'node:fs';
import { schema, manifest, openapi } from './definitions.mjs';
import './validate.mjs';

for (const [name, value] of Object.entries({ 'schemas.json': schema, 'openapi.json': openapi, 'manifest.json': manifest })) {
  const target = new URL(`./${name}`, import.meta.url);
  const generated = `${JSON.stringify(value, null, 2)}\n`;
  if (process.argv.includes('--check')) {
    if (!fs.existsSync(target) || fs.readFileSync(target, 'utf8') !== generated) throw new Error(`Generated contract drift: ${name}; run npm run build`);
  } else fs.writeFileSync(target, generated);
}
console.log(`KAN-30 ${process.argv.includes('--check') ? 'verified' : 'built'}: ${Object.keys(schema.$defs).length} schemas, ${Object.keys(openapi.paths).length} draft paths; registered endpoints=0, frozen=false`);
