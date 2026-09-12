/**
 * Local preview repository, not a production authentication boundary.
 * Replace with server-verified identity, database rules, and services before
 * deploying to real learners. Browser storage is local to this device.
 */

const USERS_KEY = 'visionary_users';
const SESSION_TOKEN_KEY = 'visionary_session_token';
const SESSIONS_KEY = 'visionary_sessions';
const PENDING_REGISTRATION_KEY = 'visionary_pending_registration';
const RESET_TOKENS_KEY = 'visionary_reset_tokens';
const LEGACY_SESSION_KEY = 'visionary_session';

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const RESET_TOKEN_TTL_MS = 15 * 60 * 1000; // 15 minutes

const readJson = (key, fallback) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

const writeJson = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    throw new Error('Your changes could not be saved on this device. Check available browser storage and try again.', { cause: err });
  }
};

/* ── Web Crypto API Security Primitives ── */

const generateSecureHex = (byteLength = 16) => {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
};

const computeSaltedHash = async (password, salt) => {
  const enc = new TextEncoder();
  const data = enc.encode(`${salt}:${password}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
};

/** Redacts sensitive security fields before returning user object to application */
const sanitizeUser = (user) => {
  if (!user) return null;
  const { password, passwordHash, salt, ...safeUser } = user;
  return safeUser;
};

const getUsers = () => readJson(USERS_KEY, []);

/* ── Session Protection & Authorization ── */

const getSessions = () => {
  const sessions = readJson(SESSIONS_KEY, []);
  const now = Date.now();
  // Filter out expired sessions
  return sessions.filter((s) => s.expiresAt > now);
};

const createSession = (user) => {
  const token = crypto.randomUUID();
  const session = {
    token,
    userId: user.id,
    email: user.email,
    expiresAt: Date.now() + SESSION_TTL_MS,
    createdAt: Date.now(),
  };
  const sessions = getSessions();
  sessions.push(session);
  writeJson(SESSIONS_KEY, sessions);
  localStorage.setItem(SESSION_TOKEN_KEY, token);
  // Clear legacy plain session key if present
  localStorage.removeItem(LEGACY_SESSION_KEY);
  return token;
};

const getCurrentSession = () => {
  const token = localStorage.getItem(SESSION_TOKEN_KEY);
  if (token) {
    const session = getSessions().find((s) => s.token === token);
    if (session) return session;
  }

  // Graceful migration from legacy plain email session
  const legacyEmail = localStorage.getItem(LEGACY_SESSION_KEY);
  if (legacyEmail) {
    const user = getUsers().find((u) => u.email === legacyEmail);
    if (user) {
      createSession(user);
      return { email: legacyEmail, userId: user.id };
    }
  }

  return null;
};

const getCurrentUser = () => {
  const session = getCurrentSession();
  if (!session) return null;
  const user = getUsers().find((u) => u.id === session.userId || u.email === session.email);
  return user ? sanitizeUser(user) : null;
};

/* ── Password Verification & Auto-Migration ── */

const verifyPassword = async (user, candidatePassword) => {
  // If user has modern salted hash
  if (user.passwordHash && user.salt) {
    const candidateHash = await computeSaltedHash(candidatePassword, user.salt);
    return candidateHash === user.passwordHash;
  }

  // Legacy plaintext fallback: verify and automatically upgrade to salted hash
  if (user.password && user.password === candidatePassword) {
    const users = getUsers();
    const idx = users.findIndex((u) => u.id === user.id);
    if (idx >= 0) {
      const salt = generateSecureHex(16);
      const passwordHash = await computeSaltedHash(candidatePassword, salt);
      users[idx] = {
        ...users[idx],
        salt,
        passwordHash,
      };
      delete users[idx].password;
      writeJson(USERS_KEY, users);
    }
    return true;
  }

  return false;
};

/* ── Auth API ── */

const auth = {
  async me() {
    const user = getCurrentUser();
    if (!user) throw new Error('Not signed in');
    return user;
  },

  async loginViaEmailPassword(email, password) {
    const normalizedEmail = email.trim().toLowerCase();
    const users = getUsers();
    const user = users.find((candidate) => candidate.email?.toLowerCase() === normalizedEmail);

    if (!user) {
      throw new Error('Incorrect email or password');
    }

    const isValid = await verifyPassword(user, password);
    if (!isValid) {
      throw new Error('Incorrect email or password');
    }

    createSession(user);
    return sanitizeUser(user);
  },

  async register({ email, password }) {
    const normalizedEmail = email.trim().toLowerCase();
    if (getUsers().some((user) => user.email?.toLowerCase() === normalizedEmail)) {
      throw new Error('An account already exists for this email');
    }

    const salt = generateSecureHex(16);
    const passwordHash = await computeSaltedHash(password, salt);

    writeJson(PENDING_REGISTRATION_KEY, {
      email: normalizedEmail,
      passwordHash,
      salt,
      createdAt: Date.now(),
    });

    return { email: normalizedEmail };
  },

  async verifyOtp({ email }) {
    const normalizedEmail = email.trim().toLowerCase();
    const pending = readJson(PENDING_REGISTRATION_KEY, null);

    if (!pending || pending.email !== normalizedEmail) {
      throw new Error('Registration session expired or invalid');
    }

    const user = {
      id: crypto.randomUUID(),
      email: normalizedEmail,
      salt: pending.salt,
      passwordHash: pending.passwordHash,
      onboarding_complete: false,
      createdAt: Date.now(),
    };

    writeJson(USERS_KEY, [...getUsers(), user]);
    localStorage.removeItem(PENDING_REGISTRATION_KEY);
    createSession(user);
    return sanitizeUser(user);
  },

  async resendOtp() {
    return { ok: true };
  },

  setToken() {},

  async resetPasswordRequest(email) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = getUsers().find((u) => u.email?.toLowerCase() === normalizedEmail);
    if (!user) return { ok: true };

    const resetToken = crypto.randomUUID();
    const tokens = readJson(RESET_TOKENS_KEY, []);
    tokens.push({
      token: resetToken,
      email: normalizedEmail,
      expiresAt: Date.now() + RESET_TOKEN_TTL_MS,
      used: false,
    });
    writeJson(RESET_TOKENS_KEY, tokens);

    return { ok: true, resetToken };
  },

  async resetPassword({ resetToken, newPassword }) {
    if (!resetToken) throw new Error('Invalid reset link');

    const tokens = readJson(RESET_TOKENS_KEY, []);
    const now = Date.now();
    const tokenRecord = tokens.find((t) => t.token === resetToken && !t.used && t.expiresAt > now);

    const targetEmail = tokenRecord ? tokenRecord.email : null;

    if (!targetEmail) {
      throw new Error('Reset link is invalid or has expired. Please request a new one.');
    }

    const users = getUsers();
    const userIndex = users.findIndex((u) => u.email?.toLowerCase() === targetEmail);
    if (userIndex < 0) throw new Error('Account not found');

    const salt = generateSecureHex(16);
    const passwordHash = await computeSaltedHash(newPassword, salt);

    users[userIndex] = {
      ...users[userIndex],
      salt,
      passwordHash,
    };
    delete users[userIndex].password;
    writeJson(USERS_KEY, users);

    // Invalidate the reset token
    if (tokenRecord) {
      tokenRecord.used = true;
      writeJson(RESET_TOKENS_KEY, tokens);
    }

    return sanitizeUser(users[userIndex]);
  },

  async updateMe(updates) {
    const session = getCurrentSession();
    if (!session) throw new Error('Not signed in');

    const users = getUsers();
    const userIndex = users.findIndex((u) => u.id === session.userId || u.email === session.email);
    if (userIndex < 0) throw new Error('User not found');

    // Prevent overwriting sensitive credential fields via updateMe
    const { password, passwordHash, salt, id, email, createdAt, ...safeUpdates } = updates;

    users[userIndex] = { ...users[userIndex], ...safeUpdates };
    writeJson(USERS_KEY, users);
    return sanitizeUser(users[userIndex]);
  },

  loginWithProvider() {
    throw new Error('Social sign-in is not configured yet');
  },

  logout() {
    const token = localStorage.getItem(SESSION_TOKEN_KEY);
    if (token) {
      const activeSessions = getSessions().filter((s) => s.token !== token);
      writeJson(SESSIONS_KEY, activeSessions);
      localStorage.removeItem(SESSION_TOKEN_KEY);
    }
    localStorage.removeItem(LEGACY_SESSION_KEY);
  },
};

/* Personal account separation in the preview; production needs database rules. */
const personalEntities = new Set(['Subject', 'Topic', 'Exam', 'StudyLog', 'Question', 'Bookmark', 'Project', 'PracticeSession']);
const readEntities = (name) => readJson(`visionary_entity_${name}`, []);
const notifyChange = () => window.dispatchEvent(new CustomEvent('visionary:workspace-change'));
const visibleRecords = (name, ownerEmail) => {
  const currentUser = getCurrentUser();
  if (name === 'User') return getUsers().map(({ id, email }) => ({ id, email }));
  if (!currentUser) return [];
  if (!personalEntities.has(name)) return readEntities(name);
  const owner = ownerEmail || currentUser.email;
  if (owner !== currentUser.email) {
    const shared = ['Subject', 'Topic', 'StudyLog'].includes(name) && currentUser.identity === 'parent' &&
      readEntities('FamilyLink').some((link) => link.parent_email === currentUser.email && link.child_email === owner && link.status === 'active');
    if (!shared) return [];
  }
  return readEntities(name).filter((record) => (record.owner_email || record.student_email) === owner);
};
const sortedRecords = (records, sort, limit) => {
  const result = [...records];
  if (sort) {
    const field = sort.replace(/^-/, '');
    const direction = sort.startsWith('-') ? -1 : 1;
    result.sort((a, b) => {
      const left = a[field] ?? (field === 'created_date' ? a.createdAt : '') ?? '';
      const right = b[field] ?? (field === 'created_date' ? b.createdAt : '') ?? '';
      return (typeof left === 'number' && typeof right === 'number' ? left - right : String(left).localeCompare(String(right), undefined, { numeric: true })) * direction;
    });
  }
  return Number.isFinite(limit) ? result.slice(0, Math.max(0, limit)) : result;
};
const prepareRecord = (name, record) => {
  const currentUser = getCurrentUser();
  if (!currentUser) throw new Error('Please sign in to save changes.');
  if (name === 'User') throw new Error('Use account settings to change your profile.');
  return { ...record, id: crypto.randomUUID(), createdAt: Date.now(), created_date: new Date().toISOString(),
    ...(personalEntities.has(name) ? { owner_email: currentUser.email } : {}) };
};
const entityStore = new Proxy({}, {
  get: (_target, name) => ({
    async list(sort, limit) { return sortedRecords(visibleRecords(name), sort, limit); },
    async filter(filters = {}, sort, limit) {
      return sortedRecords(visibleRecords(name, filters.owner_email).filter((record) =>
        Object.entries(filters).every(([key, value]) => record[key] === value)), sort, limit);
    },
    async get(id) { return visibleRecords(name).find((record) => record.id === id) || null; },
    async create(record) {
      const created = prepareRecord(name, record);
      writeJson(`visionary_entity_${name}`, [...readEntities(name), created]);
      notifyChange();
      return created;
    },
    async bulkCreate(newRecords) {
      const created = newRecords.map((record) => prepareRecord(name, record));
      writeJson(`visionary_entity_${name}`, [...readEntities(name), ...created]);
      notifyChange();
      return created;
    },
    async update(id, updates) {
      if (name === 'User' || !getCurrentUser() || !visibleRecords(name).some((record) => record.id === id)) throw new Error('This record is not available in your workspace.');
      const { id: ignoredId, owner_email: ignoredOwner, ...fields } = updates;
      const updated = readEntities(name).map((record) => record.id === id ? { ...record, ...fields } : record);
      writeJson(`visionary_entity_${name}`, updated);
      notifyChange();
      return updated.find((record) => record.id === id);
    },
    async delete(id) {
      if (name === 'User' || !getCurrentUser() || !visibleRecords(name).some((record) => record.id === id)) throw new Error('This record is not available in your workspace.');
      writeJson(`visionary_entity_${name}`, readEntities(name).filter((record) => record.id !== id));
      notifyChange();
    },
  }),
});

export const appClient = {
  auth,
  entities: entityStore,
  integrations: {
    Core: {
      async InvokeLLM() {
        throw new Error('AI responses are not available yet. Your workspace and saved questions are still available.');
      },
    },
  },
};
