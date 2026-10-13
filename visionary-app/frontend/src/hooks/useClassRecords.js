import { useCallback, useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';

// Keep drafts mounted during refresh; hide records as soon as a source fails.
export function useClassRecords(classId, entityNames) {
  const [records, setRecords] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);
  const sequence = useRef(0);
  const namesKey = entityNames.join(',');
  const load = useCallback(async () => {
    const request = ++sequence.current;
    try {
      const next = await Promise.all(namesKey.split(',').map(name => base44.entities[name].filter({ class_id: classId })));
      if (request !== sequence.current) return;
      setRecords(next);
      setUnavailable(false);
    } catch {
      if (request !== sequence.current) return;
      setRecords(null);
      setUnavailable(true);
    } finally {
      if (request === sequence.current) setLoading(false);
    }
  }, [classId, namesKey]);
  useEffect(() => {
    setRecords(null);
    setLoading(true);
    load();
    window.addEventListener('visionary:workspace-change', load);
    window.addEventListener('storage', load);
    return () => {
      sequence.current++;
      window.removeEventListener('visionary:workspace-change', load);
      window.removeEventListener('storage', load);
    };
  }, [load]);
  return { records, loading, unavailable, reload: load };
}
