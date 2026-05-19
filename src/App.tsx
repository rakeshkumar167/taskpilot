import { useMemo, useState } from 'react';
import { Menu } from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { TaskList } from './components/TaskList';
import { TaskFormModal } from './components/TaskFormModal';
import { useStore } from './store';
import { isToday, isUpcoming, todayISO } from './lib/date';
import type { Task } from './types';

export default function App() {
  const view = useStore((s) => s.view);
  const tasks = useStore((s) => s.tasks);
  const filters = useStore((s) => s.filters);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [navOpen, setNavOpen] = useState(false);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    tasks.forEach((t) => t.tags.forEach((tag) => set.add(tag)));
    return Array.from(set).sort();
  }, [tasks]);

  const counts = useMemo(() => {
    const today = todayISO();
    return {
      all: tasks.filter((t) => !t.completed).length,
      today: tasks.filter((t) => !t.completed && t.dueDate === today).length,
      upcoming: tasks.filter((t) => !t.completed && isUpcoming(t.dueDate))
        .length,
      completed: tasks.filter((t) => t.completed).length,
    };
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    let list = tasks.slice();

    // view scope
    if (view === 'today') {
      list = list.filter((t) => !t.completed && isToday(t.dueDate));
    } else if (view === 'upcoming') {
      list = list.filter((t) => !t.completed && isUpcoming(t.dueDate));
    } else if (view === 'completed') {
      list = list.filter((t) => t.completed);
    } else {
      // all: hide completed by default unless status filter says so
      if (filters.status !== 'completed') {
        list = list.filter((t) => !t.completed);
      }
    }

    // status filter overrides
    if (filters.status === 'active') list = list.filter((t) => !t.completed);
    if (filters.status === 'completed') list = list.filter((t) => t.completed);

    if (filters.priority !== 'all')
      list = list.filter((t) => t.priority === filters.priority);

    if (filters.tag) list = list.filter((t) => t.tags.includes(filters.tag!));

    if (filters.search.trim()) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.notes?.toLowerCase().includes(q) ?? false) ||
          t.tags.some((tag) => tag.toLowerCase().includes(q)),
      );
    }

    // sort: incomplete first, then high → low priority, then due date asc, then createdAt desc
    const pOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
    list.sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      const pa = pOrder[a.priority] ?? 3;
      const pb = pOrder[b.priority] ?? 3;
      if (pa !== pb) return pa - pb;
      const da = a.dueDate ?? '9999-12-31';
      const db = b.dueDate ?? '9999-12-31';
      if (da !== db) return da < db ? -1 : 1;
      return b.createdAt - a.createdAt;
    });

    return list;
  }, [tasks, view, filters]);

  const openNewTask = () => {
    setEditingTask(null);
    setModalOpen(true);
  };

  const openEditTask = (t: Task) => {
    setEditingTask(t);
    setModalOpen(true);
  };

  return (
    <div className="min-h-full h-full flex bg-canvas">
      {/* Sidebar (desktop) */}
      <aside className="hidden md:flex md:flex-col w-64 shrink-0 border-r border-ink-200 bg-canvas">
        <Sidebar
          counts={counts}
          allTags={allTags}
          onNewTask={openNewTask}
          onNavigate={() => setNavOpen(false)}
        />
      </aside>

      {/* Mobile drawer */}
      {navOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/30 animate-fadeIn"
          onClick={() => setNavOpen(false)}
          role="presentation"
        >
          <aside
            className="absolute left-0 top-0 bottom-0 w-72 bg-canvas border-r border-ink-200 p-1"
            onClick={(e) => e.stopPropagation()}
          >
            <Sidebar
              counts={counts}
              allTags={allTags}
              onNewTask={() => {
                setNavOpen(false);
                openNewTask();
              }}
              onNavigate={() => setNavOpen(false)}
            />
          </aside>
        </div>
      )}

      {/* Main */}
      <main className="flex-1 min-w-0 flex flex-col">
        <div className="md:hidden flex items-center gap-2 px-4 py-3 border-b border-ink-200 bg-canvas">
          <button
            className="btn-ghost"
            aria-label="Open navigation"
            onClick={() => setNavOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="font-semibold tracking-tight">TaskPilot</div>
        </div>

        <Topbar onNewTask={openNewTask} />

        <div className="flex-1 overflow-y-auto scroll-soft">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-5 sm:py-8">
            <TaskList tasks={filteredTasks} onEdit={openEditTask} />
          </div>
        </div>
      </main>

      <TaskFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        editingTask={editingTask}
        existingTags={allTags}
      />
    </div>
  );
}
