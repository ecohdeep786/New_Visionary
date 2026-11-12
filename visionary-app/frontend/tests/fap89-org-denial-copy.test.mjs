/** FAP-89 — organization-workspace denials tell the truth about what was denied.
 *  Before: DashboardLayout rendered one denial for every !organizationPathAllowed
 *  route: "Your {role} permission does not include this section. Ask the
 *  organization owner to review access." Personal-learning sections (learn,
 *  practice, build, ask, …) are not organization-workspace sections at all —
 *  organizationPathAllowed has no capability for them — so no org profile could
 *  ever grant them, and the copy was a false promise for every role. For a fresh
 *  org account the viewer IS the owner, so the sentence was self-referential
 *  ("Your Owner permission … Ask the organization owner"); reproduced live on
 *  merged beta ce2c391a (t09-fap89-org-denials.json: learn/practice/build/ask all
 *  rendered the incoherent Owner copy, 0 console errors). The law: the denial
 *  names the real reason — capability denials keep the owner-directed copy (they
 *  can only render for a non-owner profile, since the owner profile holds every
 *  capability); personal sections say they belong to personal learning
 *  workspaces. organizationSectionKind is the single source of truth for the
 *  kind, and organizationPathAllowed keeps its exact previous semantics. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { organizationSectionKind, organizationPathAllowed, organizationProfiles } from "../src/services/organizationPolicy.js";
import { organizationCopy } from "../src/lib/organizationCopy.js";

const owner = { profile: "owner", label: "Owner", permissions: [...organizationProfiles.owner.permissions], organizationEmail: "org@example.test" };
const analyst = { profile: "analyst", label: "Analyst", permissions: [...organizationProfiles.analyst.permissions], organizationEmail: "org@example.test" };

test("FAP-89: personal-learning routes are their own denial kind, not a capability gap", () => {
  for (const path of ["/dashboard/learn", "/dashboard/practice", "/dashboard/build", "/dashboard/ask", "/dashboard/classes", "/dashboard/class/c1", "/dashboard/guide", "/dashboard/progress", "/dashboard/career"]) {
    assert.equal(organizationSectionKind(path), "personal", `${path} is a personal-learning section`);
  }
  assert.equal(organizationSectionKind("/dashboard/people"), "capability");
  assert.equal(organizationSectionKind("/dashboard/subscription"), "capability");
  assert.equal(organizationSectionKind("/dashboard/analytics"), "capability");
  assert.equal(organizationSectionKind("/dashboard/home"), "common");
  assert.equal(organizationSectionKind("/dashboard/settings"), "common");
});

test("FAP-89: organizationPathAllowed keeps its exact previous semantics", () => {
  for (const path of ["/dashboard/people", "/dashboard/cohorts", "/dashboard/curriculum", "/dashboard/library", "/dashboard/analytics", "/dashboard/audit", "/dashboard/subscription"]) {
    assert.equal(organizationPathAllowed(owner, path), true, `the owner profile reaches ${path}`);
  }
  assert.equal(organizationPathAllowed(analyst, "/dashboard/people"), false, "a capability the profile lacks is still denied");
  assert.equal(organizationPathAllowed(analyst, "/dashboard/analytics"), true);
  for (const path of ["/dashboard/learn", "/dashboard/practice", "/dashboard/build", "/dashboard/ask"]) {
    assert.equal(organizationPathAllowed(owner, path), false, `${path} is denied for the owner (no org profile grants it)`);
    assert.equal(organizationPathAllowed(analyst, path), false, `${path} is denied for the analyst`);
  }
  assert.equal(organizationPathAllowed(owner, "/dashboard/home"), true);
});

test("FAP-89: the owner profile holds every organization capability, so the owner-directed denial can never render for the Owner", () => {
  const capabilitySections = ["people", "cohorts", "curriculum", "library", "analytics", "audit", "subscription"];
  for (const section of capabilitySections) {
    assert.equal(organizationPathAllowed(owner, `/dashboard/${section}`), true, `the owner reaches /dashboard/${section}`);
  }
});

test("FAP-89: DashboardLayout branches the denial by section kind", () => {
  const layout = readFileSync(new URL("../src/components/dashboard/DashboardLayout.jsx", import.meta.url), "utf8");
  assert.match(layout, /organizationSectionKind\(location\.pathname\)==='personal'\?<div className="v-page" lang=\{locale\}><h1 className="v-title">\{organizationCopy\(locale,'Not available in this workspace'\)\}/, "personal sections render the honest not-available copy");
  assert.match(layout, /\{organizationCopy\(locale,'This section belongs to personal learning workspaces\. It is not part of an organization workspace\.'\)\}/, "the personal denial names the real reason");
  assert.ok(layout.includes("organizationCopy(locale,'Your {role} permission does not include this section. Ask the organization owner to review access.',{role:organizationCopy(locale,policy.label)})"), "capability denials keep the owner-directed copy");
  assert.match(layout, /\{!permitted\?denial:/, "the single inline denial is replaced by the branched one");
  assert.doesNotMatch(layout, /!permitted\?<div className="v-page" lang=\{locale\}><h1 className="v-title">\{organizationCopy\(locale,'Permission required'\)\}/, "the unbranched inline denial is gone");
});

test("FAP-89: both denial copies exist in organizationCopy with en, hi and bn translations", () => {
  assert.equal(organizationCopy("en", "Not available in this workspace"), "Not available in this workspace");
  assert.equal(organizationCopy("en", "This section belongs to personal learning workspaces. It is not part of an organization workspace."), "This section belongs to personal learning workspaces. It is not part of an organization workspace.");
  for (const locale of ["hi", "bn"]) {
    assert.notEqual(organizationCopy(locale, "Not available in this workspace"), "Not available in this workspace", `${locale} headline is translated`);
    assert.notEqual(organizationCopy(locale, "This section belongs to personal learning workspaces. It is not part of an organization workspace."), "This section belongs to personal learning workspaces. It is not part of an organization workspace.", `${locale} body is translated`);
  }
});
