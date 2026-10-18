import {useEffect,useState} from 'react';
import {useWorkspace} from '@/hooks/useWorkspace';
import {learningCatalogueCopy} from '@/lib/learningCatalogueCopy';

export default function WorkspaceConnectionStatus(){
 const {data}=useWorkspace();
 const t=learningCatalogueCopy(data?.preferences.interfaceLocale || 'en');
 const [offline,setOffline]=useState(()=>!navigator.onLine);
 useEffect(()=>{const update=()=>setOffline(!navigator.onLine);window.addEventListener('online',update);window.addEventListener('offline',update);return()=>{window.removeEventListener('online',update);window.removeEventListener('offline',update);};},[]);
 return offline?<div className="v-connection-status" role="status">{t('Offline · Saved local work remains available. New content and voice may need a connection.')}</div>:null;
}
