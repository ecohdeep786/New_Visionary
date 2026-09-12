import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const COLORS = [
  ["Blue", "#1967d2"], ["Green", "#137333"], ["Red", "#b3261e"],
  ["Purple", "#7627bb"], ["Teal", "#007b83"], ["Slate", "#4f647a"],
];
const FIELDS = [
  ["name", "Class name", "e.g. Algebra II"],
  ["section", "Section (optional)", "e.g. Period 2"],
  ["subject", "Subject (optional)", "e.g. Mathematics"],
  ["room", "Room (optional)", "e.g. 204"],
];

export default function CreateClassModal({ onClose, onCreate, accent = "#1a73e8" }) {
  const [form, setForm] = useState({ name: "", section: "", subject: "", room: "", color: COLORS[0][1] });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const create = async (event) => {
    event.preventDefault();
    if (!form.name.trim() || busy) return;
    setBusy(true);
    setError("");
    try { await onCreate(Object.fromEntries(Object.entries(form).map(([key, value]) => [key, value.trim()]))); }
    catch { setError("Your class couldn’t be created. Please try again."); }
    finally { setBusy(false); }
  };

  return (
    <Dialog open onOpenChange={(open) => { if (!open && !busy) onClose(); }}>
      <DialogContent className="max-h-[90dvh] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-3xl bg-white p-6 sm:rounded-3xl sm:p-8">
        <DialogTitle className="text-[22px] font-medium text-[#202124]">Create class</DialogTitle>
        <DialogDescription>Give your class a name. You’ll get a code to share with your students.</DialogDescription>
        <form onSubmit={create} className="flex flex-col gap-4">
          {FIELDS.map(([key, label, placeholder]) => (
            <label key={key} className="block text-sm font-medium text-[#202124]">
              {label}
              <input required={key === "name"} maxLength={100} value={form[key]} onChange={(e) => setForm((current) => ({ ...current, [key]: e.target.value }))} placeholder={placeholder} className="mt-2 h-11 w-full rounded-lg border border-[#747775] px-3 font-normal outline-none focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8]" />
            </label>
          ))}
          <fieldset><legend className="mb-3 text-sm font-medium text-[#202124]">Class color</legend><div className="flex flex-wrap gap-3">
            {COLORS.map(([label, color]) => <button key={color} type="button" onClick={() => setForm((current) => ({ ...current, color }))} aria-label={label} aria-pressed={form.color === color} className="flex h-9 w-9 items-center justify-center rounded-full text-white outline-offset-4" style={{ backgroundColor: color }}>{form.color === color && <Check className="h-5 w-5" />}</button>)}
          </div></fieldset>
          {error && <p role="alert" className="text-sm text-[#b3261e]">{error}</p>}
          <div className="mt-3 flex justify-end gap-2"><button type="button" disabled={busy} onClick={onClose} className="h-10 rounded-full px-5 text-sm font-medium text-[#1a73e8] hover:bg-[#f8fafd]">Cancel</button><button type="submit" disabled={busy || !form.name.trim()} className="inline-flex h-10 items-center justify-center gap-2 rounded-full px-5 text-sm font-medium text-white disabled:opacity-50" style={{ backgroundColor: accent }}>{busy && <Loader2 className="h-4 w-4 animate-spin" />}{busy ? "Creating…" : "Create class"}</button></div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
