# Google OAuth Authentication Design
**Date:** 2026-05-22  
**Project:** TaskPilot  
**Scope:** Add Google OAuth authentication with Turso database persistence

---

## Architecture Overview

TaskPilot will have three components:
- **Frontend (Vite+React):** Login page, protected task views, API calls with httpOnly cookies
- **Backend (Vercel Function):** Google OAuth callback, session management, task API endpoints
- **Database (Turso):** Users, sessions, and tasks tables

Users authenticate via Google OAuth, receive an httpOnly cookie for session management, and can only see their own private tasks.

---

## Google OAuth Flow

1. User clicks "Sign in with Google" button
2. Frontend redirects to Google's login page (using Client ID)
3. User authenticates with Google
4. Google redirects to backend: `POST /api/auth/callback?code=...`
5. Backend exchanges code for user info from Google
6. Backend creates/finds user in Turso database
7. Backend creates a session record in Turso
8. Backend sets httpOnly cookie with session ID
9. Backend redirects user back to app
10. Frontend automatically includes cookie on all API requests

No custom domain required — Vercel's built-in domain works with Google OAuth.

---

## Database Schema (Turso)

### `users` table
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  googleId TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  avatar TEXT,
  createdAt INTEGER NOT NULL
);
```

### `sessions` table
```sql
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  expiresAt INTEGER NOT NULL,
  createdAt INTEGER NOT NULL,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);
```

### `tasks` table (migrated from localStorage)
```sql
CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  title TEXT NOT NULL,
  notes TEXT,
  dueDate TEXT,
  priority TEXT,
  completed BOOLEAN,
  tags TEXT,
  createdAt INTEGER NOT NULL,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);
```

Session expiration: 30 days. Middleware validates on each request.

---

## Frontend Changes

### New Components
- **`LoginPage.tsx`:** Displays "Sign in with Google" button using Google's OAuth button
- **`ProtectedLayout.tsx`:** Wrapper that checks if user is authenticated; redirects to login if not
- **`api.ts`:** Helper functions to call backend endpoints with automatic auth

### Modified Components
- **`App.tsx`:** Wrap with ProtectedLayout; add logout button in Topbar
- **`Topbar.tsx`:** Add user profile dropdown with logout

### Auth Flow
- On app load, frontend calls `GET /api/auth/user` to check session
- If valid, render TaskList
- If invalid (401), redirect to LoginPage
- On logout, call `POST /api/auth/logout` to clear cookie

### Environment Variables
```
VITE_GOOGLE_CLIENT_ID=<client-id>
```

All API calls use relative URLs: `/api/tasks`, `/api/auth/user`, etc.

---

## Backend API Structure

Single Vercel Function at `api/index.ts` with routing:

### Auth Endpoints
- `POST /api/auth/callback` — Handle Google OAuth callback (no auth required)
- `GET /api/auth/user` — Return current user from session cookie
- `POST /api/auth/logout` — Clear session and cookie

### Task Endpoints (Auth required)
- `GET /api/tasks` — List user's tasks
- `POST /api/tasks` — Create task
- `PUT /api/tasks/:id` — Update task
- `DELETE /api/tasks/:id` — Delete task

All endpoints (except callback) validate the session cookie. If missing or invalid, return 401.

### Middleware
- `validateSession(req)` — Extract and validate session ID from httpOnly cookie
- `requireAuth(handler)` — Middleware to protect endpoints

### Environment Variables (Vercel)
```
GOOGLE_CLIENT_ID=<client-id>
GOOGLE_CLIENT_SECRET=<client-secret>
TURSO_URL=<database-url>
TURSO_AUTH_TOKEN=<auth-token>
```

---

## Implementation Approach

**Phase 1: Backend Setup**
- Install dependencies (node-fetch for Google OAuth, @libsql/client for Turso)
- Create Vercel Function with auth endpoints
- Set up database schema
- Implement session validation middleware

**Phase 2: Frontend Auth**
- Create LoginPage with Google OAuth button
- Create ProtectedLayout wrapper
- Update App.tsx to use ProtectedLayout
- Add logout button to Topbar

**Phase 3: Task API Integration**
- Update Zustand store to fetch tasks from backend
- Modify task creation/update/delete to use API
- Migrate localStorage tasks to Turso on first login

**Phase 4: Testing & Deployment**
- Test locally with Vite dev server
- Deploy to Vercel
- Update Google OAuth redirect URIs with production domain
- Verify in production

---

## Key Decisions

| Decision | Reason |
|----------|--------|
| Manual OAuth (vs Auth library) | Simpler for hobby project, full control, minimal dependencies |
| httpOnly cookies | More secure than localStorage for auth tokens |
| Vercel Functions | Scales with traffic, serverless, no server maintenance |
| Turso | Free tier SQLite, easy migrations, works great with Vercel |
| Session expiration: 30 days | Balance between security and user experience |
| Private tasks only | Simpler initial design, can add sharing later |

---

## Success Criteria

- ✅ Users can sign in with Google
- ✅ Sessions persist via httpOnly cookie
- ✅ Tasks are stored per-user in Turso
- ✅ Logout clears session
- ✅ Works on Vercel without custom domain
- ✅ Local development works with `npm run dev`
