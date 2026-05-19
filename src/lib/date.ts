export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function todayISO(): string {
  return toISODate(new Date());
}

export function isToday(iso?: string): boolean {
  if (!iso) return false;
  return iso === todayISO();
}

export function isOverdue(iso?: string): boolean {
  if (!iso) return false;
  return iso < todayISO();
}

export function isUpcoming(iso?: string): boolean {
  if (!iso) return false;
  return iso > todayISO();
}

export function formatDue(iso?: string): string {
  if (!iso) return '';
  const today = todayISO();
  if (iso === today) return 'Today';
  const t = new Date(today + 'T00:00:00');
  const target = new Date(iso + 'T00:00:00');
  const diffDays = Math.round((target.getTime() - t.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';
  if (diffDays > 1 && diffDays <= 6) {
    return target.toLocaleDateString(undefined, { weekday: 'long' });
  }
  if (diffDays < -1 && diffDays >= -6) {
    return `${Math.abs(diffDays)}d ago`;
  }
  return target.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: target.getFullYear() === t.getFullYear() ? undefined : 'numeric',
  });
}
