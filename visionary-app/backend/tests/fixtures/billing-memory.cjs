// Isolated transactional repository. No Firebase SDK, credentials or network.
const { randomUUID } = require('node:crypto');
exports.billingMemory = () => {
  const clone = value => value && typeof value === 'object' ? typeof value.toMillis === 'function' && typeof value.toDate === 'function' ? value : Array.isArray(value) ? value.map(clone) : Object.fromEntries(Object.entries(value).map(([key, item]) => [key, clone(item)])) : value;
  const rows = new Map(); let queue = Promise.resolve();
  const snapshot = key => ({ id: key.split('/').at(-1), exists: rows.has(key), data: () => clone(rows.get(key)) });
  const requirePath = (key, parity) => {
    if (typeof key !== 'string' || !key || key.includes('//') || key.split('/').some(part => !part) || key.split('/').length % 2 !== parity)
      throw Error('Invalid Firestore ' + (parity ? 'collection' : 'document') + ' path');
    return key;
  };
  const document = key => (requirePath(key, 0), { key, id: key.split('/').at(-1), get: async () => snapshot(key), collection: name => collection(`${key}/${name}`) });
  const collection = (key, conditions = [], maximum = Infinity, after = null, ordered = false) => (requirePath(key, 1), {
    doc: id => document(`${key}/${id || randomUUID()}`),
    where: (field, operator, value) => collection(key, [...conditions, [field, operator, value]], maximum, after, ordered),
    limit: count => collection(key, conditions, count, after, ordered),
    orderBy: () => collection(key, conditions, maximum, after, true),
    startAfter: cursor => collection(key, conditions, maximum, typeof cursor === 'string' ? cursor : cursor.id, ordered),
    get: async () => {
      let selected = [...rows].filter(([name, data]) => name.startsWith(key + '/') && name.slice(key.length + 1).indexOf('/') < 0 && (!after || name.split('/').at(-1) > after) && conditions.every(([field, operator, value]) => operator === '<=' ? data[field] <= value : operator === '>' ? data[field] > value : data[field] === value));
      if (ordered) selected.sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0);
      return { docs: selected.slice(0, maximum).map(([name]) => snapshot(name)) };
    },
  });
  const db = { collection, runTransaction(action) {
    const pending = queue.then(async () => {
      const changes = []; let writing = false;
      const tx = { get: async ref => { if (writing) throw Error('Firestore requires reads before writes'); return snapshot(ref.key); },
        set: (ref, value) => { writing = true; changes.push(['set', ref.key, clone(value)]); },
        create: (ref, value) => { writing = true; changes.push(['create', ref.key, clone(value)]); },
        update: (ref, value) => { writing = true; changes.push(['update', ref.key, clone(value)]); },
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
