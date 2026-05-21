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
