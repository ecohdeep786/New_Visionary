import { Cookie, Check } from "lucide-react";
import { LegalPage } from "@/components/landing/AboutPageShared";

export default function CookiesPage() {
  return (
    <LegalPage
      eyebrow="Cookies"
      titleParts={[{ text: "Only what's " }, { text: "needed.", accent: true }]}
      intro="Cookies should help you, not track you. We use the minimum necessary to keep you signed in and make Visionary work — nothing more."
      sections={[
        {
          id: "principles",
          eyebrow: "What we use and why",
          heading: "Essential only,",
          headingAccent: "nothing extra.",
          body: "No advertising cookies. No tracking across other sites. Just what keeps Visionary running for you.",
          cards: [
            { Icon: Cookie, title: "Essential cookies", copy: "These keep you signed in and remember your preferences. Without them, Visionary doesn't work." },
            { Icon: Check, title: "No advertising cookies", copy: "We don't use cookies to show you ads. Ever. There are no ad networks watching what you do here." },
            { Icon: Check, title: "Analytics with consent", copy: "If we use analytics cookies, we ask first. You can say no, and Visionary still works perfectly." },
            { Icon: Cookie, title: "You control them", copy: "Clear your cookies anytime from your browser or your Visionary settings. Your call." },
          ],
        },
        {
          id: "types",
          bg: "surface",
          eyebrow: "The types we use",
          heading: "What each cookie",
          headingAccent: "does.",
          rows: [
            { n: "01", title: "Session cookies.", copy: "Keep you signed in while you use Visionary. They're deleted when you close your browser." },
            { n: "02", title: "Preference cookies.", copy: "Remember things like your language and theme so you don't have to set them every time." },
            { n: "03", title: "Analytics (optional).", copy: "Help us understand what's working so we can improve. Only with your consent, and you can opt out anytime." },
          ],
        },
      ]}
      cta={{
        title: "Questions about",
        titleAccent: "cookies?",
        desc: "We're transparent about every cookie we use and why. Reach out if something isn't clear.",
        primaryLabel: "Contact us",
        primaryTo: "/contact",
        secondaryLabel: "Read privacy policy",
        secondaryTo: "/privacy",
      }}
    />
  );
}