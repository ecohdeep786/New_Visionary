import { useState } from "react";
import { Check, Globe2, Palette, Shield, Save } from "lucide-react";
import { Link } from "react-router-dom";
import { googleColors } from "@/hooks/useThemeColor";
import { useAuth } from "@/lib/AuthContext";
import { learningLanguage } from "@/lib/productAccess";

const languages = ["English", "Hindi", "Bengali", "Tamil", "Telugu", "Kannada", "Malayalam", "Marathi", "Gujarati", "Punjabi", "Urdu", "Odia", "Assamese"];
export default function Settings() {
  const { user, updateUser } = useAuth();
  const [language, setLanguage] = useState(learningLanguage(user));
  const [theme, setTheme] = useState(user?.preferences?.theme_color || "blue");
  const [status, setStatus] = useState("");
  const dirty = language !== learningLanguage(user) || theme !== (user?.preferences?.theme_color || "blue");
  async function save(event) {
    event.preventDefault(); setStatus("saving");
    try { await updateUser({ preferences: { ...user?.preferences, learning_language: language.trim(), theme_color: theme } }); setStatus("saved"); }
    catch { setStatus("error"); }
  }
  return <form onSubmit={save} className="mx-auto max-w-[900px] space-y-6 p-5 sm:p-8">
    <header><h1 className="text-2xl font-medium">Settings</h1><p className="mt-2 text-sm text-[#5f6368]">Make this space feel like yours.</p></header>
    <section className="rounded-2xl border border-[#dadce0] p-6"><h2 className="flex items-center gap-3 text-base font-medium"><Globe2 className="h-5 w-5 text-[#1967d2]" />Learn in the language you think in</h2><p className="mt-2 text-sm leading-6 text-[#5f6368]">Your preferred language travels with your questions and learning context. The interface is currently in English; AI translation becomes available when the model is connected.</p><label className="mt-5 block text-sm font-medium">Preferred learning language<input list="learning-languages" required maxLength={60} value={language} onChange={e => { setLanguage(e.target.value); setStatus(""); }} className="mt-2 block w-full max-w-sm rounded-xl border border-[#747775] p-3 font-normal" /></label><datalist id="learning-languages">{languages.map(l => <option key={l} value={l} />)}</datalist></section>
    <section className="rounded-2xl border border-[#dadce0] p-6"><h2 className="flex items-center gap-3 text-base font-medium"><Palette className="h-5 w-5 text-[#1967d2]" />Workspace accent</h2><fieldset className="mt-5 flex flex-wrap gap-3"><legend className="sr-only">Choose an accent</legend>{googleColors.map(c => <label key={c.name} className={`flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2.5 text-sm capitalize ${theme === c.name ? "border-[#1967d2] bg-[#e8f0fe]" : "border-[#dadce0]"}`}><input type="radio" name="accent" value={c.name} checked={theme === c.name} onChange={() => { setTheme(c.name); setStatus(""); }} className="sr-only peer" /><span className="h-4 w-4 rounded-full peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2" style={{ background: c.accent }} />{c.name}{theme === c.name && <Check className="h-4 w-4" />}</label>)}</fieldset></section>
    <section className="rounded-2xl border border-[#dadce0] bg-[#f8fafd] p-6"><h2 className="flex items-center gap-3 text-base font-medium"><Shield className="h-5 w-5 text-[#1967d2]" />Your data and connections</h2><p className="mt-3 text-sm leading-6 text-[#5f6368]">This preview saves data in this browser, not a cloud database. Do not use sensitive or real student records. Private questions and project notes are not shared by connecting to a class or organization.</p><Link to="/dashboard/connections" className="mt-4 inline-block text-sm text-[#1967d2]">Manage sharing and connections</Link></section>
    <div className="flex flex-wrap items-center gap-4"><button disabled={!dirty || !language.trim() || status === "saving"} className="inline-flex items-center gap-2 rounded-full bg-[#1967d2] px-5 py-2.5 text-sm font-medium text-white disabled:opacity-40"><Save className="h-4 w-4" />{status === "saving" ? "Saving…" : "Save changes"}</button>{status === "saved" && <p role="status" className="text-sm text-green-800">Settings saved.</p>}{status === "error" && <p role="alert" className="text-sm text-red-700">Could not save. Please try again.</p>}</div>
  </form>;
}

