import { useRef, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useConnectedWorkspace } from '@/hooks/ConnectedWorkspaceProvider';
import { connectedSurfaceCopy } from '@/lib/connectedSurfaceCopy';

/* The interface languages the product actually ships (FHE-19): the shell's
 * workspace strings exist for exactly these three. The saved account value
 * may be any onboarding learning-language label; when it is not one of the
 * three, the control shows it honestly (interface not available yet) instead
 * of silently presenting a wrong selection. */
const supportedLanguages = [
	['English', 'English', 'en'],
	['Hindi', 'हिन्दी — Hindi', 'hi'],
	['Bengali', 'বাংলা — Bengali', 'bn'],
];
const languageCodes = { English: 'en', Hindi: 'hi', Bengali: 'bn', বাংলা: 'bn' };

export default function ConnectedProfile() {
	const { account, updateUser, checkUserAuth } = useAuth();
	const { data } = useConnectedWorkspace();
	const locale = data?.preferences?.interfaceLocale || 'en';
	const t = connectedSurfaceCopy(locale);
	const savedName = account.full_name || '';
	// Keep the base and edits together so a cross-device refresh cannot silently
	// rebase a draft. A successful write or explicit reload clears both.
	const [draft, setDraft] = useState(null);
	const [busy, setBusy] = useState(false);
	const [checking, setChecking] = useState(false);
	const [message, setMessage] = useState(null);
	const lock = useRef(false);
	const value = draft?.name ?? savedName;
	const changed = draft && draft.base !== savedName;

	const savedLanguage = account.preferred_language || 'English';
	const savedLanguageSupported = supportedLanguages.some(([stored]) => stored === savedLanguage);

	async function refresh() {
		setChecking(true); setMessage(null);
		const latest = await checkUserAuth({ quiet: true, passive: true });
		setChecking(false);
		setMessage(latest ? { text: t('Profile checked against your account.') } : { error: true, text: t('Could not check your profile. Try again when connected.') });
	}
	async function save(event) {
		event.preventDefault();
		if (lock.current || checking || changed || !draft || !value.trim() || value.trim() === savedName) return;
		lock.current = true; setBusy(true); setMessage(null);
		try {
			await updateUser({ full_name: value.trim() }, { expectedUserId: account.id, expectedProfileName: draft.base });
			setDraft(null);
			setMessage({ text: t('Display name saved to your account.') });
		} catch (error) {
			if (error.status === 409) await checkUserAuth({ quiet: true, passive: true });
			setMessage({ error: true, text: error.status === 409 ? t('Your name changed on another device. Your edits are still here. Review the saved name before trying again.') : t('Could not confirm the save. Your edits are still here.') });
		} finally { lock.current = false; setBusy(false); }
	}
	async function changeLanguage(event) {
		/* The registered profile-update contract currently accepts only the
		 * display name and the account accent. Until its owner extends it with
		 * the interface language (one bounded field — see the FHE-19 receipt),
		 * the control is an honest, disabled preview of the coming choice: the
		 * interface locale follows the onboarding language selection. */
		event.preventDefault();
	}
	return <section className="max-w-xl rounded-2xl border bg-white p-6" lang={locale}>
		<h1 className="text-2xl font-semibold">{t('Your profile')}</h1>
		<p className="mt-2 break-words text-slate-700">{account.email || account.phone_number}</p>
		<p className="mt-2 text-slate-700">{t('Your display name follows your account across devices.')}</p>
		<form onSubmit={save} className="mt-6 grid gap-3">
			<label htmlFor="connected-display-name" className="font-medium">{t('Display name')}</label>
			<input id="connected-display-name" className="min-h-11 rounded-xl border px-3" value={value} required maxLength={80} disabled={busy}
				onChange={event => { setDraft({ base: draft?.base ?? savedName, name: event.target.value }); setMessage(null); }} />
			{changed && <p role="alert">{t('The name on your account is now')} <strong>{savedName || 'blank'}</strong>.</p>}
			<div className="flex flex-wrap gap-3">
				<button className="min-h-11 rounded-xl bg-blue-700 px-4 font-medium text-white disabled:opacity-60" disabled={busy || checking || changed || !value.trim() || value.trim() === savedName}>{busy ? t('Saving…') : t('Save name')}</button>
				<button type="button" className="min-h-11 rounded-xl border px-4" disabled={busy || checking} onClick={refresh}>{checking ? t('Checking…') : t('Refresh profile')}</button>
				{draft && <button type="button" className="min-h-11 rounded-xl border px-4" disabled={busy} onClick={() => { setDraft(null); setMessage(null); }}>{t('Discard edits')}</button>}
			</div>
			<fieldset className="mt-4 grid gap-2 border-0 p-0">
				<legend className="font-medium">{t('Interface language')}</legend>
				<select id="connected-interface-language" className="min-h-11 rounded-xl border bg-white px-3 disabled:opacity-60" value={savedLanguage}
					disabled lang={languageCodes[savedLanguage] || 'en'}
					aria-describedby="connected-interface-language-note">
					{!savedLanguageSupported && <option value={savedLanguage}>{t('{label} — interface not available yet', { label: savedLanguage })}</option>}
					{supportedLanguages.map(([stored, label, lang]) => <option key={stored} value={stored} lang={lang}>{label}</option>)}
				</select>
				<p id="connected-interface-language-note" className="text-sm text-slate-700">{t('The interface follows the language you chose during setup. English, Hindi and Bengali interfaces are available; switching here is coming soon. Your learning-language preference and your sources are separate choices.')}</p>
			</fieldset>
			{message && <p role={message.error ? 'alert' : 'status'}>{message.text}</p>}
		</form>
	</section>;
}
