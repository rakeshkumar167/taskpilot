# TaskPilot

A modern, lightweight task manager with Google sign-in. Built with React, TypeScript, Vite, Tailwind CSS, Zustand, Framer Motion, and Lucide icons. Backed by Vercel Functions and Turso (SQLite) for per-user data.

## What it does

TaskPilot is a calm space for things you keep meaning to do. Each user signs in with Google and gets a private list of tasks stored in a Turso database.

**Features**
- Sign in with Google (OAuth 2.0 with httpOnly cookie sessions)
- Per-user private tasks stored in Turso
- Create / edit / delete / complete tasks
- Priorities (low / medium / high)
- Due dates with friendly labels (Today, Tomorrow, weekday, etc.)
- Tags with quick-filter chips
- Views: All, Today, Upcoming, Completed
- Recurring tasks (daily / weekly / monthly / custom)
- Search across title, notes, and tags
- Priority + status filters
- Fully responsive (mobile drawer + desktop sidebar)
- Keyboard accessible with focus rings + ARIA labels

## Architecture

- **Frontend** — Vite + React + TypeScript (in `src/`)
- **Backend** — A single Vercel Function in `api/index.ts` handles all `/api/*` routes (auth + tasks). Routing is wired through `vercel.json` rewrites.
- **Auth** — Manual Google OAuth 2.0. Sessions are stored in Turso and tracked via an httpOnly cookie.
- **Database** — Turso (libSQL/SQLite). Schema is auto-created on cold start.

## Running locally

```bash
npm install
npm run dev
```

Then open http://localhost:5173.

For local API testing (the auth flow needs the backend running), use `vercel dev` instead of `npm run dev` so the functions in `api/` execute. You'll need a `.env.local` file (see [Environment variables](#environment-variables) below).

## Build

```bash
npm run build
npm run preview
```

## Step 1 — Create a Google OAuth client

The app uses Google Sign-In via OAuth 2.0. You need to create OAuth credentials in Google Cloud Console.

1. Go to **[Google Cloud Console](https://console.cloud.google.com)** and sign in.
2. Click the project dropdown (top-left) → **New Project** → name it (e.g. "TaskPilot") → **Create**.
3. In the left sidebar, go to **APIs & Services → Library**, search for **"Google+ API"** (or any People API), and click **Enable**.
4. Go to **APIs & Services → OAuth consent screen**:
   - User type: **External** → **Create**
   - Fill in **App name**, **User support email**, and **Developer contact email**
   - Save & Continue through scopes (no extra scopes needed; the app requests `openid`, `email`, `profile`)
   - Add yourself as a **Test user** (or publish the app once you're ready for real users)
5. Go to **APIs & Services → Credentials → Create Credentials → OAuth client ID**:
   - Application type: **Web application**
   - Name: e.g. "TaskPilot Web Client"
   - **Authorized JavaScript origins**:
     - `https://<your-vercel-domain>.vercel.app`
     - `http://localhost:5173` (for local dev)
   - **Authorized redirect URIs**:
     - `https://<your-vercel-domain>.vercel.app/api/auth/callback`
     - `http://localhost:5173/api/auth/callback` (for local dev)
   - Click **Create**
6. Copy the **Client ID** and **Client Secret** — you'll need them for environment variables below.

> Google OAuth is **free** — no charges for authentication.

## Step 2 — Create a Turso database

The app uses Turso for storing users, sessions, and tasks.

1. Sign up at **[turso.tech](https://turso.tech)** (free tier is plenty for personal use).
2. Create a new database in their dashboard.
3. From the database page, copy:
   - The **Database URL** (looks like `libsql://your-db-xxx.turso.io`)
   - An **Auth Token** (create one if needed)

You don't need to run any migrations manually — the schema (users, sessions, tasks) is created automatically on first request.

## Step 3 — Deploy to Vercel

1. Push this repo to GitHub.
2. Import it at **[vercel.com/new](https://vercel.com/new)**. Vercel auto-detects Vite + Vercel Functions.
3. Set the environment variables below in **Vercel → Settings → Environment Variables**.
4. Deploy. After the first deploy, copy your `*.vercel.app` URL and:
   - Add it to **Authorized JavaScript origins** and **Authorized redirect URIs** in your Google OAuth client.
   - Update the `GOOGLE_REDIRECT_URI` environment variable to use the real domain.
   - Redeploy so the new env vars take effect.

## Environment variables

Set all of these in **Vercel → Settings → Environment Variables**. For local dev, put them in a `.env.local` file (already gitignored).

| Name | Where | Value |
|------|-------|-------|
| `VITE_GOOGLE_CLIENT_ID` | Both frontend & backend | Your Google OAuth Client ID. Prefixed with `VITE_` so Vite bundles it into the browser. |
| `GOOGLE_CLIENT_ID` | Backend (Vercel Functions) | Same Client ID — used server-side for the token exchange. |
| `GOOGLE_CLIENT_SECRET` | Backend (Vercel Functions) | Your Google OAuth Client Secret. **Never expose this to the frontend.** |
| `GOOGLE_REDIRECT_URI` | Backend (Vercel Functions) | The full callback URL — `https://<your-vercel-domain>.vercel.app/api/auth/callback` (or `http://localhost:5173/api/auth/callback` locally). |
| `TURSO_URL` | Backend (Vercel Functions) | Your Turso database URL (`libsql://...`). |
| `TURSO_AUTH_TOKEN` | Backend (Vercel Functions) | Your Turso auth token. |

A `.env.example` is included as a template.

> **Important:** after adding or changing env vars on Vercel, you must **redeploy** the project for them to take effect.

## How auth works (briefly)

1. User clicks "Continue with Google" → frontend redirects to Google's OAuth page.
2. Google redirects back to `/api/auth/callback?code=...`.
3. The backend exchanges the code for the user's info, upserts the user in Turso, creates a 30-day session, and sets a `session` httpOnly cookie.
4. The user is redirected to `/` and the cookie is automatically sent on every subsequent API request.
5. `GET /api/auth/user` validates the cookie and returns the current user (or 401).
6. `POST /api/auth/logout` clears the session row and cookie.

## API routes

All under `/api/*`, handled by `api/index.ts` via `vercel.json` rewrites.

- `GET /api/auth/callback` — Google OAuth callback (called by Google, redirects to `/`)
- `GET /api/auth/user` — Returns the current user, or 401
- `POST /api/auth/logout` — Ends the session
- `GET /api/tasks` — List the current user's tasks
- `POST /api/tasks` — Create a task
- `PUT /api/tasks/:id` — Update a task
- `DELETE /api/tasks/:id` — Delete a task

All task endpoints require a valid session cookie.
