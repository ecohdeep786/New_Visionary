const USERS_KEY = 'visionary_users';
const SESSION_KEY = 'visionary_session';
const PENDING_REGISTRATION_KEY = 'visionary_pending_registration';

const readJson = (key, fallback) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

const writeJson = (key, value) => localStorage.setItem(key, JSON.stringify(value));

const getUsers = () => readJson(USERS_KEY, []);
const getCurrentUser = () => {
  const email = localStorage.getItem(SESSION_KEY);
  return getUsers().find((user) => user.email === email) || null;
};

const auth = {
  async me() {
    const user = getCurrentUser();
    if (!user) throw new Error('Not signed in');
    return user;
  },

  async loginViaEmailPassword(email, password) {
    const user = getUsers().find((candidate) => candidate.email === email && candidate.password === password);
    if (!user) throw new Error('Incorrect email or password');
    localStorage.setItem(SESSION_KEY, user.email);
    return user;
  },

  async register({ email, password }) {
    if (getUsers().some((user) => user.email === email)) {
      throw new Error('An account already exists for this email');
    }
    writeJson(PENDING_REGISTRATION_KEY, { email, password });
    return { email };
  },

  async verifyOtp({ email }) {
    const pending = readJson(PENDING_REGISTRATION_KEY, null);
    if (!pending || pending.email !== email) throw new Error('Registration session expired');
    const user = { id: crypto.randomUUID(), email, password: pending.password, onboarding_complete: false };
    writeJson(USERS_KEY, [...getUsers(), user]);
    localStorage.removeItem(PENDING_REGISTRATION_KEY);
    localStorage.setItem(SESSION_KEY, email);
    return user;
  },

  async resendOtp() {
    return { ok: true };
  },

  setToken() {},

  async resetPasswordRequest(email) {
    if (!getUsers().some((user) => user.email === email)) return { ok: true };
    return { ok: true };
  },

  async resetPassword({ resetToken, newPassword }) {
    if (!resetToken) throw new Error('Invalid reset link');
    const users = getUsers();
    const email = decodeURIComponent(resetToken);
    const userIndex = users.findIndex((user) => user.email === email);
    if (userIndex < 0) throw new Error('Account not found');
    users[userIndex] = { ...users[userIndex], password: newPassword };
    writeJson(USERS_KEY, users);
    return users[userIndex];
  },

  async updateMe(updates) {
    const currentUser = getCurrentUser();
    if (!currentUser) throw new Error('Not signed in');
    const users = getUsers();
    const userIndex = users.findIndex((user) => user.email === currentUser.email);
    users[userIndex] = { ...users[userIndex], ...updates };
    writeJson(USERS_KEY, users);
    return users[userIndex];
  },

  loginWithProvider() {
    throw new Error('Social sign-in is not configured yet');
  },

  logout() {
    localStorage.removeItem(SESSION_KEY);
  },
};

const entityStore = new Proxy({}, {
  get: (_target, entityName) => ({
    async list() {
      return readJson(`visionary_entity_${entityName}`, []);
    },
    async filter(filters = {}) {
      const records = readJson(`visionary_entity_${entityName}`, []);
      return records.filter((record) => Object.entries(filters).every(([key, value]) => record[key] === value));
    },
    async get(id) {
      return readJson(`visionary_entity_${entityName}`, []).find((record) => record.id === id) || null;
    },
    async create(record) {
      const records = readJson(`visionary_entity_${entityName}`, []);
      const created = { id: crypto.randomUUID(), ...record };
      writeJson(`visionary_entity_${entityName}`, [...records, created]);
      return created;
    },
    async update(id, updates) {
      const records = readJson(`visionary_entity_${entityName}`, []);
      const updated = records.map((record) => record.id === id ? { ...record, ...updates } : record);
      writeJson(`visionary_entity_${entityName}`, updated);
      return updated.find((record) => record.id === id) || null;
    },
  }),
});

export const appClient = { auth, entities: entityStore, integrations: { Core: {
  async InvokeLLM() {
    return { answer: 'AI features will be connected to your app service soon.' };
  },
} } };
