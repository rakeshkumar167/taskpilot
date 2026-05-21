import { VercelRequest, VercelResponse } from '@vercel/node';
import { initDb } from './db.js';
import {
  exchangeCodeForUser,
  createSession,
  validateSession,
  deleteSession,
  setSessionCookie,
  clearSessionCookie,
  getSessionIdFromCookie,
} from './auth.js';
import { db } from './db.js';

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

  const method = req.method;
  const url = req.url || '';
  let pathname = url.split('?')[0];
  // Ensure pathname starts with /api for route matching
  if (!pathname.startsWith('/api')) {
    pathname = `/api${pathname.startsWith('/') ? '' : '/'}${pathname}`;
  }
  const query = req.query;

  console.log('Request:', { method, pathname, url });

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Auth: GET /api/auth/callback (Google OAuth redirect)
    if (pathname === '/api/auth/callback' && method === 'GET') {
      const { code } = query as { code: string };

      if (!code) {
        return res.status(400).json({ error: 'Missing authorization code' });
      }

      try {
        const user = await exchangeCodeForUser(code);
        const sessionId = await createSession(user.id);

        res.setHeader('Set-Cookie', setSessionCookie(sessionId));
        // Redirect back to app after successful auth
        return res.redirect(302, '/');
      } catch (error) {
        console.error('OAuth exchange failed:', error);
        return res.redirect(302, '/?error=oauth_failed');
      }
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

      const result = await db.execute({
        sql: 'SELECT * FROM tasks WHERE userId = ? ORDER BY createdAt DESC',
        args: [user.id],
      });

      const tasks = result.rows.map((row: any) => ({
        id: String(row.id),
        title: String(row.title),
        notes: row.notes ? String(row.notes) : undefined,
        dueDate: row.dueDate ? String(row.dueDate) : undefined,
        priority: String(row.priority),
        completed: Boolean(row.completed),
        tags: row.tags ? JSON.parse(String(row.tags)) : [],
        createdAt: Number(row.createdAt),
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

      const { id, title, notes, dueDate, priority, tags, createdAt } = req.body;

      await db.execute({
        sql: 'INSERT INTO tasks (id, userId, title, notes, dueDate, priority, completed, tags, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        args: [
          id,
          user.id,
          title,
          notes ?? null,
          dueDate ?? null,
          priority,
          0,
          JSON.stringify(tags ?? []),
          createdAt ?? Date.now(),
        ],
      });

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

      await db.execute({
        sql: 'UPDATE tasks SET title = ?, notes = ?, dueDate = ?, priority = ?, completed = ?, tags = ? WHERE id = ? AND userId = ?',
        args: [
          title,
          notes ?? null,
          dueDate ?? null,
          priority,
          completed ? 1 : 0,
          JSON.stringify(tags ?? []),
          taskId ?? '',
          user.id,
        ],
      });

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
