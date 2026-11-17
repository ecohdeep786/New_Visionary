import {workspaceText} from '@/lib/workspaceStrings';
import {useWorkspace} from '@/hooks/useWorkspace';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { roleNames } from '@/services/workspaceService';
import WorkspaceListbox from '@/components/dashboard/WorkspaceListbox';
import { Dialog,DialogContent,DialogTitle,DialogDescription } from '@/components/ui/dialog';
export default function WorkspaceSwitcher(){
 const {workspaces,activeWorkspace,switchWorkspace,addRole,person,setAgeBand}=useAuth();const navigate=useNavigate();const [open,setOpen]=useState(false);const [role,setRole]=useState('teacher');const [adult,setAdult]=useState(false);const [error,setError]=useState('');
 const {data}=useWorkspace();const locale=data?.preferences.interfaceLocale||'en';const t=key=>workspaceText(locale,key);
 const availableRoles=person?.ageBand==='minor'?[]:Object.keys(roleNames).filter(key=>!workspaces.some(w=>w.role===key));
 // A single workspace still offers an eligible adult a meaningful Add role action.
 if(workspaces.length<=1&&availableRoles.length===0)return null;
 function change(value){
  if(value==='add'){setRole(availableRoles[0]);setError('');setOpen(true);return;}
  // The native select only fired change on a different value; keep that contract.
  if(value===activeWorkspace?.id)return;
  try{switchWorkspace(value);navigate(workspaces.find(w=>w.id===value)?.lastPath||'/dashboard/home');}catch(e){setError(e.message);}
 }
 const workspaceOptions=workspaces.map(w=>({value:w.id,label:`${w.organizationId?t('work'):w.role==='organization'?t('owner'):t('personal')} · ${w.name}`}));
 const roleOptions=Object.keys(roleNames).filter(key=>!workspaces.some(w=>w.role===key)).map(key=>({value:key,label:t("role_"+key)}));
 return <><div lang={locale} className="workspace-switcher min-w-0 max-w-[160px] text-xs sm:max-w-[190px]"><WorkspaceListbox label={t("activeWorkspace")} value={activeWorkspace?.id||''} options={[...workspaceOptions,...(availableRoles.length>0?[{value:'add',label:t("addRole")}]:[])]} onChange={change} menuClassName="max-h-[min(24rem,calc(100vh-6rem))] overflow-y-auto" triggerClassName="inline-flex h-11 w-full min-w-0 items-center justify-between gap-2 rounded-full border border-transparent bg-[#f5f5f7] px-3 text-sm text-[#1d1d1f] transition-colors duration-150 ease-apple hover:bg-[#eef5ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc]/40"/></div><Dialog open={open} onOpenChange={setOpen}><DialogContent lang={locale}><DialogTitle>{t("addRoleTitle")}</DialogTitle><DialogDescription>{t("addRoleDescription")}</DialogDescription><div className="text-sm"><span>{t("role")}</span><WorkspaceListbox label={t("role")} className="mt-2" value={role} options={roleOptions} onChange={setRole}/></div>{person?.ageBand!=='adult'&&<label className="flex gap-3 text-sm"><input type="checkbox" checked={adult} onChange={e=>setAdult(e.target.checked)}/>{t("confirmAdult")}</label>}{error&&<p role="alert" lang="en" className="v-notice v-error">{error}</p>}<button className="v-button primary" onClick={()=>{try{if(adult)setAgeBand('adult');addRole(role);setOpen(false);navigate('/dashboard/home');}catch(e){setError(e.message);}}}>{t("confirmRole")}</button></DialogContent></Dialog></>;
}
