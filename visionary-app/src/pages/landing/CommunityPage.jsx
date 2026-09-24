import { ArrowRight, ArrowUpRight, BookOpen, MessageCircle, ShieldCheck, UsersRound } from "lucide-react";
import { Link } from "react-router-dom";
import PageHeading from "@/components/landing/PageHeading";
import SpotIllustration from "@/components/landing/SpotIllustration";
import LandingNav from "@/components/landing/LandingNav";
import LandingFooter from "@/components/landing/LandingFooter";

const PATHS = [
  {
    Icon: BookOpen,
    label: "Learn at your own pace",
    title: "Start with a question.",
    description: "Explore learning activities, practice an idea, and try applying it in a project. You can begin without joining a public group.",
    link: "/register",
    linkLabel: "Get started with Visionary",
  },
  {
    Icon: UsersRound,
    label: "Optional connections",
    title: "Choose who you learn with.",
    description: "The workspace preview supports class, family, and collaborator connections. Requests require acceptance; connected people do not automatically see private questions or project notes.",
    link: "/register",
    linkLabel: "Explore the workspace",
  },
  {
    Icon: MessageCircle,
    label: "Stay in the loop",
    title: "Follow what is taking shape.",
    description: "Read product updates and the questions Visionary is exploring. The updates page is informational; it is not a discussion board or event calendar.",
    link: "/updates",
    linkLabel: "Read product updates",
  },
];

