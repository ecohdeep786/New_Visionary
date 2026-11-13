import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { approvedPolicy, record, uid } from './privacy-policy';
export const BASELINE_POLICY_DIGEST = '2f928ca888cf4d2bddf7b35898788fd3ca093b351ef9344e1db572608140b577';
const ownerId = 'policy-owner-md-shahid-ali';
/** Approved reference only: no publication, trust installation, permission,
 * acknowledgement, training, retention/deletion job or lifecycle write. */
@Injectable()
export class PrivacyPolicyService {
  view(actorUid: string) {
    try {
      if (!uid(actorUid)) throw Error();
      const file = join(__dirname, 'privacy-preservation-policy.v1.json');
      if (statSync(file).size > 24000) throw Error();
      const asset = JSON.parse(readFileSync(file, 'utf8'));
      record(asset, ['schemaVersion', 'scope', 'policySnapshot', 'humanApproval', 'boundaries']);
      if (asset.schemaVersion !== 1 || asset.scope !== 'purpose-minimization-and-record-preservation-baseline' || asset.humanApproval?.ownerId !== ownerId || asset.humanApproval?.name !== 'Md Shahid Ali' || asset.humanApproval?.role !== 'Founder & CEO') throw Error();
      const { policy, policyDigest } = approvedPolicy(asset.policySnapshot, new Set([ownerId]), new Date());
      if (policyDigest !== BASELINE_POLICY_DIGEST || policy.classes.some(c => c.retention.mode !== 'owner_controlled')) throw Error();
      return { version: 1, uid: actorUid, policyVersion: policy.policyVersion, policyDigest,
        approvedBy: { name: 'Md Shahid Ali', role: 'Founder & CEO' }, approvalState: 'approved',
        preservation: { automaticPurge: false, defaultTraining: false, under18Activation: 'blocked' },
        dataClasses: policy.classes.map(c => ({ dataClass: c.dataClass, purpose: c.purpose, permittedFields: c.permittedFields, retention: c.retention.mode })),
        capabilities: { policyReference: true, cloudErasure: false, guardianVerification: false, automaticTraining: false } };
    } catch { throw new ServiceUnavailableException('Approved privacy policy is temporarily unavailable. Your records are preserved.'); }
  }
}
