import fs from'node:fs';const edit=(p,fn)=>fs.writeFileSync(p,fn(fs.readFileSync(p,'utf8').replaceAll('\r\n','\n')));
edit('src/lib/guideCopy.js',s=>s.replace('const map=',"entries.push(['Parent','अभिभावक','অভিভাবক'],['Professional','पेशेवर','পেশাদার'],['Organization','संगठन','প্রতিষ্ঠান']);\nconst map="));
edit('src/pages/dashboard/Connections.jsx',s=>s.replace('disabled={!!busy} value={role}', 'aria-label={copy("Workspace role")} disabled={!!busy} value={role}').replace('{policy?.label}', '{copy(policy?.label||\'\')}'));
