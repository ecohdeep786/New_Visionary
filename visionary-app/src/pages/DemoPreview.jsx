import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { appClient } from '@/api/appClient';
import { useAuth } from '@/lib/AuthContext';
import { seedDemo, scenarioPersonas,configureMock } from '@/services/workspaceService';
export default function DemoPreview() {
 const {checkUserAuth}=useAuth();const navigate=useNavigate();const [error,setError]=useState('');const [busy,setBusy]=useState(false);const [condition,setCondition]=useState('none');
 if(!import.meta.env.DEV)return <p>This development page is unavailable.</p>;
 async function open(id){setBusy(true);try{const person=seedDemo(id);await appClient.auth.enterDemo(person);await checkUserAuth();navigate('/dashboard/home');}catch(e){setError(e.message);}finally{setBusy(false);}}
 return <main className="mx-auto max-w-3xl p-8"><h1 className="text-2xl font-medium">Visionary demo scenarios</h1><p className="my-4 text-sm text-[#5f6368]">Fictional accounts, local data, curated responses. No email, real verification, or payments. Adult personas can switch among all five roles.</p><p className="mb-5 rounded-xl bg-[#e8f0fd] p-4 text-sm leading-6">Connected fixtures: Dev teaches Aarav, Nila teaches Maya, and both classes belong to the demo school. Anika has separate progress-sharing permission for both children. Ira is connected to the demo company. These are simulated relationships, not verified permissions.</p><label className="mb-6 block text-sm">Guide service condition<select className="ml-3 rounded-lg border p-3" value={condition} onChange={e=>{setCondition(e.target.value);configureMock({fault:e.target.value});}}><option value="none">Normal</option><option value="offline">Offline simulation</option><option value="error">Service failure simulation</option></select></label>{error&&<p role="alert">{error}</p>}<div className="grid gap-3 sm:grid-cols-2">{scenarioPersonas.map(([id,label])=><button key={id} disabled={busy} onClick={()=>open(id)} className="rounded-xl border p-4 text-left hover:bg-[#e8f0fd]">{label}</button>)}</div></main>;
}
