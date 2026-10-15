import { useLayoutEffect, useRef } from 'react';

/** Keep reading positions in this shell only, separately for each account and workspace.
 * A lazy route may initially be too short to restore. Wait for its content, but
 * stop restoring as soon as the user starts navigating the page themselves.
 */
export function useWorkspaceScroll(accountId, workspaceId, pathname, search, available) {
  const positions = useRef(new Map());
  const owner = useRef(accountId);
  useLayoutEffect(() => {
    if (owner.current !== accountId) {
      positions.current.clear();
      owner.current = accountId;
    }
    if (!available || !accountId || !workspaceId) return;
    const main = document.getElementById('main');
    if (!main) return;
    const key = JSON.stringify([accountId, workspaceId, pathname, search]);
    const target = positions.current.get(key) ?? 0;
    let position = target;
    let restoring = target > 0;
    let frame;
    main.scrollTop = 0;
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(restore);
    });
    function restore() {
      if (!restoring) return;
      main.scrollTop = target;
      if (Math.abs(main.scrollTop - target) <= 1) {
        restoring = false;
        position = main.scrollTop;
        observer.disconnect();
      }
    }
    function stopRestoring(event) {
      if (event.type === 'keydown' && !['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(event.key)) return;
      restoring = false;
      position = main.scrollTop;
      observer.disconnect();
      cancelAnimationFrame(frame);
    }
    function recordPosition() {
      if (!restoring) position = main.scrollTop;
    }
    const surface = main.firstElementChild;
    if (restoring && surface) {
      observer.observe(surface);
      frame = requestAnimationFrame(restore);
    }
    for (const type of ['wheel', 'touchstart', 'pointerdown', 'keydown']) main.addEventListener(type, stopRestoring, { passive: true });
    main.addEventListener('scroll', recordPosition, {passive:true});
    return () => {
      // Do not replace a retained position with a temporary loading screen.
      if (!restoring) positions.current.set(key, position);
      if (positions.current.size > 80) positions.current.delete(positions.current.keys().next().value);
      observer.disconnect();
      cancelAnimationFrame(frame);
      for (const type of ['wheel', 'touchstart', 'pointerdown', 'keydown']) main.removeEventListener(type, stopRestoring);
      main.removeEventListener('scroll', recordPosition);
    };
  }, [accountId, workspaceId, pathname, search, available]);
}
