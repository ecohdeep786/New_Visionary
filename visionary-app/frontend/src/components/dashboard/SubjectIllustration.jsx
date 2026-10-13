import { useThemeColor } from "@/hooks/useThemeColor";

/* Cartoon-style: Atom with orbiting electrons */
function PhysicsIllustration({ color }) {
  return (
    <svg viewBox="0 0 160 100" className="w-full h-full" fill="none" preserveAspectRatio="xMidYMid slice">
      <ellipse cx="80" cy="50" rx="60" ry="22" stroke={color} strokeWidth="2.5" opacity="0.4" />
      <ellipse cx="80" cy="50" rx="60" ry="22" stroke={color} strokeWidth="2.5" opacity="0.4" transform="rotate(55 80 50)" />
      <ellipse cx="80" cy="50" rx="60" ry="22" stroke={color} strokeWidth="2.5" opacity="0.4" transform="rotate(125 80 50)" />
      <circle cx="80" cy="50" r="12" fill={color} opacity="0.9" />
      <circle cx="80" cy="50" r="6" fill="#fff" opacity="0.4" />
      <circle cx="20" cy="50" r="5" fill={color} opacity="0.7" />
      <circle cx="110" cy="22" r="5" fill={color} opacity="0.7" />
      <circle cx="110" cy="78" r="5" fill={color} opacity="0.7" />
      <circle cx="140" cy="20" r="3" fill={color} opacity="0.3" />
      <circle cx="15" cy="85" r="3" fill={color} opacity="0.3" />
    </svg>
  );
}

/* Cartoon-style: Beaker with bubbles and molecules */
function ChemistryIllustration({ color }) {
  return (
    <svg viewBox="0 0 160 100" className="w-full h-full" fill="none" preserveAspectRatio="xMidYMid slice">
      <path d="M 60 15 L 60 45 L 45 80 Q 45 90 55 90 L 105 90 Q 115 90 115 80 L 100 45 L 100 15 Z" stroke={color} strokeWidth="2.5" opacity="0.5" />
      <path d="M 55 60 L 105 60 L 112 80 Q 112 87 105 87 L 55 87 Q 48 87 48 80 Z" fill={color} opacity="0.2" />
      <line x1="55" y1="15" x2="105" y2="15" stroke={color} strokeWidth="2.5" opacity="0.5" strokeLinecap="round" />
      <circle cx="70" cy="70" r="4" fill={color} opacity="0.4" />
      <circle cx="85" cy="75" r="3" fill={color} opacity="0.4" />
      <circle cx="95" cy="68" r="5" fill={color} opacity="0.3" />
      <circle cx="78" cy="30" r="3" fill={color} opacity="0.3" />
      <circle cx="92" cy="25" r="2" fill={color} opacity="0.3" />
      <circle cx="130" cy="30" r="6" fill={color} opacity="0.2" />
      <circle cx="130" cy="30" r="3" fill={color} opacity="0.4" />
      <line x1="124" y1="30" x2="136" y2="30" stroke={color} strokeWidth="1.5" opacity="0.3" />
      <line x1="130" y1="24" x2="130" y2="36" stroke={color} strokeWidth="1.5" opacity="0.3" />
    </svg>
  );
}

/* Cartoon-style: Chalkboard with equations and shapes */
function MathIllustration({ color }) {
  return (
    <svg viewBox="0 0 160 100" className="w-full h-full" fill="none" preserveAspectRatio="xMidYMid slice">
      <rect x="15" y="15" width="130" height="70" rx="6" fill={color} opacity="0.08" />
      <path d="M 30 55 Q 80 15, 130 55" stroke={color} strokeWidth="2.5" opacity="0.5" strokeLinecap="round" />
      <path d="M 30 60 Q 80 35, 130 60" stroke={color} strokeWidth="2" opacity="0.3" strokeLinecap="round" />
      <circle cx="80" cy="35" r="5" fill={color} opacity="0.6" />
      <rect x="25" y="68" width="10" height="10" rx="2" fill={color} opacity="0.4" />
      <polygon points="125,68 132,78 118,78" fill={color} opacity="0.4" />
      <line x1="50" y1="72" x2="65" y2="72" stroke={color} strokeWidth="2" opacity="0.3" strokeLinecap="round" />
      <line x1="55" y1="67" x2="55" y2="77" stroke={color} strokeWidth="2" opacity="0.3" strokeLinecap="round" />
      <circle cx="95" cy="72" r="4" fill="none" stroke={color} strokeWidth="2" opacity="0.4" />
      <line x1="100" y1="67" x2="110" y2="77" stroke={color} strokeWidth="2" opacity="0.3" strokeLinecap="round" />
    </svg>
  );
}

