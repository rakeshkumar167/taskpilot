import { create } from 'zustand';
import { persist } from 'zustand/middleware';
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
  addTask: (input: {
    title: string;
    notes?: string;
    priority: Priority;
    dueDate?: string;
    tags: string[];
    recurrence?: Recurrence;
  }) => void;
  updateTask: (id: string, patch: Partial<Task>) => void;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
  clearCompleted: () => void;
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

// Cap how many instances we will generate to keep the list manageable.
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

const seedTasks = (): Task[] => {
  const now = Date.now();
  const today = new Date();
  const iso = (offsetDays: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() + offsetDays);
    return d.toISOString().slice(0, 10);
  };
  return [
    {
      id: uid(),
      title: 'Plan the week',
      notes: 'Block focus time and review priorities',
      completed: false,
      priority: 'high',
      dueDate: iso(0),
      tags: ['work'],
      createdAt: now - 1000 * 60 * 60 * 6,
    },
    {
      id: uid(),
      title: 'Reply to design review',
      completed: false,
      priority: 'medium',
      dueDate: iso(0),
      tags: ['work', 'design'],
      createdAt: now - 1000 * 60 * 60 * 4,
    },
    {
      id: uid(),
      title: 'Pick up groceries',
      completed: false,
      priority: 'low',
      dueDate: iso(1),
      tags: ['personal'],
      createdAt: now - 1000 * 60 * 60 * 2,
    },
    {
      id: uid(),
      title: 'Read chapter 4',
      completed: true,
      priority: 'low',
      tags: ['reading'],
      createdAt: now - 1000 * 60 * 60 * 24,
      completedAt: now - 1000 * 60 * 60 * 20,
    },
  ];
};

const defaultFilters: Filters = {
  search: '',
  priority: 'all',
  status: 'all',
  tag: null,
};

export const useStore = create<State>()(
  persist(
    (set) => ({
      tasks: seedTasks(),
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
      addTask: ({ title, notes, priority, dueDate, tags, recurrence }) =>
        set((s) => {
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
              createdAt: createdAt + idx, // stable ordering
              recurrence,
              recurrenceGroupId: groupId,
            }));
            return { tasks: [...newTasks, ...s.tasks] };
          }

          return {
            tasks: [
              {
                id: uid(),
                title: cleanTitle,
                notes: cleanNotes,
                completed: false,
                priority,
                dueDate: dueDate || undefined,
                tags,
                createdAt,
              },
              ...s.tasks,
            ],
          };
        }),
      updateTask: (id, patch) =>
        set((s) => ({
          tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)),
        })),
      toggleTask: (id) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id
              ? {
                  ...t,
                  completed: !t.completed,
                  completedAt: !t.completed ? Date.now() : undefined,
                }
              : t,
          ),
        })),
      deleteTask: (id) =>
        set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),
      clearCompleted: () =>
        set((s) => ({ tasks: s.tasks.filter((t) => !t.completed) })),
    }),
    {
      name: 'taskpilot:v1',
      partialize: (s) => ({ tasks: s.tasks }),
    },
  ),
);
