import { downloadText } from '@/lib/downloadText';
import { getResourceEditorDraft,saveResourceEditorDraft,clearResourceEditorDraft } from '@/services/resourceEditorDraft';
import { classColors } from '@/lib/classColors';
import { useWorkspace } from '@/hooks/useWorkspace';
import { primaryWorkspaceCopy } from '@/lib/primaryWorkspaceCopy';
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { Check, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
const COLORS = [["Blue", "#4285F4"], ["Green", "#137333"], ["Red", "#b3261e"], ["Purple", "#7627bb"], ["Teal", "#007b83"], ["Slate", "#4f647a"]];
const FIELDS = [["name", "Class name", "e.g. Algebra II"], ["section", "Section (optional)", "e.g. Period 2"], ["subject", "Subject (optional)", "e.g. Mathematics"], ["room", "Room (optional)", "e.g. 204"]];
export default function CreateClassModal({
  onClose,
  onCreate,
  accent = "#4285F4"
}) {
  const {
    data: copyWorkspace,ctx
  } = useWorkspace();
  const locale = copyWorkspace?.preferences.interfaceLocale || 'en';
  const copy = primaryWorkspaceCopy(locale);
  const {
    activeWorkspace
  } = useAuth();
  const [form, setForm] = useState({
    name: "",
    section: "",
    subject: "",
    room: "",
    color: COLORS[0][1]
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [backupReady,setBackupReady]=useState(false);const [backupError,setBackupError]=useState('');const initial=useRef(true);const live=useRef(true);
  useEffect(()=>()=>{live.current=false;},[]);
  const restore=()=>{try{const saved=getResourceEditorDraft(ctx,'new:teacher-class');if(saved){const fields=JSON.parse(saved.draft.body);if(!fields||['name','section','subject','room','color'].some(k=>typeof fields[k]!=='string')||!/^#[a-f0-9]{6}$/i.test(fields.color))throw Error('Saved class edits are unavailable. Original records have not been changed.');if(initial.current)setForm(fields);}initial.current=false;setBackupReady(true);setBackupError('');}catch(failure){setBackupReady(false);setBackupError(failure.message);}};
  useEffect(()=>{restore();},[ctx?.personId,ctx?.workspaceId]);
  useEffect(()=>{if(!backupReady||!Object.values(form).slice(0,4).some(v=>v.trim()))return;try{saveResourceEditorDraft(ctx,'new:teacher-class',{title:form.name,body:JSON.stringify(form)});setBackupError('');}catch(failure){setBackupError(failure.message);}},[form,backupReady,ctx?.personId,ctx?.workspaceId]);
  const create = async event => {
    event.preventDefault();
    if (!form.name.trim() || busy) return;
    setBusy(true);
    setError("");
    try {
      await onCreate(Object.fromEntries(Object.entries(form).map(([key, value]) => [key, value.trim()])));
      try{clearResourceEditorDraft(ctx,'new:teacher-class');}catch{/* The saved class remains available if backup cleanup is denied. */}
    } catch (failure) {
      setError(failure.message || "Your class couldn’t be created. Please try again.");
    } finally {
      if(live.current)setBusy(false);
    }
  };
  return <Dialog open onOpenChange={open => {
    if (!open && !busy) onClose();
  }}>
      <DialogContent className="max-h-[90dvh] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-3xl bg-white p-6 sm:rounded-3xl sm:p-8" lang={locale}>
        <DialogTitle className="text-[22px] font-medium text-[#121317]"> {copy("Create class")} </DialogTitle>
        <DialogDescription> {copy("Give your class a name. You\u2019ll get a code to share with your students.")} </DialogDescription>
        <form onSubmit={create} className="flex flex-col gap-4">
          <p className="v-notice">{activeWorkspace?.organizationId ? copy('Organization class · {id}. This class will appear in the organization’s linked classroom view.', {
            id: activeWorkspace.organizationId
          }) : copy("Independent teaching \xB7 This class belongs to your personal workspace.")} {copy("To create in another space, close this dialog and switch workspace first.")} </p>
          {FIELDS.map(([key, label, placeholder]) => <label key={key} className="block text-sm font-medium text-[#121317]">
               {copy(label)}
              <input disabled={busy} required={key === "name"} maxLength={100} value={form[key]} onChange={e => setForm(current => ({
            ...current,
            [key]: e.target.value
          }))} placeholder={copy(placeholder)} className="mt-2 h-11 w-full rounded-lg border border-[#5f6368] px-3 font-normal outline-none focus:border-[#4285F4] focus:ring-1 focus:ring-[#4285F4]" />
            </label>)}
          <fieldset><legend className="mb-3 text-sm font-medium text-[#121317]"> {copy("Class color")} </legend><div className="flex flex-wrap gap-3">
            {COLORS.map(([label, color]) => <button key={color} type="button" disabled={busy} onClick={() => setForm(current => ({
              ...current,
              color
            }))} aria-label={copy(label)} aria-pressed={form.color === color} className="flex h-9 w-9 items-center justify-center rounded-full text-white outline-offset-4" style={{
              ...classColors(color)
            }}>{form.color === color && <Check className="h-5 w-5" />}</button>)}
          </div></fieldset>
          {backupError&&<p role="alert" className="text-sm text-[#b3261e]">{copy(backupError)} <button type="button" onClick={()=>downloadText('visionary-class-draft.json',JSON.stringify(form,null,2))} className="underline">{copy("Export class edits")}</button> <button type="button" onClick={restore} className="underline">{copy("Retry class draft recovery")}</button></p>}
          {error && <p role="alert" lang={copy(error)===error?"en":locale} className="text-sm text-[#b3261e]">{copy(error)}</p>}
          <div className="mt-3 flex justify-end gap-2"><button type="button" disabled={busy} onClick={onClose} className="h-10 rounded-full px-5 text-sm font-medium text-[#0b57d2] hover:bg-[#ffffff]"> {copy("Cancel")} </button><button type="submit" disabled={busy || !form.name.trim()} className="inline-flex h-10 items-center justify-center gap-2 rounded-full px-5 text-sm font-medium text-white disabled:opacity-50" style={{
            backgroundColor: accent
          }}>{busy && <Loader2 className="h-4 w-4 animate-spin" />}{busy ? copy("Creating\u2026") : copy("Create class")}</button></div>
        </form>
      </DialogContent>
    </Dialog>;
}