/* Cartoon-style: DNA double helix */
function BiologyIllustration({ color }) {
  return (
    <svg viewBox="0 0 160 100" className="w-full h-full" fill="none" preserveAspectRatio="xMidYMid slice">
      <path d="M 55 15 Q 105 35, 55 55 Q 105 75, 55 95" stroke={color} strokeWidth="2.5" opacity="0.5" strokeLinecap="round" fill="none" />
      <path d="M 105 15 Q 55 35, 105 55 Q 55 75, 105 95" stroke={color} strokeWidth="2.5" opacity="0.5" strokeLinecap="round" fill="none" />
      <line x1="57" y1="22" x2="103" y2="22" stroke={color} strokeWidth="2" opacity="0.3" />
      <line x1="63" y1="35" x2="97" y2="35" stroke={color} strokeWidth="2" opacity="0.3" />
      <line x1="57" y1="48" x2="103" y2="48" stroke={color} strokeWidth="2" opacity="0.3" />
      <line x1="63" y1="62" x2="97" y2="62" stroke={color} strokeWidth="2" opacity="0.3" />
      <line x1="57" y1="75" x2="103" y2="75" stroke={color} strokeWidth="2" opacity="0.3" />
      <line x1="63" y1="88" x2="97" y2="88" stroke={color} strokeWidth="2" opacity="0.3" />
      <circle cx="80" cy="22" r="3" fill={color} opacity="0.5" />
      <circle cx="80" cy="48" r="3" fill={color} opacity="0.5" />
      <circle cx="80" cy="75" r="3" fill={color} opacity="0.5" />
      <circle cx="130" cy="25" r="4" fill={color} opacity="0.2" />
      <circle cx="135" cy="70" r="3" fill={color} opacity="0.2" />
    </svg>
  );
}

/* Cartoon-style: Open book with star */
function DefaultIllustration({ color }) {
  return (
    <svg viewBox="0 0 160 100" className="w-full h-full" fill="none" preserveAspectRatio="xMidYMid slice">
      <path d="M 80 25 Q 55 18, 25 22 L 25 80 Q 55 76, 80 83 Z" fill={color} opacity="0.15" stroke={color} strokeWidth="2" strokeOpacity="0.4" />
      <path d="M 80 25 Q 105 18, 135 22 L 135 80 Q 105 76, 80 83 Z" fill={color} opacity="0.15" stroke={color} strokeWidth="2" strokeOpacity="0.4" />
      <line x1="80" y1="25" x2="80" y2="83" stroke={color} strokeWidth="2" opacity="0.4" />
      <line x1="35" y1="35" x2="70" y2="33" stroke={color} strokeWidth="1.5" opacity="0.2" />
      <line x1="35" y1="45" x2="70" y2="43" stroke={color} strokeWidth="1.5" opacity="0.2" />
      <line x1="35" y1="55" x2="65" y2="53" stroke={color} strokeWidth="1.5" opacity="0.2" />
      <line x1="90" y1="33" x2="125" y2="35" stroke={color} strokeWidth="1.5" opacity="0.2" />
      <line x1="90" y1="43" x2="125" y2="45" stroke={color} strokeWidth="1.5" opacity="0.2" />
      <line x1="90" y1="53" x2="120" y2="55" stroke={color} strokeWidth="1.5" opacity="0.2" />
      <path d="M 80 8 L 83 16 L 91 16 L 85 21 L 87 29 L 80 24 L 73 29 L 75 21 L 69 16 L 77 16 Z" fill={color} opacity="0.6" />
    </svg>
  );
}

/* Cartoon-style: Speech bubbles for languages */
function EnglishIllustration({ color }) {
  return (
    <svg viewBox="0 0 160 100" className="w-full h-full" fill="none" preserveAspectRatio="xMidYMid slice">
      <path d="M 25 20 Q 25 12, 35 12 L 85 12 Q 95 12, 95 20 L 95 45 Q 95 53, 85 53 L 55 53 L 42 65 L 47 53 L 35 53 Q 25 53, 25 45 Z" fill={color} opacity="0.15" stroke={color} strokeWidth="2" strokeOpacity="0.4" />
      <path d="M 65 55 Q 65 47, 75 47 L 125 47 Q 135 47, 135 55 L 135 80 Q 135 88, 125 88 L 105 88 L 92 98 L 97 88 L 75 88 Q 65 88, 65 80 Z" fill={color} opacity="0.12" stroke={color} strokeWidth="2" strokeOpacity="0.3" />
      <line x1="35" y1="25" x2="85" y2="25" stroke={color} strokeWidth="2" opacity="0.2" strokeLinecap="round" />
      <line x1="35" y1="35" x2="75" y2="35" stroke={color} strokeWidth="2" opacity="0.2" strokeLinecap="round" />
      <line x1="75" y1="60" x2="125" y2="60" stroke={color} strokeWidth="2" opacity="0.15" strokeLinecap="round" />
      <line x1="75" y1="70" x2="115" y2="70" stroke={color} strokeWidth="2" opacity="0.15" strokeLinecap="round" />
    </svg>
  );
}

const subjectIllustrations = {
  physics: PhysicsIllustration,
  chemistry: ChemistryIllustration,
  math: MathIllustration,
  mathematics: MathIllustration,
  biology: BiologyIllustration,
  english: EnglishIllustration,
  language: EnglishIllustration,
  "english language": EnglishIllustration,
};

export default function SubjectIllustration({ subject, className = "" }) {
  const themeColor = useThemeColor();
  const key = (subject || "").toLowerCase().trim();
  const Illustration = subjectIllustrations[key] || DefaultIllustration;

  return (
    <div
      className={`relative flex items-center justify-center ${className}`}
      style={{ backgroundColor: themeColor.light }}
    >
      <div className="w-full h-full p-3">
        <Illustration color={themeColor.accent} />
      </div>
    </div>
  );
}