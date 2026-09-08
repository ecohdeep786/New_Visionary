import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  LockKeyhole,
  Eye,
  UserRound,
  Database,
  Download,
  Trash2,
  ShieldCheck,
  Share2,
  Settings2,
  Mail,
  ChevronDown,
} from "lucide-react";

import LandingNav from "@/components/landing/LandingNav";
import LandingFooter from "@/components/landing/LandingFooter";

const COLORS = {
  ink: "#121317",
  surface: "#F5F6F8",
  blue: "#4285F4",
  grey: "#5f6368",
  lightGrey: "#9AA0A6",
  mist: "#dadce0",
  chipBg: "#D2E3FC",
  white: "#ffffff",
};

const FONT_FAMILY =
  "'Google Sans Flex', 'Google Sans', system-ui, sans-serif";

const TRUST_PAGES = [
  { label: "About", to: "/about" },
  { label: "Safety", to: "/safety" },
  { label: "Privacy", to: "/privacy", active: true },
  { label: "Security", to: "/security" },
  { label: "Accessibility", to: "/accessibility" },
  { label: "Terms", to: "/terms" },
  { label: "Cookies", to: "/cookies" },
];

function IconTile({ Icon, size = 56 }) {
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-[16px] border bg-white"
      style={{
        width: size,
        height: size,
        borderColor: COLORS.mist,
        color: COLORS.blue,
      }}
    >
      <Icon className="h-6 w-6" strokeWidth={1.8} />
    </span>
  );
}



const FAQ = [
  {
    q: "What information does Visionary keep about me?",
    a:
      "Depending on how you use Visionary, this can include account details, the questions and content you provide, learning activity, progress, projects, and information needed to provide the service.",
  },
  {
    q: "Why does Visionary use my information?",
    a:
      "We use information to provide the product, keep your learning connected, improve the service, maintain security, and communicate with you when needed. The exact uses should always match the published Privacy Policy.",
  },
  {
    q: "Who can see my learning information?",
    a:
      "That depends on your role and the relationships connected to your Visionary account. Student, teacher, parent, professional, and organization views should only expose the information that the product and its permissions allow.",
  },
  {
    q: "Can I download my information?",
    a:
      "Where data export is available, you should be able to request or download the information associated with your account. The final production policy should describe the exact process and available formats.",
  },
  {
    q: "Can I delete my account?",
    a:
      "Yes, account deletion should have a clear path. The Privacy Policy should explain what is deleted, what may need to be retained, and how long any required retention lasts.",
  },
];

function InfoCard({ Icon, title, text }) {
  return (
    <article
      className="rounded-[24px] border bg-white p-7"
      style={{ borderColor: COLORS.mist }}
    >
      <IconTile Icon={Icon} />
      <h3
        className="mt-7 text-[20px] font-medium"
        style={{ color: COLORS.ink }}
      >
        {title}
      </h3>
      <p
        className="mt-3 text-[14.5px] leading-[1.65]"
        style={{ color: COLORS.grey }}
      >
        {text}
      </p>
    </article>
  );
}

function PurposeRow({ number, Icon, title, text }) {
  return (
    <article
      className="grid gap-5 border-b py-7 md:grid-cols-[72px_60px_1fr]"
      style={{ borderColor: COLORS.mist }}
    >
      <div
        className="text-[13px] font-medium"
        style={{ color: COLORS.blue }}
      >
        {number}
      </div>
      <Icon
        className="h-6 w-6"
        style={{ color: COLORS.blue }}
        strokeWidth={1.7}
      />
      <div>
        <h3
          className="text-[22px] font-medium"
          style={{ color: COLORS.ink }}
        >
          {title}
        </h3>
        <p
          className="mt-2 max-w-[700px] text-[15px] leading-[1.65]"
          style={{ color: COLORS.grey }}
        >
          {text}
        </p>
      </div>
    </article>
  );
}

function RelationshipRow({ label, value }) {
  return (
    <div
      className="flex flex-col gap-1 rounded-[16px] border px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
      style={{ borderColor: COLORS.mist }}
    >
      <span
        className="text-[13px] font-medium"
        style={{ color: COLORS.ink }}
      >
        {label}
      </span>
      <span
        className="text-[13px]"
        style={{ color: COLORS.grey }}
      >
        {value}
      </span>
    </div>
  );
}

