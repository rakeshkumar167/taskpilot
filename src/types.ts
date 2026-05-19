export type Priority = 'low' | 'medium' | 'high';

export type View = 'all' | 'today' | 'upcoming' | 'completed';

export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly' | 'custom';

export interface Recurrence {
  frequency: RecurrenceFrequency;
  interval: number; // days between occurrences when frequency === 'custom'
  endDate: string; // ISO date (yyyy-mm-dd), inclusive
}

export interface Task {
  id: string;
  title: string;
  notes?: string;
  completed: boolean;
  priority: Priority;
  dueDate?: string; // ISO date (yyyy-mm-dd)
  tags: string[];
  createdAt: number;
  completedAt?: number;
  recurrence?: Recurrence;
  recurrenceGroupId?: string;
}

export interface Filters {
  search: string;
  priority: Priority | 'all';
  status: 'all' | 'active' | 'completed';
  tag: string | null;
}
