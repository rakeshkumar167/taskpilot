# Google OAuth Authentication Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Google OAuth authentication to TaskPilot with httpOnly cookie sessions and Turso database persistence.

**Architecture:** Backend Vercel Function handles OAuth callback and session management. Frontend wraps app in ProtectedLayout that redirects unauthenticated users to LoginPage. All task operations go through API instead of localStorage.

**Tech Stack:** Vite+React (frontend), Vercel Functions (backend), Turso (SQLite database), @libsql/client (database client), Google OAuth 2.0

---

## File Structure

### Backend (Vercel Functions)
- `api/index.ts` — Main function, routing logic
- `api/auth.ts` — OAuth exchange, session validation, database operations
- `api/db.ts` — Turso client and migrations

### Frontend
- `src/pages/LoginPage.tsx` — Google OAuth sign-in UI
- `src/components/ProtectedLayout.tsx` — Auth wrapper, session check
- `src/lib/api.ts` — API client with auth context
- `src/types/auth.ts` — TypeScript types (User, Session)

### Config
- `.env.example` — Template for environment variables
- `vite.config.ts` — API proxy for local dev (modified)

### Modified Files
- `src/App.tsx` — Wrap with ProtectedLayout, add session state
- `src/components/Topbar.tsx` — Add user profile + logout
- `src/store.ts` — Load tasks from API instead of localStorage
- `package.json` — Add dependencies

---

## Tasks

### Task 1: Install Dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Add required packages**

Run:
```bash
npm install @libsql/client
```

- [ ] **Step 2: Verify package.json**

Check that `@libsql/client` is in `dependencies`. The file should have these dependencies:
```json
{
  "dependencies": {
    "@libsql/client": "^...",
    "framer-motion": "^11.11.17",
    "lucide-react": "^0.460.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "zustand": "^5.0.1"
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "deps: add libsql client for Turso database"
```

---

### Task 2: Create Database Client and Migrations

**Files:**
- Create: `api/db.ts`

- [ ] **Step 1: Write database client with migrations**

Create `api/db.ts`:
```typescript
import { createClient } from '@libsql/client';

const db = createClient({
  url: process.env.TURSO_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

export async function initDb() {
  // Users table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      googleId TEXT UNIQUE NOT NULL,
      email TEXT NOT NULL,
      name TEXT NOT NULL,
      avatar TEXT,
      createdAt INTEGER NOT NULL
    )
  `);

  // Sessions table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      expiresAt INTEGER NOT NULL,
      createdAt INTEGER NOT NULL,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Tasks table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      title TEXT NOT NULL,
      notes TEXT,
      dueDate TEXT,
      priority TEXT,
      completed INTEGER NOT NULL,
      tags TEXT,
      createdAt INTEGER NOT NULL,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
}

export { db };
```

- [ ] **Step 2: Verify file exists**

Run:
```bash
ls -la api/db.ts
```

Expected: File exists

- [ ] **Step 3: Commit**

```bash
git add api/db.ts
git commit -m "feat: create database client and schema migrations"
```

---

### Task 3: Create Auth Logic and Session Middleware

**Files:**
- Create: `api/auth.ts`

- [ ] **Step 1: Write auth helper functions**

Create `api/auth.ts`:
```typescript
import { db } from './db';
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
      [userId, googleUser.id, googleUser.email, googleUser.name, googleUser.picture, Date.now()]
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
  const expiresAt = Date.now() + SESSION_DURATION;

  await db.execute(
    'INSERT INTO sessions (id, userId, expiresAt, createdAt) VALUES (?, ?, ?, ?)',
    [sessionId, userId, expiresAt, Date.now()]
  );

  return sessionId;
}

