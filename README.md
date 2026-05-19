# TaskPilot

A modern, lightweight, mobile-friendly task manager. Built with React, TypeScript, Vite, Tailwind CSS, Zustand, Framer Motion, and Lucide icons. Persists data to `localStorage` (Phase 1).

## Getting started

```bash
npm install
npm run dev
```

Then open http://localhost:5173.

## Build

```bash
npm run build
npm run preview
```

## Deploy to Vercel

This is a static Vite app. Either:

- Run `vercel` in this directory, or
- Push to a Git repo and import it on https://vercel.com.

Vercel auto-detects Vite. No additional config needed.

## Features

- Create / edit / delete / complete tasks
- Priorities (low / medium / high)
- Due dates with friendly labels (Today, Tomorrow, weekday, etc.)
- Tags with quick-filter chips
- Views: All, Today, Upcoming, Completed
- Search across title, notes, and tags
- Priority + status filters
- Fully responsive (mobile drawer + desktop sidebar)
- Keyboard accessible with focus rings + ARIA labels
- Data persists locally — no account required
