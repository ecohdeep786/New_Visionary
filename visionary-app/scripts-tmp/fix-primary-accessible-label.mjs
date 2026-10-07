import fs from'node:fs';const edit=(p,fn)=>fs.writeFileSync(p,fn(fs.readFileSync(p,'utf8').replaceAll('\r\n','\n')));
edit('src/pages/dashboard/Plans.jsx',s=>s.replace('<select className="v-field mt-2"','<select aria-label={copy("Demo checkout outcome")} className="v-field mt-2"'));
edit('src/pages/dashboard/RoleWorkspace.jsx',s=>s.replaceAll('>{title}<','>{copy(title)}<').replaceAll('>{description}<','>{copy(description)}<'));
for(const p of ['src/pages/dashboard/Connections.jsx','src/pages/dashboard/StudentClasses.jsx','src/components/dashboard/teacher/CreateClassModal.jsx'])edit(p,s=>s.replaceAll('bg-[#4285F4]','bg-[#0b57d2]').replaceAll('text-[#4285F4]','text-[#0b57d2]'));
edit('src/pages/dashboard/StudentClasses.jsx',s=>s.replace('` · Due ${a.due_date}`',"` · ${copy('Due {date}',{date:a.due_date})}`"));
edit('src/lib/primaryWorkspaceCopy.js',s=>s.replace('const messages=',"rows.push(['Due {date}','अंतिम तारीख {date}','শেষ তারিখ {date}']);\nconst messages="));
