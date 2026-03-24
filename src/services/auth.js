import crypto from 'crypto';
import { storage } from '../storage/index.js';
import { sendMagicLinkEmail } from './email.js';
import { validateEmployeeEmail, getEmployeeByEmail } from './teachworks.js';

const MAGIC_LINK_EXPIRY_MS = 15 * 60 * 1000;  // 15 minutes
const SESSION_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours
const RATE_LIMIT_WINDOW_MS = 6 * 60 * 1000;    // 6 minutes
const RATE_LIMIT_MAX = 5;

function checkRateLimit(email) {
  const now = Date.now();
  const record = storage.getRateLimit(email);

  if (!record || now - record.windowStart > RATE_LIMIT_WINDOW_MS) {
    storage.setRateLimit(email, 1, now);
    return true;
  }

  if (record.count >= RATE_LIMIT_MAX) return false;

  storage.setRateLimit(email, record.count + 1, record.windowStart);
  return true;
}

export async function requestMagicLink(email) {
  if (!checkRateLimit(email)) {
    throw new Error('Too many requests. Please wait a few minutes before trying again.');
  }

  const { isValid, employee } = await validateEmployeeEmail(email);
  if (!isValid) {
    throw new Error('This email is not registered as a tutor.');
  }

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + MAGIC_LINK_EXPIRY_MS);
  storage.saveMagicToken(token, email, expiresAt);

  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  const magicLink = `${baseUrl}/verify?token=${token}`;

  await sendMagicLinkEmail(email, magicLink);
  console.log(`Magic link sent to ${email}`);
}

export async function verifyMagicLink(token) {
  console.log('verifyMagicLink called, token prefix:', token.slice(0, 10));
  const record = storage.getMagicToken(token);
  console.log('record found:', record);

  if (!record || record.used) {
    throw new Error('Invalid or already-used login link.');
  }
  if (new Date() > record.expiresAt) {
    throw new Error('Login link has expired. Please request a new one.');
  }

  storage.markTokenUsed(token);

  const user = storage.getOrCreateUser(record.email);

  // Fetch the employee record to store their Teachworks ID in the session
  const employee = await getEmployeeByEmail(record.email);

  const sessionToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_EXPIRY_MS);
  storage.saveSession(sessionToken, user.id, record.email, expiresAt, employee?.id);
  console.log('Session saved, token prefix:', sessionToken.slice(0, 10));

  return { sessionToken, email: record.email, employeeId: employee?.id };
}

export function validateSession(token) {
  if (!token) return null;
  const session = storage.getSession(token);
  if (!session) return null;
  if (new Date() > session.expiresAt) {
    storage.deleteSession(token);
    return null;
  }
  return session;
}

export function logout(token) {
  storage.deleteSession(token);
}
