// Development-only component fixture. No real account or provider is contacted.
import React from 'react';
import { createRoot } from 'react-dom/client';
import FeedbackPrompt from '../../src/components/dashboard/FeedbackPrompt';
import { appClient } from '../../src/api/appClient';
import '../../src/components/dashboard/workspace.css';
import '../../src/components/dashboard/workspace-design.css';
import '../../src/styles/workspace-premium.css';
if (!import.meta.env.DEV || import.meta.env.VITE_FIREBASE_PROJECT_ID !== 'demo-visionary-feedback' || import.meta.env.VITE_AUTH_MODE !== 'firebase') throw Error('Feedback fixture requires an isolated demo development server.');
appClient.auth.currentProfile = () => ({ id: 'feedback-fixture' });
const locale = new URLSearchParams(location.search).get('locale') || 'en';
createRoot(document.getElementById('root')).render(<div className="visionary-workspace" style={{ minHeight: '100vh', background: '#f8fafd', padding: '24px', fontFamily: 'Arial, sans-serif' }}><main className="workspace-surface" style={{ maxWidth: 800, margin: 'auto', background: 'white', borderRadius: 24 }}><div className="v-page"><h1 className="v-title">Feedback interface check</h1><p className="v-muted">Fictional account · isolated memory store</p></div><FeedbackPrompt accountId="feedback-fixture" locale={locale} surface="learn"/></main></div>);
