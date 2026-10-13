import {settingsCopy} from '@/lib/settingsCopy';
import {appClient} from '@/api/appClient';
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
 return <><WorkspaceTools area="personalization"/><AccountAppearance key={scope.ctx?.personId} locale={scope.data?.preferences.interfaceLocale||'en'}/></>;
}
function AccountAppearance({locale}){
 const t=settingsCopy(locale);
 const {user,updateUser}=useAuth();
 const [theme,setTheme]=useState(user?.preferences?.theme_color||'blue');
 const [savedTheme,setSavedTheme]=useState(user?.preferences?.theme_color||'blue');
 const [status,setStatus]=useState('');
 const dirty=theme!==savedTheme;
 async function save(event){event.preventDefault();if(status==='saving')return;setStatus('saving');try{await updateUser({preferences:{theme_color:theme}},{expectedUserId:user.id,expectedThemeColor:savedTheme});setSavedTheme(theme);setStatus('saved');}catch(cause){setStatus(cause.name==='AppearanceConflictError'?'conflict':'error');}}
 async function reviewSaved(){try{const latest=await appClient.auth.me();if(latest.id!==user.id)throw Error();setSavedTheme(latest.preferences?.theme_color||'blue');setTheme(latest.preferences?.theme_color||'blue');setStatus('');}catch{setStatus('error');}}
 return <form onSubmit={save} className="v-page" lang={locale}><section className="v-card"><h2 className="flex items-center gap-3 text-lg font-medium"><Palette size={20}/>{t("Account appearance")}</h2><p className="v-muted mt-2">{t("This account accent applies to supported learning views. Language and Guide preferences above apply to the current workspace.")}</p><fieldset className="mt-5 flex flex-wrap gap-3"><legend className="sr-only">{t("Choose an account accent")}</legend>{googleColors.map(color=><label key={color.name} className={`relative flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2.5 text-sm capitalize ${theme===color.name?'border-[#4285F4] bg-[#e8f0fd]':'border-[#dadce0]'}`}><input type="radio" name="accent" value={color.name} checked={theme===color.name} onChange={()=>{setTheme(color.name);setStatus('');}} className="sr-only peer"/><span className="h-4 w-4 rounded-full peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2" style={{background:color.accent}}/>{t(color.name)}{theme===color.name&&<Check size={16}/>}</label>)}</fieldset><button className="v-button primary mt-5" disabled={!dirty||status==='saving'}><Save size={16}/>{status==='saving'?t('Saving…'):t('Save account accent')}</button>{status==='saved'&&<p role="status" className="v-notice mt-3">{t("Account accent saved on this device.")}</p>}{status==='conflict'&&<p role="alert" className="v-notice mt-3">{t('The account accent changed in another tab. Your choice is still here.')}<button type="button" className="v-button mt-3" onClick={reviewSaved}>{t('Use saved account accent')}</button></p>}{status==='error'&&<p role="alert" className="v-notice v-error mt-3">{t("Account accent could not be saved. Your selection remains here for retry.")}</p>}</section></form>;
}
