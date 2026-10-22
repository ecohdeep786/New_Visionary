import { useState } from 'react';
import { GraduationCap, BookOpen, Building2, Users, Briefcase } from 'lucide-react';
import OnboardingLayout from '../OnboardingLayout';
import ChoiceGrid from '../ChoiceGrid';
const roles = [
  { id: 'student', label: 'I am a Learner', desc: 'Explore subjects, prepare for exams or learn independently.', icon: GraduationCap },
  { id: 'professional', label: 'I am a Professional', desc: 'Develop skills, plan career goals and build a portfolio.', icon: Briefcase },
  { id: 'teacher', label: 'I am a Teacher', desc: 'Prepare lessons and manage your teaching context.', icon: BookOpen },
  { id: 'parent', label: 'I am a Parent', desc: 'Set up a family space. Child access requires a verified connection.', icon: Users },
  { id: 'organization', label: 'We are an Organization', desc: 'Start an organization profile. Membership is verified separately.', icon: Building2 },
];
export default function IdentitySelection({ onContinue, initialRole, accountEmail, onChangeAccount, isSubmitting, isSwitchingAccount, error }) {
  const [selected, setSelected] = useState(initialRole || null);
  return <OnboardingLayout title="Make Visionary your own" subtitle="Choose how you want to get started. We’ll ask only for the details relevant to this role."
    step={1} totalSteps={selected === 'student' ? 5 : 4} stepLabels={selected === 'student' ? ['Your role', 'About you', 'Your focus', 'Details', 'Review'] : undefined} illustration="compass" onContinue={() => onContinue(selected)} canContinue={!!selected} accountEmail={accountEmail} onChangeAccount={onChangeAccount} isSubmitting={isSubmitting} isSwitchingAccount={isSwitchingAccount}>
    {error && <p role="alert" className="mb-5 rounded-xl bg-[#fce8e6] p-4 text-sm leading-6 text-[#b3261e]">{error}</p>}
    <ChoiceGrid options={roles} value={selected} onChange={setSelected} />
    <p className="mt-6 text-xs leading-6 text-[#6e6e73]">Your personal activity stays private. Selecting a role does not grant access to a school, company or another person’s account.</p>
  </OnboardingLayout>;
}
