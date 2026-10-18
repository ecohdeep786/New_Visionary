import { useWorkspace } from '@/hooks/useWorkspace';

/** Optional guidance is readable on demand; errors and consent stay in their own visible notices. */
export default function WorkspaceHelp({ children, title, locale: requestedLocale }) {
  const { data } = useWorkspace();
  const locale = requestedLocale || data?.preferences.interfaceLocale || 'en';
  const labels = {
    en: title ? `About ${title}` : 'About this page',
    hi: title ? `${title} के बारे में` : 'इस पृष्ठ के बारे में',
    bn: title ? `${title} সম্পর্কে` : 'এই পৃষ্ঠা সম্পর্কে',
  };
  if (!children) return null;
  return <details className="v-page-help" lang={locale}>
    <summary>{labels[locale] || labels.en}</summary>
    <div className="v-page-help-body">{children}</div>
  </details>;
}
