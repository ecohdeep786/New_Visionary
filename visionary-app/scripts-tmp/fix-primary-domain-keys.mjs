import fs from'node:fs';const edit=(p,fn)=>fs.writeFileSync(p,fn(fs.readFileSync(p,'utf8').replaceAll('\r\n','\n')));
edit('src/pages/dashboard/Plans.jsx',s=>s.replace('key={copy(plan.id)}','key={plan.id}').replace('className="text-xl font-medium">{plan.id}', 'className="text-xl font-medium">{copy(plan.id)}'));
edit('src/pages/dashboard/role/TeacherHome.jsx',s=>s.replace('key={copy(s.label)}','key={s.label}').replace('className="text-sm text-[#5f6368]">{s.label}', 'className="text-sm text-[#5f6368]">{copy(s.label)}'));
edit('src/pages/dashboard/RoleWorkspace.jsx',s=>s.replace('key={copy(metric.label)}','key={metric.label}').replace('className="mt-1 text-sm text-[#5f6368]">{metric.label}', 'className="mt-1 text-sm text-[#5f6368]">{copy(metric.label)}'));
