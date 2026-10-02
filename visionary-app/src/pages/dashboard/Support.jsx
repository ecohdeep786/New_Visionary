import {Link} from 'react-router-dom';
import {useWorkspace} from '@/hooks/useWorkspace';
import {organizationAccess} from '@/services/workspaceService';
import {organizationPathAllowed} from '@/services/organizationPolicy';
import {supportCopy} from '@/lib/supportCopy';
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
 return <div className="v-page" lang={locale}><header><h1 className="v-title">{t.title}</h1><p className="v-muted mt-2">{t.intro}</p></header>{cards.map(([title,description,label,to])=><section className="v-card" key={to+title}><h2 className="text-lg font-medium">{title}</h2><p className="v-muted mt-3 leading-7">{description}</p>{allowed(to)?<Link className="v-button mt-4" to={to}>{label}</Link>:<p className="v-muted mt-4">{t.restricted}</p>}</section>)}</div>;
}
