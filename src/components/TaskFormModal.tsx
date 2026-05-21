import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Flag, Calendar, Hash, Trash2, Repeat } from 'lucide-react';
import type { Priority, RecurrenceFrequency, Task } from '../types';
import { useStore } from '../store';
import { clsx } from '../lib/clsx';

interface Props {
  open: boolean;
  onClose: () => void;
  editingTask: Task | null;
  existingTags: string[];
}

const priorities: { value: Priority; label: string; cls: string }[] = [
  { value: 'low', label: 'Low', cls: 'text-priority-low' },
  { value: 'medium', label: 'Medium', cls: 'text-priority-med' },
  { value: 'high', label: 'High', cls: 'text-priority-high' },
];

const frequencies: { value: RecurrenceFrequency; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'custom', label: 'Custom' },
];

export function TaskFormModal({ open, onClose, editingTask, existingTags }: Props) {
  const addTask = useStore((s) => s.addTask);
  const updateTask = useStore((s) => s.updateTask);
  const deleteTask = useStore((s) => s.deleteTask);

  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [dueDate, setDueDate] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [recurring, setRecurring] = useState(false);
  const [frequency, setFrequency] = useState<RecurrenceFrequency>('daily');
  const [interval, setIntervalDays] = useState(2);
  const [endDate, setEndDate] = useState('');
  const [recurringError, setRecurringError] = useState<string | null>(null);

  const titleRef = useRef<HTMLInputElement>(null);
  const isEditingRecurringInstance = Boolean(editingTask?.recurrence);

  useEffect(() => {
    if (open) {
      if (editingTask) {
        setTitle(editingTask.title);
        setNotes(editingTask.notes ?? '');
        setPriority(editingTask.priority);
        setDueDate(editingTask.dueDate ?? '');
        setTags(editingTask.tags);
        setRecurring(false);
        setFrequency(editingTask.recurrence?.frequency ?? 'daily');
        setIntervalDays(editingTask.recurrence?.interval ?? 2);
        setEndDate(editingTask.recurrence?.endDate ?? '');
      } else {
        setTitle('');
        setNotes('');
        setPriority('medium');
        setDueDate('');
        setTags([]);
        setRecurring(false);
        setFrequency('daily');
        setIntervalDays(2);
        setEndDate('');
      }
      setTagInput('');
      setRecurringError(null);
      setTimeout(() => titleRef.current?.focus(), 30);
    }
  }, [open, editingTask]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const addTag = (raw: string) => {
    const t = raw.trim().replace(/^#/, '').toLowerCase();
    if (!t) return;
    if (tags.includes(t)) return;
    setTags((prev) => [...prev, t]);
    setTagInput('');
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(tagInput);
    } else if (e.key === 'Backspace' && !tagInput && tags.length) {
      setTags((prev) => prev.slice(0, -1));
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;

    if (recurring && !editingTask) {
      if (!dueDate) {
        setRecurringError('Set a due date to use as the first occurrence.');
        return;
      }
      if (!endDate) {
        setRecurringError('Pick a recurrence end date.');
        return;
      }
      if (endDate < dueDate) {
        setRecurringError('End date must be on or after the due date.');
        return;
      }
      if (frequency === 'custom' && (!interval || interval < 1)) {
        setRecurringError('Interval must be at least 1 day.');
        return;
      }
    }

    if (editingTask) {
      updateTask(editingTask.id, {
        title: trimmed,
        notes: notes.trim() || undefined,
        priority,
        dueDate: dueDate || undefined,
        tags,
      });
    } else {
      addTask({
        title: trimmed,
        notes: notes.trim() || undefined,
        priority,
        dueDate: dueDate || undefined,
        tags,
        recurrence: recurring
          ? { frequency, interval: Math.max(1, interval), endDate }
          : undefined,
      });
    }
    onClose();
  };

  const suggestedTags = existingTags.filter(
    (t) => !tags.includes(t) && t.includes(tagInput.toLowerCase()),
  );

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-0 sm:px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-labelledby="task-modal-title"
        >
          <motion.div
            initial={{ y: 40, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full sm:max-w-lg bg-surface rounded-t-2xl sm:rounded-2xl border border-ink-200 shadow-card flex flex-col max-h-[92vh] sm:max-h-[85vh]"
          >
            <form onSubmit={onSubmit} className="flex flex-col flex-1 min-h-0">
              <div className="flex items-center justify-between p-4 sm:p-5 border-b border-ink-200 shrink-0">
                <h2
                  id="task-modal-title"
                  className="font-semibold tracking-tight text-ink-900"
                >
                  {editingTask ? 'Edit task' : 'New task'}
                </h2>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 rounded-md text-ink-500 hover:text-ink-900 hover:bg-ink-100"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="p-4 sm:p-5 space-y-4 overflow-y-auto scroll-soft flex-1 min-h-0">
                <div>
                  <label htmlFor="title" className="sr-only">
                    Title
                  </label>
                  <input
                    id="title"
                    ref={titleRef}
                    type="text"
                    className="input text-base"
                    placeholder="What needs doing?"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={200}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="notes" className="sr-only">
                    Notes
                  </label>
                  <textarea
                    id="notes"
                    className="input resize-none"
                    rows={2}
                    placeholder="Notes (optional)"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    maxLength={500}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label icon={Flag}>Priority</Label>
                    <div className="flex gap-1.5">
                      {priorities.map((p) => (
                        <button
                          key={p.value}
                          type="button"
                          onClick={() => setPriority(p.value)}
                          className={clsx(
                            'flex-1 px-2.5 py-1.5 rounded-md text-xs font-medium border transition-colors',
                            priority === p.value
                              ? 'bg-ink-900 text-white border-ink-900'
                              : 'bg-surface text-ink-700 border-ink-200 hover:border-ink-300',
                          )}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label icon={Calendar} htmlFor="due">
                      Due date
                    </Label>
                    <input
                      id="due"
                      type="date"
                      className="input"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label icon={Hash}>Tags</Label>
                  <div className="flex flex-wrap gap-1.5 items-center input py-1.5">
                    {tags.map((tag) => (
                      <span key={tag} className="chip">
                        #{tag}
                        <button
                          type="button"
                          onClick={() =>
                            setTags((prev) => prev.filter((t) => t !== tag))
                          }
                          className="p-0.5 -mr-0.5 rounded hover:bg-ink-200"
                          aria-label={`Remove tag ${tag}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleTagKeyDown}
                      placeholder={tags.length ? '' : 'Add tag and press Enter'}
                      className="flex-1 min-w-[120px] bg-transparent border-0 outline-none text-sm placeholder:text-ink-400"
                    />
                  </div>
                  {tagInput && suggestedTags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {suggestedTags.slice(0, 6).map((t) => (
                        <button
                          key={t}
                          type="button"
                          className="chip hover:bg-ink-200"
                          onClick={() => addTag(t)}
                        >
                          + {t}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {!editingTask && (
                  <div>
                    <label className="flex items-center justify-between gap-3 cursor-pointer">
                      <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-ink-500 font-semibold">
                        <Repeat className="h-3 w-3" />
                        Recurring
                      </span>
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-ink-900"
                        checked={recurring}
                        onChange={(e) => {
                          setRecurring(e.target.checked);
                          setRecurringError(null);
                        }}
                      />
                    </label>

                    {recurring && (
                      <div className="mt-3 space-y-3 rounded-lg border border-ink-200 bg-ink-100/40 p-3">
                        <div>
                          <Label icon={Repeat}>Frequency</Label>
                          <div className="grid grid-cols-4 gap-1.5">
                            {frequencies.map((f) => (
                              <button
                                key={f.value}
                                type="button"
                                onClick={() => setFrequency(f.value)}
                                className={clsx(
                                  'px-2 py-1.5 rounded-md text-xs font-medium border transition-colors',
                                  frequency === f.value
                                    ? 'bg-ink-900 text-white border-ink-900'
                                    : 'bg-surface text-ink-700 border-ink-200 hover:border-ink-300',
                                )}
                              >
                                {f.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {frequency === 'custom' && (
                            <div>
                              <Label icon={Repeat} htmlFor="interval">
                                Every (days)
                              </Label>
                              <input
                                id="interval"
                                type="number"
                                min={1}
                                max={365}
                                className="input"
                                value={interval}
                                onChange={(e) =>
                                  setIntervalDays(
                                    Math.max(1, Number(e.target.value) || 1),
                                  )
                                }
                              />
                            </div>
                          )}
                          <div className={frequency === 'custom' ? '' : 'sm:col-span-2'}>
                            <Label icon={Calendar} htmlFor="recurrence-end">
                              Ends on
                            </Label>
                            <input
                              id="recurrence-end"
                              type="date"
                              className="input"
                              value={endDate}
                              min={dueDate || undefined}
                              onChange={(e) => {
                                setEndDate(e.target.value);
                                setRecurringError(null);
                              }}
                            />
                          </div>
                        </div>

                        {recurringError && (
                          <p className="text-xs text-priority-high">
                            {recurringError}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {isEditingRecurringInstance && (
                  <p className="text-xs text-ink-500 flex items-center gap-1.5">
                    <Repeat className="h-3 w-3" />
                    This is one occurrence of a recurring task. Edits apply to this instance only.
                  </p>
                )}
              </div>

              <div className="p-4 sm:p-5 border-t border-ink-200 flex items-center justify-between gap-2 shrink-0">
                <div>
                  {editingTask && (
                    <button
                      type="button"
                      onClick={() => {
                        deleteTask(editingTask.id);
                        onClose();
                      }}
                      className="btn-ghost text-ink-500 hover:text-priority-high"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="btn-ghost"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={!title.trim()}
                  >
                    {editingTask ? 'Save changes' : 'Add task'}
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Label({
  children,
  icon: Icon,
  htmlFor,
}: {
  children: React.ReactNode;
  icon: typeof Flag;
  htmlFor?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-ink-500 font-semibold mb-1.5"
    >
      <Icon className="h-3 w-3" />
      {children}
    </label>
  );
}
