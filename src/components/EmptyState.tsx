import { Inbox, CalendarDays, CalendarClock, CheckCircle2 } from 'lucide-react';
import type { View } from '../types';

const content: Record<View, { icon: typeof Inbox; title: string; body: string }> = {
  all: {
    icon: Inbox,
    title: 'No tasks yet',
    body: 'Add your first task to get started.',
  },
  today: {
    icon: CalendarDays,
    title: 'Nothing due today',
    body: 'Enjoy the breathing room or plan something new.',
  },
  upcoming: {
    icon: CalendarClock,
    title: 'No upcoming tasks',
    body: 'Future-you is going to thank present-you.',
  },
  completed: {
    icon: CheckCircle2,
    title: 'Nothing completed yet',
    body: 'Finished tasks will show up here.',
  },
};

export function EmptyState({ view }: { view: View }) {
  const { icon: Icon, title, body } = content[view];
  return (
    <div className="card p-10 flex flex-col items-center justify-center text-center animate-fadeIn">
      <div className="h-12 w-12 rounded-full bg-ink-100 grid place-items-center mb-4">
        <Icon className="h-5 w-5 text-ink-500" />
      </div>
      <div className="font-medium text-ink-900">{title}</div>
      <div className="mt-1 text-sm text-ink-500 max-w-xs">{body}</div>
    </div>
  );
}
