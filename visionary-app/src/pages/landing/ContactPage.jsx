import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight, Briefcase, Building2, ChevronRight, Mail, MessageCircle,
  Newspaper, ShieldCheck, UsersRound, Lightbulb, FlaskConical, AlertCircle,
} from "lucide-react";
import LandingNav from "@/components/landing/LandingNav";
import { RESPONSE_TIMES } from "@/data/legalMeta";
import LandingFooter from "@/components/landing/LandingFooter";
import GoogleIllustration from "@/components/landing/sections/GoogleIllustration";
import HighlightCard from "@/components/landing/sections/HighlightCard";

const C = {
  ink: "#202124", surface: "#f8f9fa", blue: "#1a73e8",
  grey: "#5f6368", lightGrey: "#9aa0a6", mist: "#dadce0", white: "#ffffff",
};
const FONT = "'Google Sans Flex', 'Google Sans', system-ui, -apple-system, sans-serif";

const ROUTES = [
  { icon: MessageCircle, title: "General questions", desc: "Questions about Visionary, the product, how it works, or getting started.", email: "hello@visionary.org.in" },
  { icon: Building2, title: "Schools and institutions", desc: "Talk with us about bringing Visionary to a school, college, coaching organization, or workplace.", email: "partnerships@visionary.org.in" },
  { icon: Newspaper, title: "Press and media", desc: "For journalists, writers, researchers, and people covering Visionary.", email: "press@visionary.org.in" },
  { icon: ShieldCheck, title: "Safety and privacy", desc: "Report a safety concern, privacy issue, or something that should not be happening.", email: "safety@visionary.org.in" },
];

const FORM_TYPES = ["General question", "School or institution", "Partnership", "Press or media", "Safety or privacy", "Research", "Careers", "Other"];

function HeroBlobs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      <div className="absolute rounded-full blur-3xl" style={{ width: 500, height: 500, right: -100, top: -140, background: "radial-gradient(circle, rgba(26,115,232,0.16) 0%, transparent 70%)" }} />
      <div className="absolute rounded-full blur-3xl" style={{ width: 280, height: 280, right: 180, top: 100, background: "radial-gradient(circle, rgba(52,168,83,0.09) 0%, transparent 70%)" }} />
    </div>
  );
}

function Section({ id, children, bg = "white" }) {
  return (
    <section id={id} className={`scroll-mt-24 px-6 py-28 lg:py-36 ${bg === "surface" ? "bg-[#f8f9fa]" : "bg-white"}`}>
      <div className="max-w-[1200px] mx-auto">{children}</div>
    </section>
  );
}

