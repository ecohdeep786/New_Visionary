/** FAP-90 — the Classes list deep link keeps its URL and explains itself for
 *  identities without a Classes surface.
 *  Before: DashboardLayout gate 1 (canAccessDashboardPath) denied the section
 *  for organization and family identities and, because dashboardNavigation's
 *  areaOwners (the FAP-87 map) had no `classes` entry, fell back to
 *  <Navigate to="/dashboard/home" replace /> — the address bar was silently
 *  rewritten and no explanation was shown. Reproduced live on merged beta
 *  (5174 @ ce2c391a and @ 5e9a6e52, and on the FAP-89 candidate):
 *  /dashboard/classes from an organization identity landed on
 *  "Welcome back, T09." at /dashboard/home (t09-fap89-org-denials.json,
 *  t09-fap89-postmerge.json). The law (FAP-75/FAP-87): a restricted deep link
 *  keeps its URL and renders RoleAreaUnavailable — "Classes — This workspace
 *  area opens with a teaching workspace." — with the viewer's own primary
 *  paths as alternatives. A cross-product of every navigation section against
 *  every role shows `classes` was the only remaining section that could be
 *  denied at gate 1 without an owner mapping. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { canAccessDashboardPath, dashboardAreaOwner, isOrganizationArea, navigationFor, secondaryNavigation } from "../src/lib/dashboardNavigation.js";

test("FAP-90: the Classes list area is owned by the teaching workspace", () => {
  assert.equal(dashboardAreaOwner("classes"), "teacher", "areaOwners maps classes to the teacher role");
  const area = [...navigationFor("teacher"), ...secondaryNavigation("teacher")].find(item => item.key === "classes");
  assert.ok(area, "the owner's navigation carries a Classes label for the explanation heading");
});

test("FAP-90: access to /dashboard/classes is unchanged for identities that have the surface", () => {
  for (const role of ["student", "professional", "teacher"]) {
    assert.equal(canAccessDashboardPath(role, "/dashboard/classes"), true, `${role} still reaches /dashboard/classes`);
  }
});

test("FAP-90: organization and family identities are denied the Classes list at gate 1 (and now get the explanation instead of a rewrite)", () => {
  for (const role of ["organization", "parent"]) {
    assert.equal(canAccessDashboardPath(role, "/dashboard/classes"), false, `${role} is still denied /dashboard/classes`);
  }
});

test("FAP-90: every section that any role can be denied at gate 1 has an owner mapping or is an organization area — no rewrite holes remain", () => {
  const source = readFileSync(new URL("../src/lib/dashboardNavigation.js", import.meta.url), "utf8");
  const roles = ["student", "teacher", "parent", "professional", "organization"];
  const alwaysAllowed = ["profile", "settings", "support", "ask", "guide", "connections", "learn", "practice", "build", "explore", "privacy", "personalization", "notifications", "progress", "subscription"];
  const sections = new Set();
  for (const role of roles) {
    for (const item of [...navigationFor(role), ...secondaryNavigation(role)]) sections.add(item.key);
  }
  for (const section of sections) {
    const deniedAnywhere = roles.some(role => !canAccessDashboardPath(role, `/dashboard/${section}`) && !alwaysAllowed.includes(section));
    if (!deniedAnywhere) continue;
    const covered = isOrganizationArea(section) || source.includes(`${section}:'teacher'`) || source.includes(`${section}:'parent'`) || source.includes(`${section}:'professional'`) || source.includes(`${section}:'organization'`);
    assert.ok(covered, `${section} can be denied at gate 1 but has no areaOwners mapping or organization-area entry (would rewrite to /dashboard/home)`);
  }
});
