import { useCallback, useEffect, useState } from 'react';
import { useWorkspace } from '@/hooks/useWorkspace';
import { getClassCommunity, postToClassCommunity, removeCommunityPost } from '@/services/communityService';

const MAX_TEXT = 1000;

// The class community: learners and the assigned teacher talk inside this class only.
// The teacher can remove any post; removals disappear for everyone. Every render is
// backed by the service's access checks, and L7 events carry no post text.
export default function CommunityTab({ classId, accent = '#4285F4' }) {
  const { ctx } = useWorkspace();
  const [posts, setPosts] = useState(null);
  const [role, setRole] = useState(null);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [loadError, setLoadError] = useState('');

  const refresh = useCallback(() => {
    if (!ctx) return;
    try {
      const view = getClassCommunity({ ...ctx, signal: undefined }, classId);
      setPosts(view.posts);
      setRole(view.role);
      setLoadError('');
    } catch (e) {
      setPosts([]);
      setLoadError(e.message);
    }
  }, [ctx?.personId, ctx?.workspaceId, classId]);

  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => {
    const handler = () => refresh();
    window.addEventListener('visionary:community-change', handler);
    return () => window.removeEventListener('visionary:community-change', handler);
  }, [refresh]);

  async function post() {
    if (!text.trim() || busy || !ctx) return;
    setBusy(true);
    setError('');
    try {
      postToClassCommunity(ctx, classId, text);
      setText('');
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  function remove(postId) {
    setError('');
    try {
      removeCommunityPost(ctx, classId, postId);
    } catch (e) {
      setError(e.message);
    }
  }

  return <div className="flex flex-col gap-5">
    {loadError && <p role="alert" className="rounded-xl bg-[#fce8e6] px-4 py-3 text-sm text-[#b3261e]">{loadError}</p>}
    <section aria-label="Write to the class community" className="rounded-2xl border border-[#dadce0] bg-white p-5">
      <label htmlFor={`community-composer-${classId}`} className="text-sm font-medium text-[#121317]">
        {role === 'teacher' ? 'Share with your class' : 'Share with your class community'}
      </label>
      <textarea
        id={`community-composer-${classId}`}
        value={text}
        maxLength={MAX_TEXT}
        rows={3}
        onChange={e => setText(e.target.value)}
        placeholder="Ask a question, share an idea, or help a classmate…"
        className="mt-2 w-full rounded-xl border border-[#dadce0] p-3 text-sm leading-relaxed"
      />
      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="text-xs text-[#5f6368]" aria-hidden="true">{text.length}/{MAX_TEXT}</span>
        <button
          type="button"
          disabled={!text.trim() || busy}
          onClick={post}
          className="h-10 rounded-full px-6 text-sm font-medium text-white disabled:opacity-50"
          style={{ backgroundColor: accent }}
        >
          {busy ? 'Posting…' : 'Post'}
        </button>
      </div>
      {error && <p role="alert" className="mt-3 text-sm text-[#b3261e]">{error}</p>}
      <p className="mt-2 text-xs leading-5 text-[#5f6368]">Visible to everyone in this class, including your teacher. Nothing here is public.</p>
    </section>

    {posts === null ? (
      <p role="status" className="text-sm text-[#5f6368]">Loading the community…</p>
    ) : posts.length === 0 ? (
      <div className="py-10 text-center">
        <p className="text-sm text-[#5f6368]">No posts yet. Start the conversation — a question or an idea is enough.</p>
      </div>
    ) : (
      <ul className="flex flex-col gap-3" aria-label="Community posts">
        {posts.map(item => (
          <li key={item.id} className="rounded-2xl border border-[#dadce0] bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-[#121317]">{item.authorName}</p>
                <span className="rounded-full bg-[#e8f0fd] px-2.5 py-0.5 text-[11px] font-medium" style={{ color: item.authorRole === 'teacher' ? '#0b57d2' : '#5f6368' }}>
                  {item.authorRole === 'teacher' ? 'Teacher' : 'Learner'}
                </span>
              </div>
              <time dateTime={item.at} className="text-xs text-[#5f6368]">{new Date(item.at).toLocaleString()}</time>
            </div>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-[#121317]">{item.text}</p>
            {role === 'teacher' && (
              <button
                type="button"
                onClick={() => remove(item.id)}
                className="mt-3 text-xs font-medium text-[#b3261e] underline hover:no-underline"
                aria-label={`Remove post by ${item.authorName}`}
              >
                Remove
              </button>
            )}
          </li>
        ))}
      </ul>
    )}
  </div>;
}