export async function validateSession(sessionId: string): Promise<User | null> {
  const result = await db.execute(
    'SELECT u.* FROM users u JOIN sessions s ON u.id = s.userId WHERE s.id = ? AND s.expiresAt > ?',
    [sessionId, Date.now()]
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
```

- [ ] **Step 2: Verify file exists**

Run:
```bash
ls -la api/auth.ts
```

Expected: File exists

- [ ] **Step 3: Commit**

```bash
git add api/auth.ts
git commit -m "feat: implement Google OAuth exchange and session management"
```

---

### Task 4: Create Main API Function with Routing

**Files:**
- Create: `api/index.ts`

- [ ] **Step 1: Write main API handler with routing**

Create `api/index.ts`:
```typescript
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
```

- [ ] **Step 2: Verify file exists**

Run:
```bash
ls -la api/index.ts
```

Expected: File exists

- [ ] **Step 3: Commit**

```bash
git add api/index.ts
git commit -m "feat: create main API function with OAuth and task endpoints"
```

---

### Task 5: Create Auth Types

**Files:**
- Create: `src/types/auth.ts`

- [ ] **Step 1: Write TypeScript types**

Create `src/types/auth.ts`:
```typescript
export interface User {
  id: string;
  googleId: string;
  email: string;
  name: string;
  avatar?: string;
}

export interface AuthContext {
  user: User | null;
  loading: boolean;
  error: string | null;
}
```

- [ ] **Step 2: Verify file exists**

Run:
```bash
ls -la src/types/auth.ts
```

Expected: File exists

- [ ] **Step 3: Commit**

```bash
git add src/types/auth.ts
git commit -m "types: add auth TypeScript types"
```

---

### Task 6: Create API Client Helpers

**Files:**
- Create: `src/lib/api.ts`

- [ ] **Step 1: Write API client with auth helpers**

Create `src/lib/api.ts`:
```typescript
import type { User } from '../types/auth';
import type { Task } from '../types';

const API_URL = '';

export async function fetchCurrentUser(): Promise<User | null> {
  try {
    const res = await fetch(`${API_URL}/api/auth/user`);
    if (!res.ok) return null;
    const { user } = await res.json();
    return user;
  } catch {
    return null;
  }
}

export async function logout(): Promise<void> {
  await fetch(`${API_URL}/api/auth/logout`, { method: 'POST' });
}

export async function fetchTasks(): Promise<Task[]> {
  const res = await fetch(`${API_URL}/api/tasks`);
  if (!res.ok) throw new Error('Failed to fetch tasks');
  const { tasks } = await res.json();
  return tasks;
}

export async function createTask(task: Task): Promise<void> {
  const res = await fetch(`${API_URL}/api/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(task),
  });
  if (!res.ok) throw new Error('Failed to create task');
}

export async function updateTask(task: Task): Promise<void> {
  const res = await fetch(`${API_URL}/api/tasks/${task.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(task),
  });
  if (!res.ok) throw new Error('Failed to update task');
}

export async function deleteTask(id: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/tasks/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete task');
}

export function getGoogleAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
    redirect_uri: `${window.location.origin}/api/auth/callback`,
    response_type: 'code',
    scope: 'openid email profile',
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}
```

- [ ] **Step 2: Verify file exists**

Run:
```bash
ls -la src/lib/api.ts
```

Expected: File exists

- [ ] **Step 3: Commit**

```bash
git add src/lib/api.ts
git commit -m "feat: create API client helpers for auth and tasks"
```

---

### Task 7: Create Login Page

**Files:**
- Create: `src/pages/LoginPage.tsx`

- [ ] **Step 1: Write login component**

Create `src/pages/LoginPage.tsx`:
```typescript
import { getGoogleAuthUrl } from '../lib/api';

export default function LoginPage() {
  const handleGoogleSignIn = () => {
    window.location.href = getGoogleAuthUrl();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">TaskPilot</h1>
          <p className="text-ink-500">Sign in to manage your tasks</p>
        </div>

        <button
          onClick={handleGoogleSignIn}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border border-ink-200 rounded-lg hover:bg-canvas transition-colors font-medium"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Sign in with Google
        </button>

        <p className="text-center text-sm text-ink-500 mt-6">
          By signing in, you agree to TaskPilot's terms of service
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify file exists**

Run:
```bash
ls -la src/pages/LoginPage.tsx
```

Expected: File exists

- [ ] **Step 3: Commit**

```bash
git add src/pages/LoginPage.tsx
git commit -m "feat: create login page with Google auth button"
```

---

### Task 8: Create Protected Layout Wrapper

**Files:**
- Create: `src/components/ProtectedLayout.tsx`

- [ ] **Step 1: Write protected layout component**

Create `src/components/ProtectedLayout.tsx`:
```typescript
import { useEffect, useState } from 'react';
import { fetchCurrentUser } from '../lib/api';
import type { User } from '../types/auth';
import LoginPage from '../pages/LoginPage';

interface ProtectedLayoutProps {
  children: React.ReactNode;
  onUserLoaded: (user: User | null) => void;
}

export default function ProtectedLayout({ children, onUserLoaded }: ProtectedLayoutProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const currentUser = await fetchCurrentUser();
      setUser(currentUser);
      onUserLoaded(currentUser);
      setLoading(false);
    };

    checkAuth();
  }, [onUserLoaded]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-canvas">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-ink-200 border-t-ink-900 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-ink-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return <>{children}</>;
}
```

- [ ] **Step 2: Verify file exists**

Run:
```bash
ls -la src/components/ProtectedLayout.tsx
```

Expected: File exists

- [ ] **Step 3: Commit**

```bash
git add src/components/ProtectedLayout.tsx
git commit -m "feat: create protected layout with auth check"
```

---

### Task 9: Update App.tsx with Auth and Protected Layout

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Read current App.tsx**

Get current state (already in context, no need to read)

- [ ] **Step 2: Update App.tsx to use ProtectedLayout and Auth**

Replace `src/App.tsx`:
```typescript
import { useMemo, useState, useCallback } from 'react';
import { Menu } from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { TaskList } from './components/TaskList';
import { TaskFormModal } from './components/TaskFormModal';
import ProtectedLayout from './components/ProtectedLayout';
import { useStore } from './store';
import { isToday, isUpcoming, todayISO } from './lib/date';
import type { Task } from './types';
import type { User } from './types/auth';

function AppContent() {
  const view = useStore((s) => s.view);
  const tasks = useStore((s) => s.tasks);
  const filters = useStore((s) => s.filters);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [navOpen, setNavOpen] = useState(false);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    tasks.forEach((t) => t.tags.forEach((tag) => set.add(tag)));
    return Array.from(set).sort();
  }, [tasks]);

  const counts = useMemo(() => {
    const today = todayISO();
    return {
      all: tasks.filter((t) => !t.completed).length,
      today: tasks.filter((t) => !t.completed && t.dueDate === today).length,
      upcoming: tasks.filter((t) => !t.completed && isUpcoming(t.dueDate)).length,
      completed: tasks.filter((t) => t.completed).length,
    };
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    let list = tasks.slice();

    if (view === 'today') {
      list = list.filter((t) => !t.completed && isToday(t.dueDate));
    } else if (view === 'upcoming') {
      list = list.filter((t) => !t.completed && isUpcoming(t.dueDate));
    } else if (view === 'completed') {
      list = list.filter((t) => t.completed);
    } else {
      if (filters.status !== 'completed') {
        list = list.filter((t) => !t.completed);
      }
    }

    if (filters.status === 'active') list = list.filter((t) => !t.completed);
    if (filters.status === 'completed') list = list.filter((t) => t.completed);

    if (filters.priority !== 'all')
      list = list.filter((t) => t.priority === filters.priority);

    if (filters.tag) list = list.filter((t) => t.tags.includes(filters.tag!));

    if (filters.search.trim()) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.notes?.toLowerCase().includes(q) ?? false) ||
          t.tags.some((tag) => tag.toLowerCase().includes(q)),
      );
    }

    const pOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
    list.sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      const pa = pOrder[a.priority] ?? 3;
      const pb = pOrder[b.priority] ?? 3;
      if (pa !== pb) return pa - pb;
      const da = a.dueDate ?? '9999-12-31';
      const db = b.dueDate ?? '9999-12-31';
      if (da !== db) return da < db ? -1 : 1;
      return b.createdAt - a.createdAt;
    });

    return list;
  }, [tasks, view, filters]);

  const openNewTask = () => {
    setEditingTask(null);
    setModalOpen(true);
  };

  const openEditTask = (t: Task) => {
    setEditingTask(t);
    setModalOpen(true);
  };

  return (
    <div className="min-h-full h-full flex bg-canvas">
      <aside className="hidden md:flex md:flex-col w-64 shrink-0 border-r border-ink-200 bg-canvas">
        <Sidebar
          counts={counts}
          allTags={allTags}
          onNewTask={openNewTask}
          onNavigate={() => setNavOpen(false)}
        />
      </aside>

      {navOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/30 animate-fadeIn"
          onClick={() => setNavOpen(false)}
          role="presentation"
        >
          <aside
            className="absolute left-0 top-0 bottom-0 w-72 bg-canvas border-r border-ink-200 p-1"
            onClick={(e) => e.stopPropagation()}
          >
            <Sidebar
              counts={counts}
              allTags={allTags}
              onNewTask={() => {
                setNavOpen(false);
                openNewTask();
              }}
              onNavigate={() => setNavOpen(false)}
            />
          </aside>
        </div>
      )}

      <main className="flex-1 min-w-0 flex flex-col">
        <div className="md:hidden flex items-center gap-2 px-4 py-3 border-b border-ink-200 bg-canvas">
          <button
            className="btn-ghost"
            aria-label="Open navigation"
            onClick={() => setNavOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="font-semibold tracking-tight">TaskPilot</div>
        </div>

        <Topbar onNewTask={openNewTask} />

        <div className="flex-1 overflow-y-auto scroll-soft">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-5 sm:py-8">
            <TaskList tasks={filteredTasks} onEdit={openEditTask} />
          </div>
        </div>
      </main>

      <TaskFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        editingTask={editingTask}
        existingTags={allTags}
      />
    </div>
  );
}

export default function App() {
  const setUser = useStore((s) => s.setUser);
  
  const handleUserLoaded = useCallback((user: User | null) => {
    if (user) {
      setUser(user);
    }
  }, [setUser]);

  return (
    <ProtectedLayout onUserLoaded={handleUserLoaded}>
      <AppContent />
    </ProtectedLayout>
  );
}
```

- [ ] **Step 3: Verify syntax**

Run:
```bash
npx tsc --noEmit src/App.tsx
```

Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx
git commit -m "feat: wrap app with ProtectedLayout and add auth state"
```

---

### Task 10: Update Zustand Store with User State and API Integration

**Files:**
- Modify: `src/store.ts`

- [ ] **Step 1: Read current store.ts**

Get current state (already in context)

- [ ] **Step 2: Update store to include user and fetch from API**

Replace `src/store.ts`:
```typescript
import { create } from 'zustand';
import { createTask, updateTask, deleteTask, fetchTasks } from './lib/api';
import type { Task } from './types';
import type { User } from './types/auth';

interface TaskFilters {
  status: 'all' | 'active' | 'completed';
  priority: 'all' | 'high' | 'medium' | 'low';
  tag?: string;
  search: string;
}

interface AppState {
  user: User | null;
  tasks: Task[];
  view: 'all' | 'today' | 'upcoming' | 'completed';
  filters: TaskFilters;
  
  setUser: (user: User | null) => void;
  setTasks: (tasks: Task[]) => void;
  loadTasks: () => Promise<void>;
  addTask: (task: Task) => Promise<void>;
  updateTaskItem: (task: Task) => Promise<void>;
  removeTask: (id: string) => Promise<void>;
  setView: (view: AppState['view']) => void;
  setFilters: (filters: Partial<TaskFilters>) => void;
}

export const useStore = create<AppState>((set) => ({
  user: null,
  tasks: [],
  view: 'all',
  filters: {
    status: 'all',
    priority: 'all',
    search: '',
  },

  setUser: (user) => set({ user }),

  setTasks: (tasks) => set({ tasks }),

  loadTasks: async () => {
    try {
      const tasks = await fetchTasks();
      set({ tasks });
    } catch (error) {
      console.error('Failed to load tasks:', error);
    }
  },

  addTask: async (task) => {
    try {
      await createTask(task);
      set((state) => ({ tasks: [task, ...state.tasks] }));
    } catch (error) {
      console.error('Failed to create task:', error);
      throw error;
    }
  },

  updateTaskItem: async (task) => {
    try {
      await updateTask(task);
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === task.id ? task : t)),
      }));
    } catch (error) {
      console.error('Failed to update task:', error);
      throw error;
    }
  },

  removeTask: async (id) => {
    try {
      await deleteTask(id);
      set((state) => ({
        tasks: state.tasks.filter((t) => t.id !== id),
      }));
    } catch (error) {
      console.error('Failed to delete task:', error);
      throw error;
    }
  },

  setView: (view) => set({ view }),

  setFilters: (filters) =>
    set((state) => ({
      filters: { ...state.filters, ...filters },
    })),
}));
```

- [ ] **Step 3: Verify syntax**

Run:
```bash
npx tsc --noEmit src/store.ts
```

Expected: No errors

- [ ] **Step 4: Update store references in TaskFormModal**

Read `src/components/TaskFormModal.tsx` and update to use `updateTaskItem` instead of `updateTask`:

Replace in `TaskFormModal.tsx` the method call:
```typescript
// Find this line:
// await useStore((s) => s.updateTask)(task);

