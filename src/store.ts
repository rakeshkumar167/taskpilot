import { create } from 'zustand';
import {
  fetchTasks,
  createTask as apiCreateTask,
  updateTask as apiUpdateTask,
  deleteTask as apiDeleteTask,
} from './lib/api';
import type { Filters, Priority, Recurrence, Task, View } from './types';
import type { User } from './types/auth';

interface State {
  tasks: Task[];
  view: View;
  filters: Filters;
  user: User | null;
  setView: (v: View) => void;
  setSearch: (q: string) => void;
  setPriorityFilter: (p: Priority | 'all') => void;
  setStatusFilter: (s: Filters['status']) => void;
  setTagFilter: (tag: string | null) => void;
  clearFilters: () => void;
  setUser: (user: User | null) => void;
  loadTasks: () => Promise<void>;
  addTask: (input: {
    title: string;
    notes?: string;
    priority: Priority;
    dueDate?: string;
    tags: string[];
    recurrence?: Recurrence;
  }) => Promise<void>;
  updateTask: (id: string, patch: Partial<Task>) => Promise<void>;
  toggleTask: (id: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  clearCompleted: () => Promise<void>;
}

const uid = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);

const parseIsoDate = (iso: string): Date => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
};

const toIsoDate = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const advanceDate = (d: Date, recurrence: Recurrence): Date => {
  const next = new Date(d);
  switch (recurrence.frequency) {
    case 'daily':
      next.setDate(next.getDate() + 1);
      break;
    case 'weekly':
      next.setDate(next.getDate() + 7);
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + 1);
      break;
    case 'custom':
      next.setDate(next.getDate() + Math.max(1, recurrence.interval));
      break;
  }
  return next;
};

const MAX_RECURRENCE_INSTANCES = 365;

const expandRecurrence = (
  startIso: string,
  recurrence: Recurrence,
): string[] => {
  const end = parseIsoDate(recurrence.endDate);
  const dates: string[] = [];
  let cursor = parseIsoDate(startIso);
  while (cursor.getTime() <= end.getTime() && dates.length < MAX_RECURRENCE_INSTANCES) {
    dates.push(toIsoDate(cursor));
    cursor = advanceDate(cursor, recurrence);
  }
  return dates;
};

const defaultFilters: Filters = {
  search: '',
  priority: 'all',
  status: 'all',
  tag: null,
};

export const useStore = create<State>((set, get) => ({
  tasks: [],
  view: 'all',
  filters: defaultFilters,
  user: null,
  setView: (v) => set({ view: v }),
  setSearch: (q) => set((s) => ({ filters: { ...s.filters, search: q } })),
  setPriorityFilter: (p) =>
    set((s) => ({ filters: { ...s.filters, priority: p } })),
  setStatusFilter: (st) =>
    set((s) => ({ filters: { ...s.filters, status: st } })),
  setTagFilter: (tag) => set((s) => ({ filters: { ...s.filters, tag } })),
  clearFilters: () => set({ filters: defaultFilters }),
  setUser: (user) => set({ user }),

  loadTasks: async () => {
    try {
      const tasks = await fetchTasks();
      set({ tasks });
    } catch (error) {
      console.error('Failed to load tasks:', error);
    }
  },

  addTask: async ({ title, notes, priority, dueDate, tags, recurrence }) => {
    const cleanTitle = title.trim();
    const cleanNotes = notes?.trim() || undefined;
    const createdAt = Date.now();

    if (recurrence && dueDate) {
      const groupId = uid();
      const occurrences = expandRecurrence(dueDate, recurrence);
      const newTasks: Task[] = occurrences.map((iso, idx) => ({
        id: uid(),
        title: cleanTitle,
        notes: cleanNotes,
        completed: false,
        priority,
        dueDate: iso,
        tags,
        createdAt: createdAt + idx,
        recurrence,
        recurrenceGroupId: groupId,
      }));

      try {
        await Promise.all(newTasks.map((task) => apiCreateTask(task)));
        set((s) => ({ tasks: [...newTasks, ...s.tasks] }));
      } catch (error) {
        console.error('Failed to create recurring tasks:', error);
      }
      return;
    }

    const newTask: Task = {
      id: uid(),
      title: cleanTitle,
      notes: cleanNotes,
      completed: false,
      priority,
      dueDate: dueDate || undefined,
      tags,
      createdAt,
    };

    try {
      await apiCreateTask(newTask);
      set((s) => ({ tasks: [newTask, ...s.tasks] }));
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  },

  updateTask: async (id, patch) => {
    const current = get().tasks.find((t) => t.id === id);
    if (!current) return;
    const updated = { ...current, ...patch };
    try {
      await apiUpdateTask(updated);
      set((s) => ({
        tasks: s.tasks.map((t) => (t.id === id ? updated : t)),
      }));
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  },

  toggleTask: async (id) => {
    const current = get().tasks.find((t) => t.id === id);
    if (!current) return;
    const updated: Task = {
      ...current,
      completed: !current.completed,
      completedAt: !current.completed ? Date.now() : undefined,
    };
    try {
      await apiUpdateTask(updated);
      set((s) => ({
        tasks: s.tasks.map((t) => (t.id === id ? updated : t)),
      }));
    } catch (error) {
      console.error('Failed to toggle task:', error);
    }
  },

  deleteTask: async (id) => {
    try {
      await apiDeleteTask(id);
      set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }));
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  },

  clearCompleted: async () => {
    const completedTasks = get().tasks.filter((t) => t.completed);
    try {
      await Promise.all(completedTasks.map((t) => apiDeleteTask(t.id)));
      set((s) => ({ tasks: s.tasks.filter((t) => !t.completed) }));
    } catch (error) {
      console.error('Failed to clear completed tasks:', error);
    }
  },
}));
