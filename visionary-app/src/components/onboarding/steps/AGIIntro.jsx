import { Sparkles, ArrowRight } from "lucide-react";

export default function AGIIntro({ data, userName, onComplete }) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-white p-6">
      <section className="w-full max-w-lg rounded-3xl border border-[#dadce0] bg-white p-8 sm:p-10">
        <Sparkles className="mb-6 h-8 w-8 text-[#4285F4]" />
        <p className="text-sm text-[#5f6368]">Visionary PA</p>
        <h1 className="mt-2 text-3xl font-medium text-[#121317]">Your space is ready, {userName || "there"}.</h1>
        <p className="mt-4 text-sm leading-7 text-[#5f6368]">
          Your {data.identity} profile is saved. Start with an idea you want to understand,
          a project you want to build, or people you want to learn with.
        </p>
        <p className="mt-4 rounded-xl bg-[#ffffff] p-4 text-xs leading-6 text-[#5f6368]">
          This is a local preview. AI lessons, cloud sync, and billing are not connected yet.
          Your profile and workspace changes are saved in this browser.
        </p>
        <button
          onClick={onComplete}
          className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#4285F4] px-6 py-3 text-sm font-medium text-white hover:bg-[#3367d6]"
        >
          Open my workspace <ArrowRight className="h-4 w-4" />
        </button>
      </section>
    </main>
  );
}
