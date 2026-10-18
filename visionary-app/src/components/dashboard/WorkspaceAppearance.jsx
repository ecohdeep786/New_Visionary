import {useWorkspace} from '@/hooks/useWorkspace';
import {updatePreferences} from '@/services/workspaceService';
import {learningCatalogueCopy} from '@/lib/learningCatalogueCopy';

export default function WorkspaceAppearance({onSave}){
 const {ctx,data}=useWorkspace();
 const t=learningCatalogueCopy(data?.preferences.interfaceLocale||'en');
 return <label className="block text-sm">{t('Theme')}<select aria-label={t('Theme')} className="v-field mt-2 max-w-xs" value={data?.preferences.appearance||'system'} onChange={event=>onSave(()=>updatePreferences(ctx,{appearance:event.target.value}))}>
  <option value="system">{t('Use device setting')}</option><option value="light">{t('Light')}</option><option value="dark">{t('Dark')}</option>
 </select></label>;
}