function SectionTitle({ eyebrow, id, children }) {
  return (
    <div className="mb-12 lg:mb-16">
      {eyebrow && <p className="text-[11px] font-medium uppercase tracking-[0.4px] mb-4" style={{ color: C.grey }}>{eyebrow}</p>}
      <h2 id={id} className="text-[clamp(30px,4vw,48px)] font-medium leading-[1.08] tracking-[-0.025em]" style={{ color: C.ink }}>{children}</h2>
    </div>
  );
}

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [type, setType] = useState("General question");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("idle");

  function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setStatus("error"); return; }
    setStatus("submitting");
    setTimeout(() => setStatus("success"), 900);
  }

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: FONT }}>
      <LandingNav />
      <main id="main">

        {/* HERO */}
        <section className="relative overflow-hidden px-6 pb-20 pt-36 lg:pt-44 lg:pb-28">
          <HeroBlobs />
          <div className="relative z-10 max-w-[1200px] mx-auto">
            <div className="flex items-center gap-2 mb-5">
              <Mail className="w-5 h-5" strokeWidth={1.7} style={{ color: C.grey }} />
              <p className="text-[11px] font-medium uppercase tracking-[0.4px]" style={{ color: C.grey }}>Contact</p>
            </div>
            <h1 className="max-w-[800px] text-[clamp(44px,6vw,76px)] font-medium leading-[1.02] tracking-[-0.03em]" style={{ color: C.ink }}>
              Get in touch.<br /><span style={{ color: C.blue }}>Start with what you need.</span>
            </h1>
            <p className="mt-6 text-[17.5px] text-[#5f6368] leading-[1.65] max-w-[700px]">
              Whether you have a question about Visionary, want to bring it to an institution, or simply want to talk about the work — we want to know what you are trying to solve.
            </p>
          </div>
        </section>

        {/* CONTACT ROUTES — icon grid */}
        <Section bg="surface">
          <SectionTitle eyebrow="Contact routes">Choose the conversation<br /><span style={{ color: C.blue }}>that fits your question.</span></SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {ROUTES.map((route) => (
              <HighlightCard key={route.email} Icon={route.icon} title={route.title}>
                {route.desc}
                <br />
                <a href={`mailto:${route.email}`} className="inline-flex items-center gap-1.5 mt-3 text-[14px] font-medium hover:underline" style={{ color: C.blue }}>
                  {route.email} <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={1.8} />
                </a>
              </HighlightCard>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-4 text-[13px] text-[#5f6368]">
            <span className="font-medium text-[#202124]">What to expect:</span>
            <span>{RESPONSE_TIMES.general}</span>
            <span>{RESPONSE_TIMES.safety}</span>
          </div>
        </Section>

        {/* SEND A MESSAGE — form card */}
        <Section id="form">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-start">
            <div>
              <SectionTitle eyebrow="Send a message">Tell us what you are<br /><span style={{ color: C.blue }}>trying to solve.</span></SectionTitle>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: `${C.blue}12` }}>
                    <MessageCircle className="w-5 h-5" strokeWidth={1.7} style={{ color: C.blue }} />
                  </div>
                  <div>
                    <h4 className="text-[15px] font-medium text-[#202124]">What happened?</h4>
                    <p className="text-[14px] text-[#5f6368] leading-[1.6]">Describe the question, problem, or situation that brought you here.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: `${C.blue}12` }}>
                    <Lightbulb className="w-5 h-5" strokeWidth={1.7} style={{ color: C.blue }} />
                  </div>
                  <div>
                    <h4 className="text-[15px] font-medium text-[#202124]">What are you trying to do?</h4>
                    <p className="text-[14px] text-[#5f6368] leading-[1.6]">Tell us the outcome you are looking for.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: `${C.blue}12` }}>
                    <UsersRound className="w-5 h-5" strokeWidth={1.7} style={{ color: C.blue }} />
                  </div>
                  <div>
                    <h4 className="text-[15px] font-medium text-[#202124]">Who is it for?</h4>
                    <p className="text-[14px] text-[#5f6368] leading-[1.6]">A student, teacher, parent, professional, institution, or something else?</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="rounded-[28px] border border-[#e8eaed] bg-white p-8">
              {status === "error" ? (
                <div className="py-8 text-center">
                  <div className="w-12 h-12 rounded-[16px] mx-auto flex items-center justify-center" style={{ backgroundColor: "#FCE8E6" }}>
                    <AlertCircle className="w-5 h-5" style={{ color: "#EA4335" }} />
                  </div>
                  <h3 className="mt-6 text-[24px] font-medium" style={{ color: C.ink }}>We couldn't send that.</h3>
                  <p className="mt-3 text-[14px] text-[#5f6368]">A name and a valid email are required.</p>
                  <button onClick={() => setStatus("idle")} className="mt-4 text-[14px] font-medium" style={{ color: C.blue }}>Back to form <ChevronRight className="inline w-4 h-4" /></button>
                </div>
              ) : status === "success" ? (
                <div className="py-8 text-center">
                  <div className="w-12 h-12 rounded-[16px] mx-auto flex items-center justify-center" style={{ backgroundColor: "#D2E3FC" }}>
                    <Mail className="w-5 h-5" style={{ color: C.blue }} />
                  </div>
                  <h3 className="mt-6 text-[24px] font-medium" style={{ color: C.ink }}>Your message is ready.</h3>
                  <p className="mt-3 text-[14px] text-[#5f6368]">The production endpoint still needs to be connected before launch.</p>
                  <button onClick={() => setStatus("idle")} className="mt-4 text-[14px] font-medium" style={{ color: C.blue }}>Send another <ChevronRight className="inline w-4 h-4" /></button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} noValidate className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label htmlFor="contact-name" className="block text-[13px] font-medium text-[#202124] mb-2">Name</label>
                      <input id="contact-name" type="text" required value={name} onChange={(e) => setName(e.target.value)}
                        className="h-12 w-full rounded-[14px] border border-[#dadce0] bg-white px-4 text-[15px] outline-none transition-colors focus:border-[#1a73e8] focus:ring-2 focus:ring-[#1a73e8]/20 text-[#202124]" />
                    </div>
                    <div>
                      <label htmlFor="contact-email" className="block text-[13px] font-medium text-[#202124] mb-2">Email</label>
                      <input id="contact-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                        className="h-12 w-full rounded-[14px] border border-[#dadce0] bg-white px-4 text-[15px] outline-none transition-colors focus:border-[#1a73e8] focus:ring-2 focus:ring-[#1a73e8]/20 text-[#202124]" />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="contact-type" className="block text-[13px] font-medium text-[#202124] mb-2">What is this about?</label>
                    <select id="contact-type" value={type} onChange={(e) => setType(e.target.value)}
                      className="h-12 w-full rounded-[14px] border border-[#dadce0] bg-white px-4 text-[15px] outline-none focus:border-[#1a73e8] focus:ring-2 focus:ring-[#1a73e8]/20 text-[#202124]">
                      {FORM_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="contact-message" className="block text-[13px] font-medium text-[#202124] mb-2">Message</label>
                    <textarea id="contact-message" required rows={6} value={message} onChange={(e) => setMessage(e.target.value)}
                      placeholder="Tell us what you are trying to understand, solve, or build."
                      className="w-full resize-y rounded-[14px] border border-[#dadce0] bg-white px-4 py-3 text-[15px] leading-[1.6] outline-none placeholder:text-[#9aa0a6] focus:border-[#1a73e8] focus:ring-2 focus:ring-[#1a73e8]/20 text-[#202124]" />
                  </div>
                  <p className="text-[12px] text-[#5f6368]">Please do not include passwords, payment card numbers, or other sensitive information.</p>
                  <button type="submit" disabled={status === "submitting"}
                    className="inline-flex h-12 items-center justify-center rounded-full px-8 text-[14px] font-medium text-white transition-all hover:bg-[#1557b0] hover:shadow-[0_4px_12px_rgba(26,115,232,0.3)] active:scale-[0.98] disabled:opacity-70"
                    style={{ backgroundColor: C.blue }}>
                    {status === "submitting" ? "Sending…" : "Send message"} <ArrowUpRight className="ml-2 w-4 h-4" strokeWidth={1.8} />
                  </button>
                </form>
              )}
            </div>
          </div>
        </Section>

        {/* SAFETY & PRIVACY */}
        <Section bg="surface" id="trust">
          <SectionTitle eyebrow="Privacy and safety">Some conversations need<br /><span style={{ color: C.blue }}>more care.</span></SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <HighlightCard Icon={ShieldCheck} title="Safety concern">Use the safety route when you see harmful, unsafe, abusive, or otherwise concerning behavior involving Visionary.</HighlightCard>
            <HighlightCard Icon={Lock} title="Privacy concern">Contact us when you believe personal information has been handled incorrectly or your privacy rights need attention.</HighlightCard>
          </div>
          <div className="mt-8 flex flex-wrap gap-5">
            <Link to="/safety" className="inline-flex items-center gap-2 text-[14px] font-medium hover:underline" style={{ color: C.blue }}>Safety <ChevronRight className="w-4 h-4" /></Link>
            <Link to="/privacy" className="inline-flex items-center gap-2 text-[14px] font-medium hover:underline" style={{ color: C.blue }}>Privacy <ChevronRight className="w-4 h-4" /></Link>
            <Link to="/security" className="inline-flex items-center gap-2 text-[14px] font-medium hover:underline" style={{ color: C.blue }}>Security <ChevronRight className="w-4 h-4" /></Link>
          </div>
        </Section>

        {/* CTA */}
        <section className="relative overflow-hidden px-6 py-32 lg:py-36 bg-[#f8f9fa]">
          <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
            <div className="absolute rounded-full blur-3xl" style={{ width: 400, height: 400, left: "-6%", top: "-25%", background: "radial-gradient(circle, rgba(26,115,232,0.12) 0%, transparent 70%)" }} />
          </div>
          <div className="relative z-10 max-w-[800px] mx-auto text-center">
            <h2 className="text-[clamp(32px,5vw,56px)] font-medium leading-[1.05] tracking-[-0.03em]" style={{ color: C.ink }}>
              Start with the question.<br /><span style={{ color: C.blue }}>We will find the conversation.</span>
            </h2>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <a href="mailto:hello@visionary.org.in" className="inline-flex h-12 items-center gap-2 rounded-full px-8 text-[14px] font-medium text-white hover:bg-[#1557b0] transition-colors" style={{ backgroundColor: C.blue }}>
                <Mail className="w-4 h-4" /> hello@visionary.org.in
              </a>
              <Link to="/help" className="inline-flex h-12 items-center rounded-full border border-[#dadce0] bg-white px-7 text-[14px] font-medium text-[#202124] hover:bg-[#f8f9fa] transition-colors">Visit Help</Link>
            </div>
          </div>
        </section>

      </main>
      <LandingFooter variant="quiet" />
    </div>
  );
}