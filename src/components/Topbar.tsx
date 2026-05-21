import { Search, SlidersHorizontal, X, Plus, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';
import { useStore } from '../store';
import { logout } from '../lib/api';
import type { Priority, View } from '../types';
import { clsx } from '../lib/clsx';
import { useState } from 'react';

const viewTitle: Record<View, string> = {
  all: 'All Tasks',
  today: 'Today',
  upcoming: 'Upcoming',
  completed: 'Completed',
};

const viewSubtitle: Record<View, string> = {
  all: 'Everything on your plate',
  today: 'Focus for the day',
  upcoming: 'Coming up soon',
  completed: 'Wins and finished work',
};

export function Topbar({ onNewTask }: { onNewTask: () => void }) {
  const view = useStore((s) => s.view);
  const filters = useStore((s) => s.filters);
  const setSearch = useStore((s) => s.setSearch);
  const setPriorityFilter = useStore((s) => s.setPriorityFilter);
  const setStatusFilter = useStore((s) => s.setStatusFilter);
  const setTagFilter = useStore((s) => s.setTagFilter);
  const clearFilters = useStore((s) => s.clearFilters);
  const user = useStore((s) => s.user);

  const [showFilters, setShowFilters] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const handleLogout = async () => {
    await logout();
    window.location.href = '/';
  };

  const hasFilters =
    filters.search ||
    filters.priority !== 'all' ||
    filters.status !== 'all' ||
    filters.tag;

  return (
    <header className="border-b border-ink-200 bg-canvas/80 backdrop-blur-sm sticky top-0 z-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 sm:py-5">
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-ink-900 truncate">
              {viewTitle[view]}
            </h1>
            <p className="text-sm text-ink-500 mt-0.5 truncate">
              {viewSubtitle[view]}
            </p>
          </div>
          <motion.button
            className="btn-primary hidden sm:inline-flex"
            onClick={onNewTask}
            whileHover={{ scale: 1.04, y: -1 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 500, damping: 18 }}
          >
            <Plus className="h-4 w-4" />
            New task
          </motion.button>
          <motion.button
            className="btn-primary sm:hidden h-10 w-10 p-0"
            onClick={onNewTask}
            aria-label="New task"
            whileHover={{ scale: 1.06, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 500, damping: 15 }}
          >
            <Plus className="h-5 w-5" />
          </motion.button>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="h-4 w-4 text-ink-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              className="input pl-9 pr-9"
              placeholder="Search tasks, tags, notes…"
              value={filters.search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search tasks"
            />
            {filters.search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-ink-400 hover:text-ink-700 hover:bg-ink-100"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <motion.button
            className={clsx(
              'btn-soft h-[38px]',
              showFilters && 'bg-ink-200 text-ink-900',
            )}
            onClick={() => setShowFilters((v) => !v)}
            aria-expanded={showFilters}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 500, damping: 20 }}
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span className="hidden sm:inline">Filters</span>
            {hasFilters && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 700, damping: 15 }}
                className="ml-1 h-1.5 w-1.5 rounded-full bg-accent"
              />
            )}
          </motion.button>
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
        </div>

        {showFilters && (
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 animate-fadeIn">
            <FilterGroup label="Priority">
              {(['all', 'high', 'medium', 'low'] as const).map((p) => (
                <FilterPill
                  key={p}
                  active={filters.priority === p}
                  onClick={() =>
                    setPriorityFilter(p === 'all' ? 'all' : (p as Priority))
                  }
                >
                  {p === 'all' ? 'Any' : cap(p)}
                </FilterPill>
              ))}
            </FilterGroup>
            <FilterGroup label="Status">
              {(['all', 'active', 'completed'] as const).map((s) => (
                <FilterPill
                  key={s}
                  active={filters.status === s}
                  onClick={() => setStatusFilter(s)}
                >
                  {s === 'all' ? 'Any' : cap(s)}
                </FilterPill>
              ))}
            </FilterGroup>
            <div className="flex items-end justify-end">
              {hasFilters && (
                <button
                  onClick={() => {
                    clearFilters();
                    setTagFilter(null);
                  }}
                  className="btn-ghost"
                >
                  <X className="h-3.5 w-3.5" />
                  Clear filters
                </button>
              )}
            </div>
          </div>
        )}

        {filters.tag && (
          <div className="mt-3 flex items-center gap-2 text-sm">
            <span className="text-ink-500">Filtered by tag:</span>
            <button
              onClick={() => setTagFilter(null)}
              className="chip hover:bg-ink-200"
              aria-label={`Clear tag filter ${filters.tag}`}
            >
              #{filters.tag}
              <X className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

function FilterGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="text-[11px] uppercase tracking-wider text-ink-500 font-semibold">
        {label}
      </div>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'px-2.5 py-1 rounded-md text-xs font-medium border transition-colors',
        active
          ? 'bg-ink-900 text-white border-ink-900'
          : 'bg-surface text-ink-700 border-ink-200 hover:border-ink-300',
      )}
    >
      {children}
    </button>
  );
}

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
