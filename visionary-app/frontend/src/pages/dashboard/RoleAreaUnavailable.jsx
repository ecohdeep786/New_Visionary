/* FAP-75: an organization-only workspace area requested by another identity
 * keeps its URL and explains itself instead of silently rewriting the address
 * bar to /dashboard/home. The heading is the requested area's localized name
 * (from the organization navigation); the boundary sentence and the working
 * paths are role-specific. The return action reuses the already-localized
 * organizationCopy string. Reference basis for T02 (studied 2026-11-08):
 * Apple Education audience-named sections + HIG Inclusivity/Accessibility
 * (Intuitive/Perceivable/Adaptable) — clear paths, user language; nothing copied. */
/* FAP-87: the same law now covers every restricted workspace section. The
 * owning role comes from dashboardNavigation (isOrganizationArea areas are
 * owned by the organization workspace; all other restricted sections are
 * owned by the teaching, family or professional workspace). The boundary
 * sentence stays byte-identical for organization-owned areas; the other
 * owners use the same sentence shape with their own workspace name. */
import { NavLink, useLocation } from "react-router-dom";
import { navigationFor, secondaryNavigation, isOrganizationArea, dashboardAreaOwner } from "@/lib/dashboardNavigation";
import { organizationCopy } from "@/lib/organizationCopy";
import { useAuth } from "@/lib/AuthContext";

const roleNames = { teacher: "teaching", student: "learning", professional: "professional", parent: "family", organization: "organization" };

export default function RoleAreaUnavailable() {
  const { user } = useAuth();
  const location = useLocation();
  const locale = "en"; // labels come from the localized navigation; the boundary sentence is shown in English like other in-shell boundary notices
  const section = location.pathname.split("/")[2] || "home";
  const owner = dashboardAreaOwner(section) || (isOrganizationArea(section) ? "organization" : null);
  const alternatives = (navigationFor(user?.identity, locale) || []).filter(item => item.key !== "home").slice(0, 2);
  if (!owner) return null;
  const area = [...navigationFor(owner, locale), ...secondaryNavigation(owner, locale)].find(item => item.key === section);
  return (
    <div className="v-page" lang={locale} data-section={section}>
      <h1 className="v-title">{area?.label || section}</h1>
      <p role="status" lang="en" className="v-notice mt-4">
        {owner === "organization"
          ? `This workspace area opens with an organization workspace. You are currently working in a ${roleNames[user?.identity] || user?.identity || "personal"} workspace.`
          : `This workspace area opens with a ${roleNames[owner]} workspace. You are currently working in a ${roleNames[user?.identity] || user?.identity || "personal"} workspace.`}
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        {alternatives.map(item => (
          <NavLink key={item.key} to={item.to} className="v-button">{item.label}</NavLink>
        ))}
        <NavLink to="/dashboard/home" className="v-button">{organizationCopy(locale, "Return to workspace")}</NavLink>
      </div>
    </div>
  );
}
