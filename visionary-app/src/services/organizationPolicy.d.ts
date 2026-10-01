export interface OrganizationPolicyResult {profile:string|null;label:string;organizationEmail:string|null|undefined;permissions:string[]}
export const organizationProfiles:Record<string,{label:string;permissions:string[]}>;
export function organizationPolicy(user:{email?:string;identity?:string;organization_id?:string}|null|undefined,invitations:{organization_email?:string;email?:string;role?:string;status?:string;expiresAt?:string;capability?:string}[],now?:number):OrganizationPolicyResult;
export function organizationPathAllowed(policy:OrganizationPolicyResult,path:string):boolean;
