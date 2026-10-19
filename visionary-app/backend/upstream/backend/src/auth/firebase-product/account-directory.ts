import { isDeepStrictEqual } from 'node:util';
import type { DocumentReference } from 'firebase-admin/firestore';
import { accountPath, ACCOUNT_STORAGE_VERSION } from './account-storage';

export const ACCOUNT_DIRECTORY_VERSION = 1;

// A directory describes ownership and locations, never permissions or activity.
// Unconnected domains have no fabricated records, memberships or entitlements.
export function accountDirectory(uid: string) {
  if (typeof uid !== 'string' || !/^[a-zA-Z0-9_-]{1,128}$/.test(uid) || /^__.*__$/.test(uid)) throw Error('Invalid account UID');
  const root = accountPath(uid);
  const native = (label: string, paths: Record<string, string>) => ({ label, availability: 'connected', store: 'firestore', paths });
  const future = (label: string, domain: string) => ({ label, availability: 'not-connected', store: 'domain-service', linkPath: `${root}/domainLinks/${domain}` });
  return {
    uid, schemaVersion: ACCOUNT_DIRECTORY_VERSION, kind: 'account-directory', accountPath: root,
    sections: {
      account: native('Account, profile and onboarding', { account: root }),
      authentication: native('Authentication history and devices', { identity: root, events: `${root}/authEvents`, devices: `${root}/devices` }),
      billing: native('Plans, test subscriptions and invoices', { account: `${root}/billing/test`, commands: `${root}/billing/test/commands`, invoices: `${root}/billing/test/invoices` }),
      feedback: native('Submitted feedback', { submissions: `${root}/feedback` }),
      learning: future('Learning workspaces and lessons', 'learning'),
      conversations: future('Ask, Guide and permitted conversation history', 'conversations'),
      practice: future('Practice attempts and assessments', 'practice'),
      projects: future('Build projects and artifacts', 'projects'),
      progress: future('Progress evidence and goals', 'progress'),
      connections: future('Workspaces, connections and consent', 'connections'),
      teaching: future('Teaching, classes and assignments', 'teaching'),
      family: future('Guardian links and permitted family reports', 'family'),
      career: future('Career and explicitly shared portfolio', 'career'),
      organization: future('Organization memberships and permitted work', 'organization'),
      privacy: future('Privacy, exports and retention requests', 'privacy'),
      support: future('Support requests and notifications', 'support'),
    },
  };
}

export const directoryDocument = (db: any, uid: string): DocumentReference => db.collection(`${accountDirectory(uid).accountPath}/structure`).doc('account');

export function directoryNeedsUpdate(uid: string, existing: any) {
  const expected = accountDirectory(uid);
  if (existing && (existing.uid !== uid || !Number.isInteger(existing.schemaVersion) || existing.schemaVersion > ACCOUNT_DIRECTORY_VERSION)) throw Error('Account directory ownership or version conflict');
  return !isDeepStrictEqual(existing, expected);
}

// An additive transaction only: no profile/billing/history rewrite, provider call
// or permission grant. Inspect mode uses exactly the same conflict checks.
export async function reconcileAccountDirectory(db: any, uid: string, apply = false) {
  const expected = accountDirectory(uid), root = db.collection('visionary_accounts').doc(uid), directory = directoryDocument(db, uid);
  return db.runTransaction(async (tx: any) => {
    const account = (await tx.get(root)).data(), saved = (await tx.get(directory)).data();
    if (!account || account.uid !== uid || account.identity?.uid !== uid || account.storageVersion !== ACCOUNT_STORAGE_VERSION || account.storageMigration?.status === 'copying') throw Error('Account must have a consistent completed UID tree');
    const changed = directoryNeedsUpdate(uid, saved);
    if (apply && changed) tx.set(directory, expected);
    return { changed, written: apply && changed };
  });
}
