import {connectionStatus} from '../lib/connectionAvailability.js';
/** Browser preview policy; every permission must later be enforced by the server. */
export const organizationProfiles = {
 owner: {label:'Owner',permissions:['members','invite','permissions','academic','analytics','audit','billing']},
 'organization-admin': {label:'Organization administrator',permissions:['members','invite','academic','analytics','audit']},
 'academic-admin': {label:'Academic administrator',permissions:['members','academic','analytics']},
 analyst: {label:'Analyst',permissions:['analytics']},
 'billing-admin': {label:'Billing administrator',permissions:['billing']},
};
export function organizationPolicy(user, invitations, now=Date.now()) {
 if(user?.identity!=='organization')return {profile:null,label:'Not an organization workspace',organizationEmail:null,permissions:[]};
 if(!user.organization_id)return {profile:'owner',...organizationProfiles.owner,organizationEmail:user.email};
 const membership=invitations.find(row=>row.organization_email===user.organization_id&&row.email===user.email&&row.role==='organization'&&connectionStatus(row,now)==='active');
 const profile=membership?.capability;
 if(typeof profile!=='string'||profile==='owner'||!Object.hasOwn(organizationProfiles,profile))return {profile:null,label:'No administrative permission assigned',organizationEmail:user.organization_id,permissions:[]};
 return {profile,...organizationProfiles[profile],organizationEmail:user.organization_id};
}
export function organizationPathAllowed(policy,path){
 const section=path.split('/')[2]||'home';
 const capability={people:'members',cohorts:'academic',curriculum:'academic',library:'academic',analytics:'analytics',audit:'audit',subscription:'billing'}[section];
 if(capability)return policy.permissions.includes(capability);
 return ['home','connections','notifications','personalization','privacy','profile','settings','support'].includes(section);
}
