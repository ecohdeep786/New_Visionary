// Display metadata only. Entitlements must come from verified server billing.
export const PRODUCT_ACCESS = Object.freeze({
  plan: "Free",
  billingConnected: false,
  aiConnected: false,
  usage: null,
});
export const learningLanguage = (user) => user?.preferences?.learning_language || user?.preferred_language || user?.teaching_medium || user?.medium || "English";
