import {organizationProfiles} from '@/services/organizationPolicy';
import {useId} from 'react';
export default function OrganizationPermissionSelect({value,onChange,disabled=false,label='Administrative permission'}){
 const id=useId();
 return <div className="mt-4"><label htmlFor={id} className="block text-sm font-medium">{label}</label><select id={id} aria-describedby={`${id}-help`} className="v-field mt-2" value={value||''} onChange={event=>onChange(event.target.value)} disabled={disabled}><option value="" disabled>Choose permission</option>{Object.entries(organizationProfiles).filter(([key])=>key!=='owner').map(([key,profile])=><option key={key} value={key}>{profile.label}</option>)}</select><p id={`${id}-help`} className="v-muted mt-2">Only the owner can assign or change administrative permissions. Ownership is not transferable here.</p></div>;
}
