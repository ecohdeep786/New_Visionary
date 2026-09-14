import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { appClient } from '@/api/appClient';
import { useAuth } from '@/lib/AuthContext';
import { seedDemo, scenarioPersonas } from '@/services/workspaceService';
export default function DemoPreview() {
 const {checkUserAuth}=useAuth();const navigate=useNavigate();const [error,setError]=useState('');const [busy,setBusy]=useState(false);
 if(!import.meta.env.DEV)return <p>This development page is unavailable.</p>;
 async function open(id){setBusy(true);try{const person=seedDemo(id);await appClient.auth.enterDemo(person);await checkUserAuth();navigate('/dashboard/home');}catch(e){setError(e.message);}finally{setBusy(false);}}
 return <main className="mx-auto max-w-3xl p-8"><h1 className="text-2xl font-medium">Visionary demo scenarios</h1><p className="my-4 text-sm text-slate-600">Fictional accounts, local data, curated responses. No email, real verification, or payments. Adult personas can switch among all five roles.</p>{error&&<p role="alert">{error}</p>}<div className="grid gap-3 sm:grid-cols-2">{scenarioPersonas.map(([id,label])=><button key={id} disabled={busy} onClick={()=>open(id)} className="rounded-xl border p-4 text-left hover:bg-blue-50">{label}</button>)}</div></main>;
}
