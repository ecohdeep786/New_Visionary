/** FAP-87 — every role-restricted workspace deep link keeps its URL and explains itself.
 *  Before: DashboardLayout's access gate rendered the FAP-75 self-explaining notice only
 *  for organization areas (people/cohorts/curriculum/analytics) and silently rewrote the
 *  address bar to /dashboard/home for every other restricted section — verified live at
 *  beta 640cad1a: student deep-linking /dashboard/prepare, /learners, /insights, /child,
 *  /reports, /career (and the mirror cases for the other four identities) landed on
 *  "Welcome back" with no explanation. The law (extended from FAP-75): a restricted
 *  deep link keeps its URL and renders an area-specific self-explanation — the owning
 *  role's localized area heading, the same boundary sentence shape, the visitor's own
 *  working paths and the return action — while the Navigate fallback survives only for
 *  sections outside every map (the unknown-section safety net). */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const navigation = readFileSync(new URL("../src/lib/dashboardNavigation.js", import.meta.url), "utf8");
const layout = readFileSync(new URL("../src/components/dashboard/DashboardLayout.jsx", import.meta.url), "utf8");
const page = readFileSync(new URL("../src/pages/dashboard/RoleAreaUnavailable.jsx", import.meta.url), "utf8");

test("FAP-87: the section owner map covers exactly the restricted sections outside the organization areas", () => {
  assert.match(navigation, /const areaOwners=\{prepare:'teacher',learners:'teacher',insights:'teacher',growth:'teacher',library:'teacher',classes:'teacher',child:'parent',reports:'parent',career:'professional',audit:'organization',class:'teacher'\};/, "the map gains the Classes list (FAP-90): organization and family identities get the explanation instead of the rewrite");
  assert.match(navigation, /export function dashboardAreaOwner\(section\)\{return areaOwners\[section\]\|\|null;\}/);
});

test("FAP-87: the layout gate explains every owned section and keeps the fallback only for unmapped ones", () => {
  assert.match(layout, /dashboardAreaOwner/, "the layout consumes the owner map");
  const guard = layout.slice(layout.indexOf("!canAccessDashboardPath"), layout.indexOf("!canAccessDashboardPath") + 420);
  assert.match(guard, /isOrganizationArea\(section\) \|\| dashboardAreaOwner\(section\)/, "organization areas and owned sections both render the notice");
  assert.match(guard, /<RoleAreaUnavailable \/>/, "the notice page renders at the requested URL");
  const afterNotice = guard.slice(guard.indexOf("<RoleAreaUnavailable />"));
  assert.match(afterNotice, /return <Navigate to="\/dashboard\/home" replace \/>;/, "unmapped sections keep the existing fallback");
});

test("FAP-87: the notice resolves the area from the owning role's navigation", () => {
  assert.match(page, /const owner = dashboardAreaOwner\(section\) \|\| \(isOrganizationArea\(section\) \? "organization" : null\);/, "organization areas stay organization-owned; other sections come from the map");
  assert.match(page, /if \(!owner\) return null;/, "unmapped sections render nothing (the layout fallback owns them)");
  assert.match(page, /const area = \[\.\.\.navigationFor\(owner, locale\), \.\.\.secondaryNavigation\(owner, locale\)\]\.find\(item => item\.key === section\);/, "the heading label comes from the owner's primary and secondary navigation");
  assert.match(page, /<h1 className="v-title">\{area\?\.label \|\| section\}<\/h1>/, "the heading is the requested area's localized label");
});

test("FAP-87: the boundary sentence keeps the organization wording byte-identical and names each other owner", () => {
  assert.match(page, /This workspace area opens with an organization workspace\./, "organization-owned areas keep the FAP-75 sentence verbatim");
  assert.match(page, /This workspace area opens with a \$\{roleNames\[owner\]\} workspace\./, "teaching/family/professional owners use the same sentence shape");
  assert.match(page, /currently working in a/, "the user's own workspace type is named");
});

test("FAP-87: the notice keeps offering the visitor's own working paths and never redirects", () => {
  assert.match(page, /navigationFor\(user\?\.identity, locale\)/, "alternative paths derive from the role's own navigation");
  assert.match(page, /organizationCopy\(locale, "Return to workspace"\)/, "the already-localized return action is reused");
  assert.doesNotMatch(page, /<Navigate/, "the notice keeps the requested URL (no silent redirect)");
});
