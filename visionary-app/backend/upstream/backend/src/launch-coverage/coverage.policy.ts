import { BadRequestException, ConflictException, ServiceUnavailableException } from '@nestjs/common';
import { createHash } from 'node:crypto';

export const coverageCategories = ['primary', 'secondary', 'higher-secondary', 'competitive', 'vocational', 'higher-education', 'independent-adult', 'professional', 'employer-sponsored'];
export const coverageRoles = ['student', 'teacher', 'parent', 'professional', 'organization'];
export const coverageDimensions = { interfaceLocale: ['en', 'hi', 'bn'], modality: ['text', 'voice', 'visual', 'build'], device: ['desktop-browser', 'mobile-browser', 'native-client'], connectivity: ['online', 'offline', 'reconnecting'] };
const tupleFields = ['category', 'interfaceLocale', 'modality', 'device', 'connectivity', 'sourceId', 'sourceVersion', 'sourceLanguage', 'inputLanguage', 'outputLanguage', 'script', 'speechLanguage', 'board', 'state', 'classLevel', 'exam'];
const requiredText = ['sourceId', 'sourceVersion', 'sourceLanguage', 'inputLanguage', 'outputLanguage', 'script'];
const revisionPattern = /^[a-zA-Z0-9_-]{1,96}$/;
const text = (value: unknown, max = 120) => typeof value === 'string' && value.length <= max && !/[\u0000-\u001f\u007f]/.test(value) && value === value.trim();
const iso = (value: unknown) => typeof value === 'string' && /^\d{4}-\d\d-\d\dT/.test(value) && Number.isFinite(Date.parse(value));
const unavailable = () => new ServiceUnavailableException('Learning coverage could not be verified. Your saved selections are unchanged. Retry when connected.');

export function coverageSelection(input: unknown) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new BadRequestException('Choose a learning context.');
  const value = input as Record<string, any>;
  if (Object.keys(value).some(key => ![...tupleFields, 'expectedProfileVersion', 'expectedCatalogRevision'].includes(key)) ||
      !Number.isSafeInteger(value.expectedProfileVersion) || value.expectedProfileVersion < 0 ||
      !(value.expectedCatalogRevision === null || typeof value.expectedCatalogRevision === 'string' && revisionPattern.test(value.expectedCatalogRevision))) throw new BadRequestException('Use a current coverage selection without account or permission claims.');
  if (!coverageCategories.includes(value.category) || Object.entries(coverageDimensions).some(([key, choices]) => !choices.includes(value[key]))) throw new BadRequestException('Choose a supported category and delivery context.');
  if (requiredText.some(key => !text(value[key]) || !value[key]) || tupleFields.some(key => value[key] !== undefined && !text(value[key]))) throw new BadRequestException('Enter the exact source, version and language context.');
  const result: Record<string, string> = {};
  for (const key of tupleFields) result[key] = value[key] || '';
  if (result.modality === 'voice' ? !result.speechLanguage : !!result.speechLanguage) throw new BadRequestException('Keep speech language explicit and separate from text.');
  if (['primary', 'secondary', 'higher-secondary'].includes(result.category) && (!result.board || !result.classLevel || result.board === 'State' && !result.state)) throw new BadRequestException('Choose the exact school board, state when applicable, and class.');
  if (result.category === 'competitive' && !result.exam) throw new BadRequestException('Choose the exact target examination.');
  return { tuple: result, expectedProfileVersion: value.expectedProfileVersion as number, expectedCatalogRevision: value.expectedCatalogRevision as string | null };
}

// Exact source/language/device tuple. No wildcard, model-name or locale fallback.
export function coverageSliceId(role: string, tuple: Record<string, string>) {
  return createHash('sha256').update(JSON.stringify([role, ...tupleFields.map(key => tuple[key] || '')])).digest('hex');
}

export function coveragePublication(input: any, now: number) {
  if (input === undefined) return null;
  if (!input || input.version !== 1 || typeof input.revision !== 'string' || !revisionPattern.test(input.revision) || input.status !== 'published' || !iso(input.publishedAt) || Date.parse(input.publishedAt) > now || !iso(input.expiresAt) || Date.parse(input.expiresAt) <= now ||
      !text(input.approvedBy, 96) || !input.approvedBy || !/^[a-f0-9]{40}$/.test(input.reviewedCommit || '') || !text(input.evidenceId, 160) || !input.evidenceId ||
      !input.categoryCounts || Object.keys(input.categoryCounts).length !== coverageCategories.length || coverageCategories.some(key => !Number.isSafeInteger(input.categoryCounts[key]) || input.categoryCounts[key] < 0)) throw unavailable();
  return input;
}

export function coverageAccount(account: any, uid: string) {
  if (!account || account.uid && account.uid !== uid || !Number.isSafeInteger(account.version) || account.version < 0) throw new ConflictException('Your account profile changed. Reload your account before checking coverage.');
  return account;
}

export function coverageAdmission(account: any, tuple?: Record<string, string>) {
  const profile = account.profile || {};
  if (account.onboarding?.status !== 'complete') return 'account-setup-required';
  if (profile.age_band !== 'adult') return 'verified-guardian-admission-required';
  if (!coverageRoles.includes(profile.identity)) return 'account-role-unavailable';
  if (['teacher', 'parent', 'organization'].includes(profile.identity) || tuple?.category === 'employer-sponsored') return 'verified-linked-role-required';
  if (tuple?.device === 'native-client') return 'native-client-not-released';
  if (tuple && tuple.connectivity !== 'online') return 'online-authority-required';
  if (tuple?.category === 'vocational') return 'vocational-mapping-required';
  if (tuple) {
    const allowed = profile.identity === 'professional' ? ['professional'] : ({ school: coverageCategories.slice(0, 3), higher_ed: ['higher-education'], competitive: ['competitive'], professional: ['independent-adult'] }[profile.education_stage] || []);
    if (!allowed.includes(tuple.category)) return 'account-learning-context-changed';
  }
  return null;
}

export function qualifiedCoverageSlice(slice: any, publication: any, role: string, tuple: Record<string, string>, now: number) {
  if (!slice) return false;
  // Corrupt/expired/revoked entries are never promoted to an available source.
  if (slice.version !== 1 || slice.revision !== publication.revision || slice.role !== role || slice.status !== 'qualified' || !iso(slice.expiresAt) || Date.parse(slice.expiresAt) <= now || Date.parse(slice.expiresAt) > Date.parse(publication.expiresAt) ||
      !text(slice.approvedBy, 96) || !slice.approvedBy || !/^[a-f0-9]{40}$/.test(slice.reviewedCommit || '') ||
      !slice.evidence || ['sourceRights', 'providerCapability', 'languageAndScript', 'privacyAndCommercial', 'deliveryAndRecovery'].some(key => !text(slice.evidence[key], 160) || !slice.evidence[key]) ||
      !slice.selection || Object.keys(slice.selection).length !== tupleFields.length || tupleFields.some(key => slice.selection[key] !== tuple[key])) return false;
  return true;
}
