import { InputField } from '@/components/auth/AuthUI';
export default function OrgInfo({ data, updateData }) {
  return <div className="space-y-5">
    <InputField label="Organization name" value={data.org_name || ''} onChange={event => updateData('org_name', event.target.value)} required />
    <p className="text-sm leading-6 text-[#5f6368]">Use the organization you plan to work with. Contact details, verification and invitations belong to the organization setup after onboarding.</p>
  </div>;
}
