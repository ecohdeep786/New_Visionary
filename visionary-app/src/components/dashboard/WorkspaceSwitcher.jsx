import {workspaceText} from '@/lib/workspaceStrings';
import {useWorkspace} from '@/hooks/useWorkspace';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { roleNames } from '@/services/workspaceService';
import { Dialog,DialogContent,DialogTitle,DialogDescription } from '@/components/ui/dialog';
export default function WorkspaceSwitcher(){
 const {workspaces,activeWorkspace,switchWorkspace,addRole,person,setAgeBand}=useAuth();const navigate=useNavigate();const [open,setOpen]=useState(false);const [role,setRole]=useState('teacher');const [adult,setAdult]=useState(false);const [error,setError]=useState('');
 const {data}=useWorkspace();const locale=data?.preferences.interfaceLocale||'en';const t=key=>workspaceText(locale,key);
 const availableRoles=person?.ageBand==='minor'?[]:Object.keys(roleNames).filter(key=>!workspaces.some(w=>w.role===key));
 // A single workspace still offers an eligible adult a meaningful Add role action.
 if(workspaces.length<=1&&availableRoles.length===0)return null;
 function change(value){if(value==='add'){setRole(availableRoles[0]);setError('');setOpen(true);return;}try{switchWorkspace(value);navigate(workspaces.find(w=>w.id===value)?.lastPath||'/dashboard/home');}catch(e){setError(e.message);}}
 return <><label lang={locale} className="workspace-switcher min-w-0 max-w-[160px] text-xs sm:max-w-[190px]"><span className="sr-only">{t("activeWorkspace")}</span><select aria-label={t("activeWorkspace")} value={activeWorkspace?.id||''} onChange={e=>change(e.target.value)} className="h-11 w-full cursor-pointer truncate rounded-full border border-transparent bg-[#f6f8fc] px-3 text-sm text-[#121317] hover:bg-[#e8f0fd]">{workspaces.map(w=><option key={w.id} value={w.id}>{`${w.organizationId?t('work'):w.role==='organization'?t('owner'):t('personal')} · ${w.name}`}</option>)}{availableRoles.length>0&&<option value="add">{t("addRole")}</option>}</select></label><Dialog open={open} onOpenChange={setOpen}><DialogContent lang={locale}><DialogTitle>{t("addRoleTitle")}</DialogTitle><DialogDescription>{t("addRoleDescription")}</DialogDescription><label className="text-sm">{t("role")}<select aria-label={t("role")} className="v-field mt-2" value={role} onChange={e=>setRole(e.target.value)}>{Object.entries(roleNames).filter(([key])=>!workspaces.some(w=>w.role===key)).map(([key])=><option key={key} value={key}>{t("role_"+key)}</option>)}</select></label>{person?.ageBand!=='adult'&&<label className="flex gap-3 text-sm"><input type="checkbox" checked={adult} onChange={e=>setAdult(e.target.checked)}/>{t("confirmAdult")}</label>}{error&&<p role="alert" lang="en" className="v-notice v-error">{error}</p>}<button className="v-button primary" onClick={()=>{try{if(adult)setAgeBand('adult');addRole(role);setOpen(false);navigate('/dashboard/home');}catch(e){setError(e.message);}}}>{t("confirmRole")}</button></DialogContent></Dialog></>;
}
