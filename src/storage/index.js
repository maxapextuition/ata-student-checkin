// In-memory storage — resets on server restart (fine for short-lived tokens/sessions)
const users = new Map();       // email -> { id, email }
const sessions = new Map();    // token -> { userId, email, expiresAt }
const magicTokens = new Map(); // token -> { email, expiresAt, used }
const rateLimits = new Map();  // email -> { count, windowStart }

let userIdCounter = 1;

export const storage = {
  // Users
  getUserByEmail(email) {
    return [...users.values()].find(u => u.email === email) || null;
  },
  createUser(email) {
    const user = { id: String(userIdCounter++), email };
    users.set(email, user);
    return user;
  },
  getOrCreateUser(email) {
    return this.getUserByEmail(email) || this.createUser(email);
  },

  // Magic link tokens
  saveMagicToken(token, email, expiresAt) {
    magicTokens.set(token, { email, expiresAt, used: false });
    console.log('Token saved, prefix:', token.slice(0, 10), 'map size:', magicTokens.size);
  },
  getMagicToken(token) {
    return magicTokens.get(token) || null;
  },
  markTokenUsed(token) {
    const record = magicTokens.get(token);
    if (record) record.used = true;
  },

  // Sessions
  saveSession(token, userId, email, expiresAt, employeeId) {
    sessions.set(token, { userId, email, expiresAt, employeeId });
  },
  getSession(token) {
    return sessions.get(token) || null;
  },
  deleteSession(token) {
    sessions.delete(token);
  },

  // Rate limits
  getRateLimit(email) {
    return rateLimits.get(email) || null;
  },
  setRateLimit(email, count, windowStart) {
    rateLimits.set(email, { count, windowStart });
  },
};
