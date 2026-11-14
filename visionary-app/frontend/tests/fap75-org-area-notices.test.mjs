/** FAP-75 — organization-area deep links keep their URL and explain themselves.
 *  Before: DashboardLayout returned a bare `<Navigate to="/dashboard/home" replace/>`
 *  whenever `canAccessDashboardPath` failed, so a teacher hitting
 *  /dashboard/cohorts|curriculum|people|analytics (organization-only surfaces)
 *  saw Home re-render at a rewritten address with no explanation. The law: the
 *  workspace routes for those organization areas render an in-shell notice page
 *  at the requested URL (localized area heading + honest boundary sentence + the
 *  role's own working paths); only non-organization-area paths keep the
 *  existing fallback. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const navigation = readFileSync(new URL("../src/lib/dashboardNavigation.js", import.meta.url), "utf8");
const layout = readFileSync(new URL("../src/components/dashboard/DashboardLayout.jsx", import.meta.url), "utf8");
const page = readFileSync(new URL("../src/pages/dashboard/RoleAreaUnavailable.jsx", import.meta.url), "utf8");

test("the organization-area selector covers exactly the coded organization-only routes", () => {
  assert.match(navigation, /export function isOrganizationArea\(section\)\{return \['people','cohorts','curriculum','analytics'\]\.includes\(section\);\}/);
});

test("the layout guard renders the area notice for organization areas instead of a silent redirect", () => {
  const guard = layout.slice(layout.indexOf("!canAccessDashboardPath"), layout.indexOf("!canAccessDashboardPath") + 420);
  assert.match(guard, /isOrganizationArea\(section\)/, "the guard branches on organization areas");
  assert.match(guard, /<RoleAreaUnavailable \/>/, "the notice page renders at the requested URL");
  const afterNotice = guard.slice(guard.indexOf("<RoleAreaUnavailable />"));
  assert.match(afterNotice, /return <Navigate to="\/dashboard\/home" replace \/>;/, "non-organization-area paths keep the existing fallback");
});

test("the area page announces the area as exactly one visible heading", () => {
  const openings = page.match(/<h1(?=[\s>\/])/g) || [];
  assert.equal(openings.length, 1, "the notice page must author exactly one h1");
  assert.match(page, /<h1 className="v-title">\{area\?\.label \|\| section\}<\/h1>/, "the heading is the requested area's localized label");
});

test("the notice names the boundary in user language and offers the role's own working paths", () => {
  assert.match(page, /This workspace area opens with an organization workspace\./, "the boundary sentence leads with who the surface is for");
  assert.match(page, /currently working in a/, "the user's own workspace type is named");
  assert.match(page, /navigationFor\(user\?\.identity, locale\)/, "alternative paths derive from the role's own navigation");
  assert.match(page, /organizationCopy\(locale, "Return to workspace"\)/, "the already-localized return action is reused");
  assert.doesNotMatch(page, /<Navigate/, "the notice keeps the requested URL (no silent redirect)");
});
