/**
 * Legal/trust page metadata — single fixture (Wave L4, 01-PM owns).
 * "Last updated" dates, DPDP Act 2023 grievance-officer contact, and response
 * time expectations for every trust/legal/company page. Pages read their
 * dates and compliance signals from here — never hardcoded in JSX.
 */

export const GRIEVANCE_OFFICER = {
  role: "Grievance Officer (DPDP Act, 2023)",
  name: "Md Shahid Ali",
  email: "grievance@visionary.org.in",
  response: "We acknowledge grievances within 72 hours and work to resolve them within 30 days.",
};

export const LEGAL_META = {
  privacy: { title: "Privacy policy", lastUpdated: "September 2026" },
  terms: { title: "Terms of service", lastUpdated: "September 2026" },
  cookies: { title: "Cookie policy", lastUpdated: "September 2026" },
  safety: { title: "Safety", lastUpdated: "September 2026" },
  security: { title: "Security", lastUpdated: "September 2026" },
  accessibility: { title: "Accessibility", lastUpdated: "September 2026" },
};

/* Expected first-response times shown on /contact and referenced by legal pages. */
export const RESPONSE_TIMES = {
  general: "We reply within 2 business days.",
  safety: "Safety reports are reviewed by a human — usually within 24 hours.",
  grievance: "Grievances are acknowledged within 72 hours and resolved within 30 days.",
  partners: "Partnership enquiries receive a reply within 5 business days.",
};