export default function CommunityPage() {
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Google Sans Flex', 'Google Sans', system-ui, sans-serif" }}>
      <LandingNav />
      <main id="main">
        <PageHeading
          page="Community"
          eyebrow="Community at Visionary"
          h1={<>Learning is personal. <span className="text-[#4285F4]">Connection is a choice.</span></>}
          dek="A clearer guide to learning together—and the community features available today."
        >
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <a href="#ways-to-connect" className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#4285F4] px-6 text-[15px] font-medium text-white transition-colors hover:bg-[#3367d6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2">
              Explore ways to connect <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>
            <Link to="/safety" className="inline-flex h-12 items-center gap-2 rounded-full px-5 text-[15px] font-medium text-[#121317] hover:bg-[#f8f9fa] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]">
              Community safety <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </PageHeading>

        <section className="border-y border-[#dadce0]">
          <div className="mx-auto grid max-w-[1240px] items-center gap-8 px-6 py-14 sm:px-8 sm:py-20 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16 lg:px-10">
            <div className="max-w-[620px]">
              <p className="text-[12px] font-medium uppercase tracking-[0.16em] text-[#5f6368]">Learning, with room to choose</p>
              <h2 className="mt-4 text-[30px] font-normal leading-[1.15] tracking-[-0.03em] text-[#121317] sm:text-[42px]">Learning together should begin with clarity.</h2>
              <p className="mt-5 text-[16px] leading-[1.8] text-[#5f6368]">
                Visionary’s workspace preview includes individual learning and optional connections. It does not currently offer a public community forum, open discussion threads, an events program, or contributor enrollment.
              </p>
            </div>
            <div className="overflow-hidden rounded-[24px] border border-[#dadce0]">
              <SpotIllustration subject="community" className="aspect-[4/3] w-full" title="Illustration for learning and community" />
            </div>
          </div>
        </section>

        <section id="ways-to-connect" className="scroll-mt-24 px-6 py-16 sm:px-8 sm:py-20 lg:px-10 lg:py-24">
          <div className="mx-auto max-w-[1240px]">
            <div className="max-w-[680px]">
              <p className="text-[12px] font-medium uppercase tracking-[0.16em] text-[#5f6368]">Ways to take part</p>
              <h2 className="mt-3 text-[32px] font-normal leading-[1.15] tracking-[-0.03em] text-[#121317] sm:text-[42px]">A few useful paths, without the noise.</h2>
              <p className="mt-4 text-[16px] leading-[1.75] text-[#5f6368]">Choose the experience that fits. Each link leads to a current product page—not a promised event, forum, or support program.</p>
            </div>
            <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {PATHS.map(({ Icon, label, title, description, link, linkLabel }) => (
                <article key={label} className="flex min-h-[300px] flex-col rounded-[22px] border border-[#dadce0] bg-white p-6 sm:p-7">
                  <span className="flex h-12 w-12 items-center justify-center rounded-[16px] border border-[#dadce0] text-[#4285F4]">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <p className="mt-6 text-[12px] font-medium uppercase tracking-[0.14em] text-[#5f6368]">{label}</p>
                  <h3 className="mt-2 text-[21px] font-normal leading-[1.35] text-[#121317]">{title}</h3>
                  <p className="mt-3 flex-1 text-[15px] leading-[1.7] text-[#5f6368]">{description}</p>
                  <Link to={link} className="mt-6 inline-flex items-center gap-2 self-start text-[14px] font-medium text-[#1967d2] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]">
                    {linkLabel} <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-[#dadce0] bg-[#f8f9fa] px-6 py-16 sm:px-8 sm:py-20 lg:px-10 lg:py-24">
          <div className="mx-auto grid max-w-[1240px] gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
            <div>
              <p className="text-[12px] font-medium uppercase tracking-[0.16em] text-[#5f6368]">Connections in the preview</p>
              <h2 className="mt-3 text-[32px] font-normal leading-[1.15] tracking-[-0.03em] text-[#121317] sm:text-[40px]">Make the boundaries visible.</h2>
              <p className="mt-4 text-[15px] leading-[1.75] text-[#5f6368]">Requests are optional and need acceptance. Classroom and family relationships have separate sharing rules.</p>
              <Link to="/safety" className="mt-6 inline-flex items-center gap-2 text-[14px] font-medium text-[#1967d2] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]">
                Read Visionary’s safety information <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <article className="rounded-[20px] border border-[#dadce0] bg-white p-6">
                <h3 className="text-[17px] font-medium text-[#121317]">Connection is not automatic access.</h3>
                <p className="mt-3 text-[14px] leading-[1.7] text-[#5f6368]">Organization membership does not expose private questions or project notes. Family progress requires separate permission.</p>
              </article>
              <article className="rounded-[20px] border border-[#dadce0] bg-white p-6">
                <h3 className="text-[17px] font-medium text-[#121317]">The preview has limits.</h3>
                <p className="mt-3 text-[14px] leading-[1.7] text-[#5f6368]">Connections are local to accounts in this browser. Cloud invitations, cross-device sync, and a public discussion space are not active here.</p>
              </article>
            </div>
          </div>
        </section>

        <section className="px-6 py-16 sm:px-8 sm:py-20 lg:px-10 lg:py-24">
          <div className="mx-auto flex max-w-[1240px] flex-col gap-8 rounded-[26px] border border-[#dadce0] p-7 sm:p-10 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-[650px]">
              <p className="text-[12px] font-medium uppercase tracking-[0.16em] text-[#5f6368]">Keep exploring</p>
              <h2 className="mt-3 text-[30px] font-normal leading-[1.2] tracking-[-0.025em] text-[#121317] sm:text-[36px]">Choose a learning path that works for you.</h2>
              <p className="mt-4 text-[15px] leading-[1.7] text-[#5f6368]">Start with Visionary’s learning workspace, or contact us with a question. There is no public community sign-up to join today.</p>
            </div>
            <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
              <Link to="/register" className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#4285F4] px-6 text-[14px] font-medium text-white hover:bg-[#3367d6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2">Get started <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
              <Link to="/contact" className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-[#dadce0] px-6 text-[14px] font-medium text-[#121317] hover:bg-[#f8f9fa] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]">Contact us <ArrowUpRight className="h-4 w-4" aria-hidden="true" /></Link>
            </div>
          </div>
        </section>
      </main>
      <LandingFooter variant="quiet" />
    </div>
  );
}