function ActionCard({ Icon, title, text }) {
  return (
    <article
      className="rounded-[24px] border bg-white p-7"
      style={{ borderColor: COLORS.mist }}
    >
      <IconTile Icon={Icon} />
      <h3
        className="mt-7 text-[20px] font-medium"
        style={{ color: COLORS.ink }}
      >
        {title}
      </h3>
      <p
        className="mt-3 text-[14.5px] leading-[1.65]"
        style={{ color: COLORS.grey }}
      >
        {text}
      </p>
    </article>
  );
}

export default function PrivacyPage() {
  const [openFaq, setOpenFaq] = useState(null);

  return (
    <div
      className="min-h-screen bg-white"
      style={{ fontFamily: FONT_FAMILY }}
    >
      <LandingNav />

      <main id="main">
        {/* 01 — HERO */}
        <section className="relative overflow-hidden bg-white px-6 pb-24 pt-32 lg:pb-28 lg:pt-40">
         

          <div className="mx-auto mt-16 max-w-[1050px] text-center">
            <p
              className="text-[12px] font-normal uppercase tracking-[0.43px]"
              style={{ color: COLORS.grey }}
            >
              PRIVACY
            </p>

            <h1
              className="mx-auto mt-5 max-w-[980px] text-[clamp(42px,6vw,82px)] font-medium leading-[1.03] tracking-[-0.015em]"
              style={{ color: COLORS.ink }}
            >
              Your information.
              <br />
              <span style={{ color: COLORS.blue }}>
                Your control.
              </span>
            </h1>

            <p
              className="mx-auto mt-6 max-w-[700px] text-[17.5px] leading-[25px]"
              style={{ color: COLORS.grey }}
            >
              Your learning is personal. This page explains what Visionary
              handles, why we use it, and the choices you have.
            </p>
          </div>

          {/* Minimal privacy illustration */}
          <div className="mx-auto mt-16 max-w-[760px]">
            <div
              className="relative flex aspect-[16/8] items-center justify-center overflow-hidden rounded-[32px] border"
              style={{
                borderColor: COLORS.mist,
                backgroundColor: COLORS.surface,
              }}
            >
              <div className="absolute h-[330px] w-[330px] rounded-full bg-[#EAF2FF]" />

              <div className="relative z-10 flex flex-col items-center">
                <div
                  className="flex h-24 w-24 items-center justify-center rounded-[28px] bg-white shadow-[0_18px_55px_rgba(18,19,23,0.08)]"
                  style={{ color: COLORS.blue }}
                >
                  <LockKeyhole
                    className="h-12 w-12"
                    strokeWidth={1.55}
                  />
                </div>

                <p
                  className="mt-6 text-[14px]"
                  style={{ color: COLORS.grey }}
                >
                  Your learning stays personal.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 02 — THE SIMPLE IDEA */}
        <section className="bg-[#F5F6F8] px-6 py-24 lg:py-32">
          <div className="mx-auto max-w-[1100px]">
            <div className="max-w-[780px]">
              <p
                className="text-[12px] uppercase tracking-[0.43px]"
                style={{ color: COLORS.grey }}
              >
                AT A GLANCE
              </p>

              <h2
                className="mt-4 text-[clamp(34px,4.5vw,64px)] font-medium leading-[1.06]"
                style={{ color: COLORS.ink }}
              >
                We collect what we need
                <br />
                <span style={{ color: COLORS.blue }}>
                  to provide Visionary.
                </span>
              </h2>

              <p
                className="mt-5 max-w-[720px] text-[16px] leading-[1.7]"
                style={{ color: COLORS.grey }}
              >
                The information Visionary handles depends on what you do with
                the product. An account needs account information. Learning
                features need the context you provide. Progress and continuity
                depend on what you have already done.
              </p>
            </div>

            <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              <InfoCard
                Icon={UserRound}
                title="Your account"
                text="Name, email, role, and account settings."
              />
              <InfoCard
                Icon={Database}
                title="Your learning"
                text="Questions, sessions, progress, projects, and other content you provide."
              />
              <InfoCard
                Icon={Settings2}
                title="Your device"
                text="Information needed to keep the product working on the device you use."
              />
              <InfoCard
                Icon={Eye}
                title="Your choices"
                text="Settings and permissions that affect how your information is used."
              />
            </div>
          </div>
        </section>

        {/* 03 — WHY WE USE INFORMATION */}
        <section className="bg-white px-6 py-24 lg:py-36">
          <div className="mx-auto max-w-[1100px]">
            <div className="text-center">
              <p
                className="text-[12px] uppercase tracking-[0.43px]"
                style={{ color: COLORS.grey }}
              >
                WHY WE USE IT
              </p>

              <h2
                className="mx-auto mt-4 max-w-[820px] text-[clamp(34px,4.5vw,64px)] font-medium leading-[1.06]"
                style={{ color: COLORS.ink }}
              >
                Information should have
                <br />
                <span style={{ color: COLORS.blue }}>
                  a clear purpose.
                </span>
              </h2>
            </div>

            <div className="mt-16 space-y-4">
              <PurposeRow
                number="01"
                Icon={ShieldCheck}
                title="Provide Visionary"
                text="Use the information needed to provide the features and experiences you choose to use."
              />
              <PurposeRow
                number="02"
                Icon={Eye}
                title="Keep your learning connected"
                text="Use relevant context so your experience can continue from what came before."
              />
              <PurposeRow
                number="03"
                Icon={Settings2}
                title="Maintain and improve the service"
                text="Use appropriate information to fix problems, understand how the product is working, and improve it."
              />
              <PurposeRow
                number="04"
                Icon={ShieldCheck}
                title="Protect people and the service"
                text="Use information where necessary to help prevent abuse, fraud, security problems, and technical issues."
              />
              <PurposeRow
                number="05"
                Icon={Mail}
                title="Communicate with you"
                text="Use your contact information to respond to requests, account notices, and important service updates."
              />
            </div>
          </div>
        </section>

        {/* 04 — SHARING */}
        <section className="bg-[#F5F6F8] px-6 py-24 lg:py-36">
          <div className="mx-auto grid max-w-[1120px] items-center gap-16 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p
                className="text-[12px] uppercase tracking-[0.43px]"
                style={{ color: COLORS.grey }}
              >
                SHARING
              </p>

              <h2
                className="mt-4 max-w-[620px] text-[clamp(34px,4.5vw,62px)] font-medium leading-[1.06]"
                style={{ color: COLORS.ink }}
              >
                Your information
                <br />
                shouldn't travel
                <br />
                <span style={{ color: COLORS.blue }}>
                  without a reason.
                </span>
              </h2>

              <p
                className="mt-6 max-w-[590px] text-[16px] leading-[1.7]"
                style={{ color: COLORS.grey }}
              >
                Visionary may need to work with service providers that help
                operate the product. Where information is shared, the purpose,
                scope, and applicable controls should be described clearly in
                this policy.
              </p>
            </div>

            <div className="rounded-[30px] border bg-white p-7 lg:p-8"
              style={{ borderColor: COLORS.mist }}
            >
              <div className="flex items-start gap-4">
                <IconTile Icon={Share2} />

                <div>
                  <p
                    className="text-[12px] uppercase tracking-[0.43px]"
                    style={{ color: COLORS.grey }}
                  >
                    WHO CAN SEE WHAT
                  </p>

                  <h3
                    className="mt-1 text-[23px] font-medium"
                    style={{ color: COLORS.ink }}
                  >
                    It depends on the relationship.
                  </h3>
                </div>
              </div>

              <div className="mt-8 space-y-3">
                <RelationshipRow
                  label="Student"
                  value="Their own learning"
                />
                <RelationshipRow
                  label="Teacher"
                  value="Class information they are allowed to see"
                />
                <RelationshipRow
                  label="Parent"
                  value="Relevant information shared through the product"
                />
                <RelationshipRow
                  label="Professional"
                  value="Their own work and learning"
                />
                <RelationshipRow
                  label="Organization"
                  value="Information permitted by organization controls"
                />
              </div>
            </div>
          </div>
        </section>

        {/* 05 — YOUR CONTROLS */}
        <section className="bg-white px-6 py-24 lg:py-36">
          <div className="mx-auto max-w-[1100px]">
            <div className="max-w-[760px]">
              <p
                className="text-[12px] uppercase tracking-[0.43px]"
                style={{ color: COLORS.grey }}
              >
                YOUR CONTROLS
              </p>

              <h2
                className="mt-4 text-[clamp(34px,4.5vw,62px)] font-medium leading-[1.06]"
                style={{ color: COLORS.ink }}
              >
                Know what you can do
                <br />
                <span style={{ color: COLORS.blue }}>
                  with your information.
                </span>
              </h2>

              <p
                className="mt-6 max-w-[680px] text-[16px] leading-[1.7]"
                style={{ color: COLORS.grey }}
              >
                Privacy is easier to trust when the choices are easy to find.
                Visionary should give you clear ways to manage your account and
                the information connected to it.
              </p>
            </div>

            <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              <ActionCard
                Icon={Eye}
                title="View"
                text="See the information connected to your account."
              />
              <ActionCard
                Icon={Settings2}
                title="Manage"
                text="Update settings and permissions where available."
              />
              <ActionCard
                Icon={Download}
                title="Export"
                text="Download supported account information where available."
              />
              <ActionCard
                Icon={Trash2}
                title="Delete"
                text="Request account deletion and see what happens next."
              />
            </div>
          </div>
        </section>

        {/* 06 — SECURITY */}
        <section className="bg-[#F5F6F8] px-6 py-24 lg:py-32">
          <div className="mx-auto max-w-[1000px] text-center">
            <p
              className="text-[12px] uppercase tracking-[0.43px]"
              style={{ color: COLORS.grey }}
            >
              SECURITY
            </p>

            <h2
              className="mt-4 text-[clamp(34px,4.5vw,62px)] font-medium leading-[1.06]"
              style={{ color: COLORS.ink }}
            >
              Privacy needs
              <br />
              <span style={{ color: COLORS.blue }}>
                security behind it.
              </span>
            </h2>

            <p
              className="mx-auto mt-5 max-w-[680px] text-[16px] leading-[1.7]"
              style={{ color: COLORS.grey }}
            >
              Visionary uses technical and organizational measures to protect
              information against unauthorized access, loss, misuse, or
              disclosure. The Security page describes the specific protections
              that are actually in place.
            </p>

            <div className="mt-10">
              <Link
                to="/security"
                className="inline-flex items-center rounded-full border bg-white px-6 py-3.5 text-[14px] font-medium transition-colors hover:bg-[#F5F6F8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]"
                style={{
                  borderColor: COLORS.mist,
                  color: COLORS.ink,
                }}
              >
                See security
              </Link>
            </div>
          </div>
        </section>

        {/* 07 — RETENTION */}
        <section className="bg-white px-6 py-24 lg:py-36">
          <div className="mx-auto grid max-w-[1080px] items-center gap-16 lg:grid-cols-[1fr_0.9fr]">
            <div>
              <p
                className="text-[12px] uppercase tracking-[0.43px]"
                style={{ color: COLORS.grey }}
              >
                RETENTION
              </p>

              <h2
                className="mt-4 text-[clamp(34px,4.5vw,60px)] font-medium leading-[1.06]"
                style={{ color: COLORS.ink }}
              >
                Keep what you need.
                <br />
                <span style={{ color: COLORS.blue }}>
                  Remove what you don't.
                </span>
              </h2>

              <p
                className="mt-6 max-w-[600px] text-[16px] leading-[1.7]"
                style={{ color: COLORS.grey }}
              >
                The time information stays in Visionary should depend on why it
                is needed. The final Privacy Policy should state the retention
                periods or the criteria used to determine them.
              </p>
            </div>

            <div
              className="rounded-[28px] border p-7"
              style={{
                borderColor: COLORS.mist,
                backgroundColor: COLORS.surface,
              }}
            >
              <div className="flex items-center gap-4">
                <IconTile Icon={Database} />

                <div>
                  <p
                    className="text-[12px] uppercase tracking-[0.43px]"
                    style={{ color: COLORS.grey }}
                  >
                    YOUR DATA
                  </p>

                  <h3
                    className="mt-1 text-[21px] font-medium"
                    style={{ color: COLORS.ink }}
                  >
                    Purpose matters.
                  </h3>
                </div>
              </div>

              <div className="mt-7 space-y-3">
                {[
                  "Provide the service",
                  "Keep your learning connected",
                  "Maintain security",
                  "Meet legal obligations",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 rounded-[16px] border bg-white px-4 py-3.5"
                    style={{ borderColor: COLORS.mist }}
                  >
                    <ShieldCheck
                      className="h-4 w-4"
                      style={{ color: COLORS.blue }}
                      strokeWidth={1.8}
                    />
                    <span
                      className="text-[14px]"
                      style={{ color: COLORS.ink }}
                    >
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 08 — STUDENT / CHILD DATA NOTE */}
        <section className="bg-[#F5F6F8] px-6 py-24 lg:py-32">
          <div className="mx-auto max-w-[1000px]">
            <div className="rounded-[30px] border bg-white p-8 lg:p-10"
              style={{ borderColor: COLORS.mist }}
            >
              <div className="flex flex-col gap-8 md:flex-row">
                <IconTile
                  Icon={ShieldCheck}
                  size={64}
                />

                <div>
                  <p
                    className="text-[12px] uppercase tracking-[0.43px]"
                    style={{ color: COLORS.grey }}
                  >
                    STUDENTS & YOUNGER LEARNERS
                  </p>

                  <h2
                    className="mt-3 text-[clamp(28px,3.5vw,44px)] font-medium leading-[1.08]"
                    style={{ color: COLORS.ink }}
                  >
                    Extra care for
                    <span style={{ color: COLORS.blue }}>
                      {" "}younger learners.
                    </span>
                  </h2>

                  <p
                    className="mt-4 max-w-[720px] text-[15.5px] leading-[1.7]"
                    style={{ color: COLORS.grey }}
                  >
                    Visionary may be used by students at different ages and in
                    different settings. The final policy should clearly explain
                    how information about younger learners is handled, what
                    parents or guardians can do where applicable, and which
                    controls apply.
                  </p>

                  <div className="mt-7">
                    <Link
                      to="/safety"
                      className="inline-flex items-center rounded-full border px-5 py-3 text-[14px] font-medium transition-colors hover:bg-[#F5F6F8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]"
                      style={{
                        borderColor: COLORS.mist,
                        color: COLORS.ink,
                      }}
                    >
                      See safety
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 09 — FAQ */}
        <section className="bg-white px-6 py-24 lg:py-32">
          <div className="mx-auto max-w-[900px]">
            <div className="text-center">
              <p
                className="text-[12px] uppercase tracking-[0.43px]"
                style={{ color: COLORS.grey }}
              >
                QUESTIONS
              </p>

              <h2
                className="mt-4 text-[clamp(34px,4.3vw,58px)] font-medium leading-[1.06]"
                style={{ color: COLORS.ink }}
              >
                Privacy,
                <br />
                <span style={{ color: COLORS.blue }}>
                  clearly explained.
                </span>
              </h2>
            </div>

            <div
              className="mt-14 border-t"
              style={{ borderColor: COLORS.mist }}
            >
              {FAQ.map((item, index) => (
                <div
                  key={item.q}
                  className="border-b"
                  style={{ borderColor: COLORS.mist }}
                >
                  <button
                    type="button"
                    aria-expanded={openFaq === index}
                    onClick={() =>
                      setOpenFaq(
                        openFaq === index ? null : index
                      )
                    }
                    className="flex w-full items-center justify-between gap-8 py-6 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]"
                  >
                    <span
                      className="text-[17px] leading-[1.45]"
                      style={{ color: COLORS.ink }}
                    >
                      {item.q}
                    </span>

                    <ChevronDown
                      className={[
                        "h-5 w-5 shrink-0 transition-transform duration-300",
                        openFaq === index ? "rotate-180" : "",
                      ].join(" ")}
                      style={{ color: COLORS.grey }}
                      strokeWidth={1.8}
                    />
                  </button>

                  <div
                    className={[
                      "grid transition-all duration-300",
                      openFaq === index
                        ? "grid-rows-[1fr] opacity-100"
                        : "grid-rows-[0fr] opacity-0",
                    ].join(" ")}
                  >
                    <div className="overflow-hidden">
                      <p
                        className="pb-6 pr-10 text-[15px] leading-[1.7]"
                        style={{ color: COLORS.grey }}
                      >
                        {item.a}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 10 — FINAL CTA */}
        <section className="bg-[#F5F6F8] px-6 py-24 lg:py-36">
          <div className="mx-auto max-w-[900px] text-center">
            <p
              className="text-[12px] uppercase tracking-[0.43px]"
              style={{ color: COLORS.grey }}
            >
              PRIVACY
            </p>

            <h2
              className="mt-4 text-[clamp(38px,5vw,70px)] font-medium leading-[1.05]"
              style={{ color: COLORS.ink }}
            >
              Your information
              <br />
              <span style={{ color: COLORS.blue }}>
                stays yours to manage.
              </span>
            </h2>

            <p
              className="mx-auto mt-5 max-w-[650px] text-[16px] leading-[1.7]"
              style={{ color: COLORS.grey }}
            >
              Read the full policy, understand your choices, or explore how
              Visionary approaches safety and security.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                to="/safety"
                className="inline-flex items-center rounded-full border bg-white px-7 py-3.5 text-[14px] font-medium transition-colors hover:bg-[#F5F6F8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]"
                style={{
                  borderColor: COLORS.mist,
                  color: COLORS.ink,
                }}
              >
                See safety
              </Link>

              <Link
                to="/security"
                className="inline-flex items-center rounded-full border bg-white px-7 py-3.5 text-[14px] font-medium transition-colors hover:bg-[#F5F6F8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]"
                style={{
                  borderColor: COLORS.mist,
                  color: COLORS.ink,
                }}
              >
                See security
              </Link>
            </div>
          </div>
        </section>
      </main>

      <LandingFooter variant="quiet" />
    </div>
  );
}