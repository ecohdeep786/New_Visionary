// Isolated transactional repository. No Firebase SDK, credentials or network.
const { randomUUID } = require('node:crypto');
exports.billingMemory = () => {
  const rows = new Map(); let queue = Promise.resolve();
  const snapshot = key => ({ id: key.split('/').at(-1), exists: rows.has(key), data: () => structuredClone(rows.get(key)) });
  const document = key => ({ key, id: key.split('/').at(-1), get: async () => snapshot(key), collection: name => collection(`${key}/${name}`) });
  const collection = (key, conditions = [], maximum = Infinity) => ({
    doc: id => document(`${key}/${id || randomUUID()}`),
    where: (field, operator, value) => collection(key, [...conditions, [field, operator, value]], maximum),
    limit: count => collection(key, conditions, count),
    get: async () => ({ docs: [...rows].filter(([name, data]) => name.startsWith(key + '/') && name.slice(key.length + 1).indexOf('/') < 0 && conditions.every(([field, operator, value]) => operator === '<=' ? data[field] <= value : data[field] === value)).slice(0, maximum).map(([name]) => snapshot(name)) }),
  });
  const db = { collection, runTransaction(action) {
    const pending = queue.then(async () => {
      const changes = []; let writing = false;
      const tx = { get: async ref => { if (writing) throw Error('Firestore requires reads before writes'); return snapshot(ref.key); },
        set: (ref, value) => { writing = true; changes.push(['set', ref.key, structuredClone(value)]); },
        create: (ref, value) => { writing = true; changes.push(['create', ref.key, structuredClone(value)]); },
        update: (ref, value) => { writing = true; changes.push(['update', ref.key, structuredClone(value)]); },
        delete: ref => { writing = true; changes.push(['delete', ref.key]); } };
      const result = await action(tx), saved = new Map(rows);
      for (const [kind, key, value] of changes) {
        if (kind === 'create' && saved.has(key)) throw Error('Already exists');
        if (kind === 'update' && !saved.has(key)) throw Error('Missing record');
        if (kind === 'delete') saved.delete(key); else saved.set(key, kind === 'update' ? { ...saved.get(key), ...value } : value);
      }
      rows.clear(); for (const [key, value] of saved) rows.set(key, value);
      return result;
    });
    queue = pending.catch(() => {}); return pending;
  } };
  return { db, rows };
};
