export * from './professional-types';
export * from './professional-lookups';
export * from './professional-service';
// ROLE-05 (KAN-97) — separate professional personal/company records,
// sponsored membership and explicit portfolio/project shares; employer access
// does not include private personal learning.
//   - personal and company record scopes are strictly separate stores; a
//     company record carrying a personal-learning reference refuses;
//   - sponsored membership grants company benefits ONLY (the sponsorship
//     type cannot carry personal-learning access);
//   - company visibility of a personal item exists ONLY through an explicit,
//     purpose-bound, revocable share grant by the item's owner;
//   - the company view structurally excludes personal learning; a
//     company-side personal-learning read always refuses.
