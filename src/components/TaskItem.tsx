import { Check, Pencil, Trash2, Calendar, Flag, Repeat } from 'lucide-react';
import type { Task, Priority } from '../types';
import { useStore } from '../store';
import { formatDue, isOverdue } from '../lib/date';
import { clsx } from '../lib/clsx';

const priorityColor: Record<Priority, string> = {
  high: 'text-priority-high',
  medium: 'text-priority-med',
  low: 'text-priority-low',
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
    <div
      className={clsx(
        'group card p-3 sm:p-3.5 flex items-start gap-3 transition-colors hover:border-ink-300',
        task.completed && 'bg-ink-100/50',
      )}
    >
      <button
        onClick={() => toggleTask(task.id)}
        aria-label={task.completed ? 'Mark as not done' : 'Mark as done'}
        aria-pressed={task.completed}
        className={clsx(
          'mt-0.5 h-5 w-5 shrink-0 rounded-md border flex items-center justify-center transition-colors',
          task.completed
            ? 'bg-ink-900 border-ink-900 text-white'
            : 'border-ink-300 hover:border-ink-700 bg-surface',
        )}
      >
        {task.completed && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
      </button>

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
              'inline-flex items-center gap-1 text-xs',
              priorityColor[task.priority],
            )}
          >
            <Flag className="h-3 w-3" />
            {priorityLabel[task.priority]}
          </span>
          {task.recurrence && (
            <span
              className="inline-flex items-center gap-1 text-xs text-ink-500"
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
    </div>
  );
}