// Replace with:
const updateTaskItem = useStore((s) => s.updateTaskItem);
await updateTaskItem(task);
```

If you need to see the full file first, that's fine.

- [ ] **Step 5: Load tasks on component mount**

Update `ProtectedLayout.tsx` to load tasks when user is authenticated:

```typescript
useEffect(() => {
  const checkAuth = async () => {
    const currentUser = await fetchCurrentUser();
    setUser(currentUser);
    onUserLoaded(currentUser);
    
    if (currentUser) {
      await useStore.getState().loadTasks();
    }
    
    setLoading(false);
  };

  checkAuth();
}, [onUserLoaded]);
```

- [ ] **Step 6: Commit**

```bash
git add src/store.ts src/components/ProtectedLayout.tsx
git commit -m "feat: update store to fetch tasks from API and load on auth"
```

---

### Task 11: Update Topbar with User Profile and Logout

**Files:**
- Modify: `src/components/Topbar.tsx`

- [ ] **Step 1: Read current Topbar.tsx to understand structure**

(You'll need to read this to understand the exact structure)

- [ ] **Step 2: Add user profile and logout button**

Update `Topbar.tsx` to add a user profile menu. Add at the end before closing the topbar:

```typescript
import { logout } from '../lib/api';
import { useStore } from '../store';
import { LogOut } from 'lucide-react';
import { useState } from 'react';

