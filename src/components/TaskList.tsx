import { AnimatePresence, motion } from 'framer-motion';
import { TaskItem } from './TaskItem';
import type { Task } from '../types';
import { useStore } from '../store';
import { EmptyState } from './EmptyState';

interface Props {
  tasks: Task[];
  onEdit: (t: Task) => void;
}

export function TaskList({ tasks, onEdit }: Props) {
  const view = useStore((s) => s.view);
  const clearCompleted = useStore((s) => s.clearCompleted);
  const completedCount = tasks.filter((t) => t.completed).length;

  if (tasks.length === 0) return <EmptyState view={view} />;

  return (
    <div className="space-y-2">
      <AnimatePresence initial={false}>
        {tasks.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
          >
            <TaskItem task={t} onEdit={onEdit} />
          </motion.div>
        ))}
      </AnimatePresence>

      {view === 'completed' && completedCount > 0 && (
        <div className="pt-6 flex justify-center">
          <button onClick={clearCompleted} className="btn-ghost text-ink-500">
            Clear completed
          </button>
        </div>
      )}
    </div>
  );
}
