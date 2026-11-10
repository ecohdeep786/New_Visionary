import fs from 'node:fs/promises';
const raw = await fs.readFile(new URL('./hero-measure.json', import.meta.url), 'utf8');
const r = JSON.parse(raw);
for (const n of Object.keys(r)) {
  console.log('==== ' + n);
  for (const vw of Object.keys(r[n])) {
    const d = r[n][vw];
    if (d.error) { console.log(vw + ' ERR'); continue; }
    console.log('-- vw ' + vw);
    for (const x of d.roles) {
      console.log('   ' + x.cls + ' = ' + x.fs + '/' + x.fw + '/lh' + x.lh + '/ls' + x.ls + ' "' + (x.txt || '').slice(0, 30) + '"');
    }
  }
}