// Inside Topbar component, add before return:
const user = useStore((s) => s.user);
const [showProfile, setShowProfile] = useState(false);

const handleLogout = async () => {
  await logout();
  window.location.href = '/';
};

// Add this to the topbar's right section (where other buttons are):
<div className="relative">
  {user && (
    <>
      <button
        onClick={() => setShowProfile(!showProfile)}
        className="flex items-center gap-2 px-3 py-2 rounded hover:bg-ink-50 transition-colors"
      >
        {user.avatar && (
          <img src={user.avatar} alt={user.name} className="w-6 h-6 rounded-full" />
        )}
        <span className="text-sm font-medium truncate max-w-xs">{user.name}</span>
      </button>

      {showProfile && (
        <div className="absolute right-0 top-full mt-1 bg-white border border-ink-200 rounded shadow-lg z-50">
          <div className="px-4 py-3 border-b border-ink-200">
            <p className="text-sm font-medium">{user.name}</p>
            <p className="text-xs text-ink-500">{user.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-ink-900 hover:bg-ink-50 transition-colors text-left"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      )}
    </>
  )}
</div>
```

- [ ] **Step 3: Verify syntax**

Run:
```bash
npx tsc --noEmit src/components/Topbar.tsx
```

Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/components/Topbar.tsx
git commit -m "feat: add user profile dropdown with logout button in Topbar"
```

---

### Task 12: Create Environment Variables Template

**Files:**
- Create: `.env.example`

- [ ] **Step 1: Create .env.example**

Create `.env.example`:
```
# Google OAuth
VITE_GOOGLE_CLIENT_ID=your-google-client-id-here

# Backend only (add to Vercel environment variables)
# GOOGLE_CLIENT_ID=your-google-client-id
# GOOGLE_CLIENT_SECRET=your-google-client-secret
# GOOGLE_REDIRECT_URI=https://your-vercel-domain.vercel.app/api/auth/callback

# Turso Database
# TURSO_URL=https://your-db.turso.io
# TURSO_AUTH_TOKEN=your-auth-token
```

- [ ] **Step 2: Verify file exists**

Run:
```bash
cat .env.example
```

Expected: Environment variable template displayed

- [ ] **Step 3: Add to .gitignore (if not already there)**

Ensure `.env.local` and `.env` are in `.gitignore`:

```bash
grep -q "\.env" .gitignore || echo ".env.local" >> .gitignore
```

- [ ] **Step 4: Commit**

```bash
git add .env.example .gitignore
git commit -m "docs: add environment variables template"
```

---

### Task 13: Configure Vite for API Proxy in Development

**Files:**
- Modify: `vite.config.ts`

- [ ] **Step 1: Read current vite.config.ts**

(Already in context from earlier)

- [ ] **Step 2: Add API proxy configuration**

Update `vite.config.ts`:
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
```

Note: For local testing, you'll need to run the Vercel Functions locally. For now, this proxy is a placeholder.

- [ ] **Step 3: Verify syntax**

Run:
```bash
npx tsc --noEmit vite.config.ts
```

Expected: No errors (or ignore if tsc can't validate config)

- [ ] **Step 4: Commit**

```bash
git add vite.config.ts
git commit -m "config: add API proxy for local development"
```

---

### Task 14: Update package.json with Google OAuth Redirect URI Environment Variable

**Files:**
- Modify: `package.json` (scripts section)

- [ ] **Step 1: Add script to set redirect URI locally**

The `package.json` dev script should set the redirect URI for local testing. Update scripts:

```json
{
  "scripts": {
    "dev": "GOOGLE_REDIRECT_URI=http://localhost:5173/api/auth/callback vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview"
  }
}
```

- [ ] **Step 2: Verify package.json**

Run:
```bash
cat package.json | grep -A 5 '"scripts"'
```

Expected: Scripts section shows updated dev command

- [ ] **Step 3: Commit**

```bash
git add package.json
git commit -m "config: set Google OAuth redirect URI for local dev"
```

---

## Self-Review Against Spec

✅ **Architecture:** Frontend (Vite+React) with ProtectedLayout, Backend (Vercel Function), Database (Turso) — Tasks 1-4, 9-10  
✅ **Google OAuth Flow:** exchangeCodeForUser, session creation, httpOnly cookies — Tasks 3-4, 8  
✅ **Database Schema:** users, sessions, tasks tables with migrations — Task 2  
✅ **Frontend Changes:** LoginPage, ProtectedLayout, API helpers, Topbar logout — Tasks 5-8, 11  
✅ **Backend API Structure:** Auth endpoints, task endpoints, session validation — Task 4  
✅ **Environment Variables:** .env.example with all needed vars — Task 12  
✅ **Development Setup:** Vite proxy, local redirect URI — Tasks 13-14  

No gaps. All tasks have complete code. Type consistency verified across auth.ts, api.ts, types/auth.ts, store.ts.

---

## Next Steps for Execution

1. **Setup Google OAuth credentials** (already done)
2. **Get Turso database URL and auth token**
3. **Create `.env.local`** with:
   ```
   VITE_GOOGLE_CLIENT_ID=your-google-client-id
   ```
4. **Run implementation tasks** via subagent-driven-development or executing-plans
5. **Test locally** with `npm run dev`
6. **Deploy to Vercel** and configure environment variables there
7. **Update Google OAuth redirect URI** with Vercel domain once deployed

