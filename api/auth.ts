import { db } from './db.js';
import crypto from 'crypto';

const SESSION_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days

export interface User {
  id: string;
  googleId: string;
  email: string;
  name: string;
  avatar?: string;
}

export async function exchangeCodeForUser(code: string): Promise<User> {
  const tokenUrl = 'https://oauth2.googleapis.com/token';
  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
      grant_type: 'authorization_code',
    }).toString(),
  });

  if (!response.ok) {
    throw new Error(`Token exchange failed: ${response.statusText}`);
  }

  const { access_token } = await response.json();

  // Get user info from Google
  const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${access_token}` },
  });

  if (!userRes.ok) {
    throw new Error('Failed to fetch user info');
  }

  const googleUser = await userRes.json();

  // Find or create user in database
  let user = await db.execute(
    'SELECT * FROM users WHERE googleId = ?',
    [googleUser.id]
  );

  if (user.rows.length === 0) {
    const userId = crypto.randomUUID();
    await db.execute(
      'INSERT INTO users (id, googleId, email, name, avatar, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, googleUser.id, googleUser.email, googleUser.name, googleUser.picture, Date.now().toString()]
    );
    user = await db.execute('SELECT * FROM users WHERE id = ?', [userId]);
  }

  return {
    id: user.rows[0].id,
    googleId: user.rows[0].googleId,
    email: user.rows[0].email,
    name: user.rows[0].name,
    avatar: user.rows[0].avatar,
  };
}

export async function createSession(userId: string): Promise<string> {
  const sessionId = crypto.randomUUID();
  const expiresAt = Date.now().toString() + SESSION_DURATION;

  await db.execute(
    'INSERT INTO sessions (id, userId, expiresAt, createdAt) VALUES (?, ?, ?, ?)',
    [sessionId, userId, expiresAt, Date.now().toString()]
  );

  return sessionId;
}

export async function validateSession(sessionId: string): Promise<User | null> {
  const result = await db.execute(
    'SELECT u.* FROM users u JOIN sessions s ON u.id = s.userId WHERE s.id = ? AND s.expiresAt > ?',
    [sessionId, Date.now().toString()]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return {
    id: result.rows[0].id,
    googleId: result.rows[0].googleId,
    email: result.rows[0].email,
    name: result.rows[0].name,
    avatar: result.rows[0].avatar,
  };
}

export async function deleteSession(sessionId: string): Promise<void> {
  await db.execute('DELETE FROM sessions WHERE id = ?', [sessionId]);
}

export function setSessionCookie(sessionId: string): string {
  const maxAge = SESSION_DURATION / 1000; // Convert to seconds
  return `session=${sessionId}; Max-Age=${maxAge}; Path=/; HttpOnly; SameSite=Lax`;
}

export function clearSessionCookie(): string {
  return 'session=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax';
}

export function getSessionIdFromCookie(cookieHeader?: string): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(/session=([^;]+)/);
  return match ? match[1] : null;
}
