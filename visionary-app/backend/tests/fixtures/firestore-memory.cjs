// Transactional test repository; never imports or connects a real Firestore client.
exports.memoryFirestore = () => {
  const rows = new Map(); let queue = Promise.resolve(), sequence = 0;
  const doc = id => ({ id, get: async () => ({ exists: rows.has(id), data: () => rows.get(id) }) });
  const db = {
    collection: name => ({ doc: id => doc(`${name}/${id || ++sequence}`) }),
    runTransaction(action) {
      const result = queue.then(async () => {
        const writes = [];
        const tx = { get: ref => ref.get(), set: (ref, value) => writes.push(() => rows.set(ref.id, structuredClone(value))),
          create: (ref, value) => writes.push(() => { if (rows.has(ref.id)) throw Error('Duplicate test record'); rows.set(ref.id, structuredClone(value)); }),
          update: (ref, value) => writes.push(() => rows.set(ref.id, { ...rows.get(ref.id), ...value })) };
        const result = await action(tx); for (const write of writes) write(); return result;
      });
      queue = result.catch(() => {}); return result;
    },
  };
  return { db, rows };
};
