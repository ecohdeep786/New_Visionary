import fs from'node:fs';const edit=(p,fn)=>fs.writeFileSync(p,fn(fs.readFileSync(p,'utf8').replaceAll('\r\n','\n')));
edit('src/lib/organizationAuthorCopy.js',s=>s.replace('const map=',"entries.push(['Open','खोलें','খুলুন'],['Version','संस्करण','সংস্করণ'],['Retained representation','मूल प्रस्तुति बरकरार','মূল উপস্থাপনা রাখা হয়েছে']);\nconst map="));
edit('src/components/dashboard/CurriculumTemplateEditor.jsx',s=>s.replace(' · version {value.provenance.version}', ' · {copy("Version")} {value.provenance.version}').replace(' · retained representation', ' · {copy("Retained representation")}'));
