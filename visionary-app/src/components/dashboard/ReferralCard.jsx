import { useState } from "react";
import { Gift, Copy, Check } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { useThemeColor } from "@/hooks/useThemeColor";

/**
 * Refer & earn — share Visionary, both sides get a free month when the friend
 * subscribes. Mirrors Google's referral-style growth incentives.
 */
export default function ReferralCard() {
  const { user } = useAuth();
  const themeColor = useThemeColor();
  const [copied, setCopied] = useState(false);
  const code = (user?.id || "visionary").slice(0, 8).toUpperCase();
  const link = `${window.location.origin}/register?ref=${code}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-6 p-8 bg-white rounded-3xl border border-[#dadce0]/60">
      <div className="w-14 h-14 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: `${themeColor.accent}15` }}>
        <Gift className="w-7 h-7" style={{ color: themeColor.accent }} />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-[22px] font-medium text-[#202124]">Refer a friend, earn a free month</h3>
        <p className="text-sm text-[#5f6368] mt-1 leading-relaxed">
          Share Visionary with a classmate. When they subscribe, you both get a month free — keep learning, keep earning.
        </p>
        <div className="flex items-center gap-2 mt-5">
          <div className="flex-1 h-11 px-4 flex items-center rounded-full bg-[#f1f3f4] text-sm text-[#3c4043] truncate">{link}</div>
          <button
            onClick={copy}
            className="inline-flex items-center gap-2 h-11 px-5 rounded-full text-sm font-medium text-white shrink-0"
            style={{ backgroundColor: themeColor.accent }}
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? "Copied" : "Copy link"}
          </button>
        </div>
      </div>
    </div>
  );
}