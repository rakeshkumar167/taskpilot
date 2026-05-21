import { Check, Pencil, Trash2, Calendar, Flag, Repeat } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import type { Task, Priority } from '../types';
import { useStore } from '../store';
import { formatDue, isOverdue } from '../lib/date';
import { clsx } from '../lib/clsx';

const priorityPill: Record<Priority, string> = {
  high: 'bg-priority-high-soft text-priority-high-ink ring-1 ring-inset ring-priority-high/20',
  medium: 'bg-priority-med-soft text-priority-med-ink ring-1 ring-inset ring-priority-med/20',
  low: 'bg-priority-low-soft text-priority-low-ink ring-1 ring-inset ring-priority-low/20',
};

const priorityCardTint: Record<Priority, string> = {
  high: 'bg-priority-high/[0.06] border-priority-high/20',
  medium: 'bg-priority-med/[0.06] border-priority-med/20',
  low: 'bg-priority-low/[0.06] border-priority-low/20',
};

const priorityLabel: Record<Priority, string> = {
  high: 'High',
  medium: 'Med',
  low: 'Low',
};

interface Props {
  task: Task;
  onEdit: (t: Task) => void;
}

export function TaskItem({ task, onEdit }: Props) {
  const toggleTask = useStore((s) => s.toggleTask);
  const deleteTask = useStore((s) => s.deleteTask);
  const setTagFilter = useStore((s) => s.setTagFilter);

  const overdue = !task.completed && isOverdue(task.dueDate);

  return (
    <motion.div
      whileHover={{ y: -2, scale: 1.005 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className={clsx(
        'group card p-3 sm:p-3.5 flex items-start gap-3 transition-colors hover:shadow-md',
        task.completed ? 'bg-ink-100/50' : priorityCardTint[task.priority],
      )}
    >
      <motion.button
        onClick={() => toggleTask(task.id)}
        aria-label={task.completed ? 'Mark as not done' : 'Mark as done'}
        aria-pressed={task.completed}
        whileTap={{ scale: 0.8 }}
        whileHover={{ scale: 1.1 }}
        transition={{ type: 'spring', stiffness: 600, damping: 15 }}
        className={clsx(
          'mt-0.5 h-5 w-5 shrink-0 rounded-md border flex items-center justify-center transition-colors',
          task.completed
            ? 'bg-accent border-accent text-white'
            : 'border-ink-300 hover:border-accent bg-surface',
        )}
      >
        <AnimatePresence mode="wait" initial={false}>
          {task.completed && (
            <motion.span
              key="check"
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 45 }}
              transition={{ type: 'spring', stiffness: 700, damping: 18 }}
              className="flex"
            >
              <Check className="h-3.5 w-3.5" strokeWidth={3} />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      <div className="flex-1 min-w-0">
        <div
          className={clsx(
            'text-[15px] leading-snug',
            task.completed
              ? 'text-ink-400 line-through'
              : 'text-ink-900 font-medium',
          )}
        >
          {task.title}
        </div>

        {task.notes && (
          <div
            className={clsx(
              'mt-1 text-sm leading-snug',
              task.completed ? 'text-ink-400' : 'text-ink-500',
            )}
          >
            {task.notes}
          </div>
        )}

        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {task.dueDate && (
            <span
              className={clsx(
                'inline-flex items-center gap-1 text-xs',
                overdue ? 'text-priority-high' : 'text-ink-500',
              )}
            >
              <Calendar className="h-3 w-3" />
              {formatDue(task.dueDate)}
            </span>
          )}
          <span
            className={clsx(
              'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[11px] font-medium',
              priorityPill[task.priority],
            )}
          >
            <Flag className="h-3 w-3" />
            {priorityLabel[task.priority]}
          </span>
          {task.recurrence && (
            <span
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[11px] font-medium bg-rose-soft text-rose-ink ring-1 ring-inset ring-rose/20"
              title={`Repeats ${task.recurrence.frequency}${task.recurrence.frequency === 'custom' ? ` (every ${task.recurrence.interval} days)` : ''} until ${task.recurrence.endDate}`}
            >
              <Repeat className="h-3 w-3" />
              {task.recurrence.frequency === 'custom'
                ? `every ${task.recurrence.interval}d`
                : task.recurrence.frequency}
            </span>
          )}
          {task.tags.map((tag) => (
            <button
              key={tag}
              onClick={() => setTagFilter(tag)}
              className="chip hover:bg-ink-200 transition-colors"
              aria-label={`Filter by ${tag}`}
            >
              #{tag}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
        <button
          onClick={() => onEdit(task)}
          aria-label="Edit task"
          className="p-1.5 rounded-md text-ink-400 hover:text-ink-900 hover:bg-ink-100"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => deleteTask(task.id)}
          aria-label="Delete task"
          className="p-1.5 rounded-md text-ink-400 hover:text-priority-high hover:bg-ink-100"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </motion.div>
  );
}
