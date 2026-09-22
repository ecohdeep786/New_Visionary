// Security: add "Sync devices" section (master-order requirement).
// Community: de-duplicate the repeated sentence.
import { readFileSync, writeFileSync } from "node:fs";

/* ── SECURITY ── */
{
  const f = "src/pages/landing/SecurityPage.jsx";
  let s = readFileSync(f, "utf8");
  if (!s.includes("sync-devices")) {
    // 1. contents entry
    const arrAnchor = '  { id: "commitments", number: "08", title: "Our security commitments", summary: "The principles Visionary follows when protecting the service." },';
    if (!s.includes(arrAnchor)) { console.log("SEC ARR-MISS"); process.exit(1); }
    s = s.replace(arrAnchor, arrAnchor + '\n  { id: "sync-devices", number: "09", title: "Sync devices", summary: "Sign in once with your Sync Encrypted ID and carry Visionary across your devices." },');
    // 2. body section after the commitments section's close
    const end = s.indexOf("</section>", s.indexOf('id="commitments"'));
    if (end === -1) { console.log("SEC END-MISS"); process.exit(1); }
    const insertAt = end + "</section>".length;
    const block = [
      "",
      "",
      "                    {/* 09 · SYNC DEVICES — the master-order product requirement */}",
      "                    <section id=\"sync-devices\" className=\"scroll-mt-24 py-14 sm:py-16\">",
      "                      <SectionHeading number=\"09\" title=\"Sync devices\" />",
      "                      <p className=\"max-w-[760px] text-[16px] leading-[1.78]\" style={{ color: C.slate }}>",
      "                        Sign in with your Sync Encrypted ID and Visionary carries your learning to every device you use — your questions, progress, and memory arrive as they were, and only you can open them.",
      "                      </p>",
      "                      <div className=\"mt-6 space-y-4\">",
      "                        <div className=\"rounded-[18px] border p-5 sm:p-6\" style={{ borderColor: C.border }}>",
      "                          <div className=\"flex gap-4\">",
      "                            <Lock className=\"mt-0.5 h-5 w-5 shrink-0\" strokeWidth={1.7} style={{ color: C.blue }} />",
      "                            <div>",
      "                              <h3 className=\"text-[17px] font-normal\" style={{ color: C.ink }}>Sign in with your Sync Encrypted ID</h3>",
      "                              <p className=\"mt-2 text-[14px] leading-[1.7]\" style={{ color: C.slate }}>One encrypted identity unlocks Visionary on a new device — the encryption stays with your account, not with the device.</p>",
      "                            </div>",
      "                          </div>",
      "                        </div>",
      "                      </div>",
      "                      <div className=\"mt-4 space-y-4\">",
      "                        <div className=\"rounded-[18px] border p-5 sm:p-6\" style={{ borderColor: C.border }}>",
      "                          <div className=\"flex gap-4\">",
      "                            <Database className=\"mt-0.5 h-5 w-5 shrink-0\" strokeWidth={1.7} style={{ color: C.blue }} />",
      "                            <div>",
      "                              <h3 className=\"text-[17px] font-normal\" style={{ color: C.ink }}>Your learning follows you</h3>",
      "                              <p className=\"mt-2 text-[14px] leading-[1.7]\" style={{ color: C.slate }}>Progress, notes, and memory sync across phone, tablet, and laptop — pick up exactly where you stopped.</p>",
      "                            </div>",
      "                          </div>",
      "                        </div>",
      "                      </div>",
      "                      <div className=\"mt-4 space-y-4\">",
      "                        <div className=\"rounded-[18px] border p-5 sm:p-6\" style={{ borderColor: C.border }}>",
      "                          <div className=\"flex gap-4\">",
      "                            <Eye className=\"mt-0.5 h-5 w-5 shrink-0\" strokeWidth={1.7} style={{ color: C.blue }} />",
      "                            <div>",
      "                              <h3 className=\"text-[17px] font-normal\" style={{ color: C.ink }}>You see every device</h3>",
      "                              <p className=\"mt-2 text-[14px] leading-[1.7]\" style={{ color: C.slate }}>Review the devices signed in to your account and remove any of them, at any time, from your settings.</p>",
      "                            </div>",
      "                          </div>",
      "                        </div>",
      "                      </div>",
      "                      <Link to=\"/privacy\" className=\"mt-6 inline-flex items-center gap-2 text-[15px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]\" style={{ color: C.blue }}>",
      "                        How privacy works with sync",
      "                        <ChevronRight className=\"h-4 w-4\" strokeWidth={1.8} />",
      "                      </Link>",
      "                    </section>",
    ].join("\n");
    s = s.slice(0, insertAt) + block + s.slice(insertAt);
    writeFileSync(f, s);
    console.log("security sync section added");
  } else console.log("security already");
}

/* ── COMMUNITY ── */
{
  const f = "src/pages/landing/CommunityPage.jsx";
  let s = readFileSync(f, "utf8");
  const dup = "When someone explains a concept in their own words, in their own language, understanding spreads further than any textbook can reach.";
  const first = s.indexOf(dup);
  const second = s.indexOf(dup, first + 1);
  if (second !== -1) {
    // replace the LATER occurrence (the AboutContentSection body) with a distinct line
    s = s.slice(0, second) + "The community turns one person\u2019s breakthrough into everyone\u2019s starting point." + s.slice(second + dup.length);
    writeFileSync(f, s);
    console.log("community de-duplicated");
  } else console.log("community: no duplicate found");
}
