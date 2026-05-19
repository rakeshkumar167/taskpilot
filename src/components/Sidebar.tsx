import {
  Inbox,
  CalendarDays,
  CalendarClock,
  CheckCircle2,
  Plus,
  Hash,
} from 'lucide-react';
import { useStore } from '../store';
import type { View } from '../types';
import { clsx } from '../lib/clsx';

interface Props {
  counts: { all: number; today: number; upcoming: number; completed: number };
  allTags: string[];
  onNewTask: () => void;
  onNavigate: () => void;
}

const navItems: { id: View; label: string; icon: typeof Inbox }[] = [
  { id: 'all', label: 'All Tasks', icon: Inbox },
  { id: 'today', label: 'Today', icon: CalendarDays },
  { id: 'upcoming', label: 'Upcoming', icon: CalendarClock },
  { id: 'completed', label: 'Completed', icon: CheckCircle2 },
];

export function Sidebar({ counts, allTags, onNewTask, onNavigate }: Props) {
  const view = useStore((s) => s.view);
  const setView = useStore((s) => s.setView);
  const tagFilter = useStore((s) => s.filters.tag);
  const setTagFilter = useStore((s) => s.setTagFilter);

  return (
    <div className="flex flex-col h-full p-4 gap-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-ink-900 text-white grid place-items-center text-[13px] font-semibold tracking-tight">
            T
          </div>
          <div className="font-semibold tracking-tight text-ink-900">
            TaskPilot
          </div>
        </div>
      </div>

      <button
        className="btn-primary w-full justify-center"
        onClick={onNewTask}
      >
        <Plus className="h-4 w-4" />
        New task
      </button>

      <nav className="flex flex-col gap-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = view === item.id;
          const count =
            item.id === 'all'
              ? counts.all
              : item.id === 'today'
                ? counts.today
                : item.id === 'upcoming'
                  ? counts.upcoming
                  : counts.completed;
          return (
            <button
              key={item.id}
              onClick={() => {
                setView(item.id);
                onNavigate();
              }}
              className={clsx('nav-item w-full', active && 'nav-item-active')}
              aria-current={active ? 'page' : undefined}
            >
              <Icon className="h-4 w-4 text-ink-500" />
              <span className="flex-1 text-left">{item.label}</span>
              {count > 0 && (
                <span className="text-xs text-ink-500 tabular-nums">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {allTags.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <div className="px-3 text-[11px] uppercase tracking-wider text-ink-500 font-semibold">
            Tags
          </div>
          <div className="flex flex-col gap-0.5 max-h-56 overflow-y-auto scroll-soft pr-1">
            {allTags.map((tag) => {
              const active = tagFilter === tag;
              return (
                <button
                  key={tag}
                  onClick={() => {
                    setTagFilter(active ? null : tag);
                    onNavigate();
                  }}
                  className={clsx(
                    'nav-item w-full',
                    active && 'nav-item-active',
                  )}
                >
                  <Hash className="h-3.5 w-3.5 text-ink-400" />
                  <span className="flex-1 text-left truncate">{tag}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-auto pt-4 text-[11px] text-ink-400">
        Local-first · saved in this browser
      </div>
    </div>
  );
}
