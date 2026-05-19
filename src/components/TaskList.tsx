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
        {tasks.map((t, i) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 24, scale: 0.9 }}
            transition={{
              type: 'spring',
              stiffness: 420,
              damping: 28,
              delay: Math.min(i * 0.02, 0.2),
            }}
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
