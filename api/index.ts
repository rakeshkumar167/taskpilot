import { VercelRequest, VercelResponse } from '@vercel/node';
import { initDb } from './db';
import {
  exchangeCodeForUser,
  createSession,
  validateSession,
  deleteSession,
  setSessionCookie,
  clearSessionCookie,
  getSessionIdFromCookie,
} from './auth';
import { db } from './db';

// Initialize database on cold start
let dbInitialized = false;
async function ensureDbInit() {
  if (!dbInitialized) {
    await initDb();
    dbInitialized = true;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await ensureDbInit();

  const { pathname, query, method } = req;

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Auth: POST /api/auth/callback
    if (pathname === '/api/auth/callback' && method === 'POST') {
      const { code } = query as { code: string };

      if (!code) {
        return res.status(400).json({ error: 'Missing authorization code' });
      }

      const user = await exchangeCodeForUser(code);
      const sessionId = await createSession(user.id);

      res.setHeader('Set-Cookie', setSessionCookie(sessionId));
      return res.status(200).json({ user });
    }

    // Auth: GET /api/auth/user
    if (pathname === '/api/auth/user' && method === 'GET') {
      const sessionId = getSessionIdFromCookie(req.headers.cookie);

      if (!sessionId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const user = await validateSession(sessionId);

      if (!user) {
        return res.status(401).json({ error: 'Session expired' });
      }

      return res.status(200).json({ user });
    }

    // Auth: POST /api/auth/logout
    if (pathname === '/api/auth/logout' && method === 'POST') {
      const sessionId = getSessionIdFromCookie(req.headers.cookie);

      if (sessionId) {
        await deleteSession(sessionId);
      }

      res.setHeader('Set-Cookie', clearSessionCookie());
      return res.status(200).json({ success: true });
    }

    // Task: GET /api/tasks
    if (pathname === '/api/tasks' && method === 'GET') {
      const sessionId = getSessionIdFromCookie(req.headers.cookie);
      if (!sessionId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const user = await validateSession(sessionId);
      if (!user) {
        return res.status(401).json({ error: 'Session expired' });
      }

      const result = await db.execute(
        'SELECT * FROM tasks WHERE userId = ? ORDER BY createdAt DESC',
        [user.id]
      );

      const tasks = result.rows.map((row: any) => ({
        ...row,
        completed: Boolean(row.completed),
        tags: row.tags ? JSON.parse(row.tags) : [],
      }));

      return res.status(200).json({ tasks });
    }

    // Task: POST /api/tasks
    if (pathname === '/api/tasks' && method === 'POST') {
      const sessionId = getSessionIdFromCookie(req.headers.cookie);
      if (!sessionId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const user = await validateSession(sessionId);
      if (!user) {
        return res.status(401).json({ error: 'Session expired' });
      }

      const { id, title, notes, dueDate, priority, tags } = req.body;

      await db.execute(
        'INSERT INTO tasks (id, userId, title, notes, dueDate, priority, completed, tags, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [id, user.id, title, notes, dueDate, priority, 0, JSON.stringify(tags), Date.now()]
      );

      return res.status(201).json({ id });
    }

    // Task: PUT /api/tasks/:id
    if (pathname.startsWith('/api/tasks/') && method === 'PUT') {
      const sessionId = getSessionIdFromCookie(req.headers.cookie);
      if (!sessionId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const user = await validateSession(sessionId);
      if (!user) {
        return res.status(401).json({ error: 'Session expired' });
      }

      const taskId = pathname.split('/').pop();
      const { title, notes, dueDate, priority, completed, tags } = req.body;

      await db.execute(
        'UPDATE tasks SET title = ?, notes = ?, dueDate = ?, priority = ?, completed = ?, tags = ? WHERE id = ? AND userId = ?',
        [title, notes, dueDate, priority, completed ? 1 : 0, JSON.stringify(tags), taskId, user.id]
      );

      return res.status(200).json({ success: true });
    }

    // Task: DELETE /api/tasks/:id
    if (pathname.startsWith('/api/tasks/') && method === 'DELETE') {
      const sessionId = getSessionIdFromCookie(req.headers.cookie);
      if (!sessionId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const user = await validateSession(sessionId);
      if (!user) {
        return res.status(401).json({ error: 'Session expired' });
      }

      const taskId = pathname.split('/').pop();

      await db.execute('DELETE FROM tasks WHERE id = ? AND userId = ?', [taskId, user.id]);

      return res.status(200).json({ success: true });
    }

    return res.status(404).json({ error: 'Not found' });
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
