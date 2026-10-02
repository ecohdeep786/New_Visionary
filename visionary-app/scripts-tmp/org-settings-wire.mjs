import fs from 'node:fs';const p='src/pages/dashboard/Settings.jsx';let s=fs.readFileSync(p,'utf8');s=s.replace('export default function Settings() {',`import {useWorkspace} from '@/hooks/useWorkspace';
import OrganizationSettings from './OrganizationSettings';
export default function Settings(){const scope=useWorkspace();if(scope.ctx?.role==='organization')return <OrganizationSettings key={scope.ctx.personId+':'+scope.ctx.workspaceId} scope={scope}/>;return <PersonalSettings/>;}
function PersonalSettings() {`);fs.writeFileSync(p,s);
const c='src/pages/dashboard/OrganizationContent.jsx';s=fs.readFileSync(c,'utf8').replace('saveOrganizationContent,changeOrganizationContent','saveOrganizationContent,changeOrganizationContent,getOrganizationSettings');s=s.replace("language:'en'};setRecovered", "language:getOrganizationSettings(ctx).contentLanguage};setRecovered");fs.writeFileSync(c,s);
