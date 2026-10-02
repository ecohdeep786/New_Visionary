import {useState} from 'react';
import {Check,Palette,Save} from 'lucide-react';
import {googleColors} from '@/hooks/useThemeColor';
import {useAuth} from '@/lib/AuthContext';
import {useWorkspace} from '@/hooks/useWorkspace';
import WorkspaceTools from './WorkspaceTools';
import OrganizationSettings from './OrganizationSettings';

export default function Settings(){
 const scope=useWorkspace();
 if(scope.ctx?.role==='organization')return <OrganizationSettings key={scope.ctx.personId+':'+scope.ctx.workspaceId} scope={scope}/>;
 return <><WorkspaceTools area="personalization"/><AccountAppearance/></>;
}
function AccountAppearance(){
 const {user,updateUser}=useAuth();
 const [theme,setTheme]=useState(user?.preferences?.theme_color||'blue');
 const [status,setStatus]=useState('');
 const dirty=theme!==(user?.preferences?.theme_color||'blue');
 async function save(event){event.preventDefault();if(status==='saving')return;setStatus('saving');try{await updateUser({preferences:{...user?.preferences,theme_color:theme}});setStatus('saved');}catch{setStatus('error');}}
 return <form onSubmit={save} className="v-page"><section className="v-card"><h2 className="flex items-center gap-3 text-lg font-medium"><Palette size={20}/>Account appearance</h2><p className="v-muted mt-2">This account accent applies to supported learning views. Language and Guide preferences above apply to the current workspace.</p><fieldset className="mt-5 flex flex-wrap gap-3"><legend className="sr-only">Choose an account accent</legend>{googleColors.map(color=><label key={color.name} className={`flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2.5 text-sm capitalize ${theme===color.name?'border-[#4285F4] bg-[#e8f0fd]':'border-[#dadce0]'}`}><input type="radio" name="accent" value={color.name} checked={theme===color.name} onChange={()=>{setTheme(color.name);setStatus('');}} className="sr-only peer"/><span className="h-4 w-4 rounded-full peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2" style={{background:color.accent}}/>{color.name}{theme===color.name&&<Check size={16}/>}</label>)}</fieldset><button className="v-button primary mt-5" disabled={!dirty||status==='saving'}><Save size={16}/>{status==='saving'?'Saving…':'Save account accent'}</button>{status==='saved'&&<p role="status" className="v-notice mt-3">Account accent saved on this device.</p>}{status==='error'&&<p role="alert" className="v-notice v-error mt-3">Account accent could not be saved. Your selection remains here for retry.</p>}</section></form>;
}
