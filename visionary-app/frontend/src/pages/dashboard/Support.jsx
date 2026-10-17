import {Link} from 'react-router-dom';
import {useWorkspace} from '@/hooks/useWorkspace';
import {organizationAccess} from '@/services/workspaceService';
import {organizationPathAllowed} from '@/services/organizationPolicy';
import {supportCopy} from '@/lib/supportCopy';
import WorkspaceIntro from '@/components/dashboard/WorkspaceIntro';
import WorkspaceDetails from '@/components/dashboard/WorkspaceDetails';
import {CircleHelp, ArrowUpRight} from 'lucide-react';
const starts={student:'/dashboard/learn',professional:'/dashboard/career',teacher:'/dashboard/prepare',parent:'/dashboard/reports',organization:'/dashboard/curriculum'};
const commonPaths=['/dashboard/connections','/dashboard/settings','/dashboard/ask','/dashboard/privacy','/dashboard/privacy','/dashboard/subscription'];
export default function Support(){
 const {ctx,data,error}=useWorkspace();const locale=data?.preferences.interfaceLocale||'en';const t=supportCopy(locale);
 if(error)return <div className="v-page" role="alert" lang="en">{error}</div>;
 if(!ctx)return <div className="v-page" role="status">{t.loading}</div>;
 let policy;try{if(ctx.role==='organization')policy=organizationAccess(ctx);}catch(cause){return <div className="v-page" role="alert" lang="en">{cause.message}</div>;}
 const allowed=path=>!policy||organizationPathAllowed(policy,path);
 const first=t.roles[ctx.role]||t.roles.student;
 const cards=[[...first,starts[ctx.role]||starts.student],...t.common.map((card,index)=>[...card,commonPaths[index]])];
 return <div className="v-page v-support-page" lang={locale}>
  <WorkspaceIntro title={t.title} description={t.intro} icon={CircleHelp}/>
  <section className="v-card v-support-start"><h2 className="text-lg font-medium">{cards[0][0]}</h2><p className="v-muted mt-3">{cards[0][1]}</p>{allowed(cards[0][3])?<Link className="v-button mt-4" to={cards[0][3]}>{cards[0][2]}<ArrowUpRight size={16} aria-hidden="true"/></Link>:<p className="v-muted mt-4">{t.restricted}</p>}</section>
  <div className="v-support-topics">{cards.slice(1).map(([title,description,label,to])=><WorkspaceDetails title={title} key={to+title}><p className="v-muted">{description}</p>{allowed(to)?<Link className="v-button mt-4" to={to}>{label}<ArrowUpRight size={16} aria-hidden="true"/></Link>:<p className="v-muted mt-4">{t.restricted}</p>}</WorkspaceDetails>)}</div>
 </div>;
}
