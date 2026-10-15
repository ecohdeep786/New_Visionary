import { Link } from 'react-router-dom';
import AuthLayout from '@/components/AuthLayout';
import { primaryBtnAutoClass } from '@/components/auth/AuthUI';

export default function ForgotUserId() {
  return <AuthLayout title="Find your sign-in email" supportingText="Try the email you used when creating your Visionary account.">
    <div className="flex flex-col gap-6">
      <p className="text-sm leading-relaxed text-[#5f6368]">Search your inboxes for a Visionary verification email. If you used Google or Apple, choose the same sign-in method and account you used before.</p>
      <p className="text-sm leading-relaxed text-[#5f6368]">We cannot look up or send account details from an unverified phone number or recovery email here.</p>
      <Link to="/login" className={primaryBtnAutoClass}>Back to sign in</Link>
      <Link to="/forgot-password" className="text-sm text-[#4285F4] hover:underline">I know my email and need to reset my password</Link>
    </div>
  </AuthLayout>;
}
