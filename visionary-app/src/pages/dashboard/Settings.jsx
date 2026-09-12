import { useEffect, useState } from "react";
import { Check, ChevronLeft, Bell, Globe2, Palette, ShieldCheck, Save } from "lucide-react";
import { Link } from "react-router-dom";
import { googleColors, useThemeColor } from "@/hooks/useThemeColor";
import { useAuth } from "@/lib/AuthContext";

function SettingSwitch({ checked, onChange, label, description }) {
  return (
    <div className="flex items-center justify-between gap-6 py-5">
      <div>
        <p className="text-sm font-medium text-[#202124]">{label}</p>
        <p className="mt-1 text-sm leading-relaxed text-[#5f6368]">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative h-8 w-14 shrink-0 rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1a73e8] ${checked ? "bg-[#1a73e8]" : "bg-[#747775]"}`}
      >
        <span className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow-sm transition-transform ${checked ? "translate-x-7" : "translate-x-1"}`} />
      </button>
    </div>
  );
}

export default function Settings() {
  const { user, updateUser } = useAuth();
  const themeColor = useThemeColor();
  const preferences = user?.preferences || {};
  const [notifications, setNotifications] = useState(preferences.notifications ?? true);
  const [reminders, setReminders] = useState(preferences.study_reminders ?? true);
  const [language, setLanguage] = useState(preferences.language || "English (United States)");
  const [theme, setTheme] = useState(preferences.theme_color || "blue");
  const [status, setStatus] = useState("idle");

  useEffect(() => {
    const nextPreferences = user?.preferences || {};
    setNotifications(nextPreferences.notifications ?? true);
    setReminders(nextPreferences.study_reminders ?? true);
    setLanguage(nextPreferences.language || "English (United States)");
    setTheme(nextPreferences.theme_color || "blue");
  }, [user?.preferences]);

  const saveSettings = async () => {
    setStatus("saving");
    try {
      await updateUser({
        preferences: {
          ...preferences,
          notifications,
          study_reminders: reminders,
          language,
          theme_color: theme,
        },
      });
      setStatus("saved");
      window.setTimeout(() => setStatus("idle"), 2500);
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-[900px] flex-col gap-8 p-6 sm:p-8 lg:p-10">
      <div>
        <Link to="/dashboard/profile" className="inline-flex items-center gap-1 text-sm font-medium text-[#1a73e8] hover:underline">
          <ChevronLeft className="h-4 w-4" /> Profile
        </Link>
        <h1 className="mt-4 text-[30px] font-medium tracking-tight text-[#202124]">Settings</h1>
        <p className="mt-2 text-base text-[#5f6368]">Control your Visionary experience. Changes are saved to your account.</p>
      </div>

      <section className="overflow-hidden rounded-2xl border border-[#dadce0] bg-white">
        <div className="flex items-center gap-3 border-b border-[#dadce0] px-6 py-5">
          <Bell className="h-5 w-5" style={{ color: themeColor.accent }} />
          <div>
            <h2 className="text-base font-medium text-[#202124]">Notifications</h2>
            <p className="mt-0.5 text-sm text-[#5f6368]">Choose the alerts that help you stay on track.</p>
          </div>
        </div>
        <div className="divide-y divide-[#dadce0] px-6">
          <SettingSwitch checked={notifications} onChange={setNotifications} label="Product notifications" description="Receive important account and learning updates." />
          <SettingSwitch checked={reminders} onChange={setReminders} label="Study reminders" description="Get a gentle reminder when your study plan is waiting." />
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-[#dadce0] bg-white">
        <div className="flex items-center gap-3 border-b border-[#dadce0] px-6 py-5">
          <Globe2 className="h-5 w-5" style={{ color: themeColor.accent }} />
          <div>
            <h2 className="text-base font-medium text-[#202124]">Language</h2>
            <p className="mt-0.5 text-sm text-[#5f6368]">Set the language used across this workspace.</p>
          </div>
        </div>
        <label className="block px-6 py-5">
          <span className="mb-2 block text-sm font-medium text-[#202124]">Display language</span>
          <select value={language} onChange={(event) => setLanguage(event.target.value)} className="h-11 w-full max-w-sm rounded-lg border border-[#747775] bg-white px-3 text-sm text-[#202124] outline-none focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8]">
            <option>English (United States)</option>
            <option>English (India)</option>
            <option>Hindi</option>
          </select>
        </label>
      </section>

      <section className="overflow-hidden rounded-2xl border border-[#dadce0] bg-white">
        <div className="flex items-center gap-3 border-b border-[#dadce0] px-6 py-5">
          <Palette className="h-5 w-5" style={{ color: themeColor.accent }} />
          <div>
            <h2 className="text-base font-medium text-[#202124]">Appearance</h2>
            <p className="mt-0.5 text-sm text-[#5f6368]">Pick a workspace accent that is comfortable for you.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 px-6 py-5" role="radiogroup" aria-label="Workspace accent color">
          {googleColors.map((color) => {
            const selected = theme === color.name;
            return (
              <button key={color.name} type="button" role="radio" aria-checked={selected} aria-label={`${color.name} accent`} onClick={() => setTheme(color.name)} className={`flex h-11 items-center gap-2 rounded-full border px-4 text-sm font-medium capitalize transition-colors ${selected ? "border-[#1a73e8] bg-[#e8f0fe] text-[#174ea6]" : "border-[#dadce0] text-[#3c4043] hover:bg-[#f8fafd]"}`}>
                <span className="h-4 w-4 rounded-full" style={{ backgroundColor: color.accent }} />
                {color.name}
                {selected && <Check className="h-4 w-4" />}
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-[#dadce0] bg-[#f8fafd] p-6">
        <div className="flex gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#137333]" />
          <div>
            <h2 className="text-base font-medium text-[#202124]">Privacy and security</h2>
            <p className="mt-1 text-sm leading-relaxed text-[#5f6368]">Your account details and learning preferences stay associated with your signed-in account. Authentication provider controls will appear here when Firebase or Google Cloud Identity is connected.</p>
          </div>
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-4 border-t border-[#dadce0] pt-6">
        <button type="button" onClick={saveSettings} disabled={status === "saving"} className="inline-flex h-10 items-center gap-2 rounded-full bg-[#1a73e8] px-5 text-sm font-medium text-white transition-colors hover:bg-[#1557b0] disabled:cursor-wait disabled:opacity-70">
          <Save className="h-4 w-4" /> {status === "saving" ? "Saving" : "Save changes"}
        </button>
        {status === "saved" && <p className="text-sm text-[#137333]" role="status">Settings saved.</p>}
        {status === "error" && <p className="text-sm text-[#b3261e]" role="alert">We couldn’t save your settings. Try again.</p>}
      </div>
    </div>
  );
}
