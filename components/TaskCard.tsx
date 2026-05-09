'use client';

import Badge from './Badge';
import type { Task } from '@/lib/types';

interface TaskCardProps {
  task: Task;
  onClick?: () => void;
}

const priorityColor: Record<string, 'green' | 'amber' | 'red'> = {
  low: 'green',
  medium: 'amber',
  high: 'red',
};

const statusLabel: Record<string, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  done: 'Done',
};

const statusColor: Record<string, 'slate' | 'amber' | 'green'> = {
  todo: 'slate',
  in_progress: 'amber',
  done: 'green',
};

function isOverdue(task: Task): boolean {
  if (!task.due_date || task.status === 'done') return false;
  return new Date(task.due_date) < new Date(new Date().toDateString());
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function getInitial(id: string | null): string {
  if (!id) return '?';
  return id.substring(0, 2).toUpperCase();
}

export default function TaskCard({ task, onClick }: TaskCardProps) {
  const overdue = isOverdue(task);

  return (
    <div
      onClick={onClick}
      className={`
        relative group overflow-hidden
        bg-[var(--color-surface)]/80 backdrop-blur-md rounded-xl p-5
        border border-white/5
        shadow-sm hover:shadow-[0_8px_30px_rgb(0,0,0,0.5)]
        hover:-translate-y-1 transition-all duration-300 ease-out
        cursor-pointer
      `}
    >
      {/* Overdue Glow Effect */}
      {overdue && (
        <div className="absolute inset-x-0 top-0 h-1 bg-red-500/80 shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
      )}

      {/* Title */}
      <h4 className="text-base font-semibold text-[var(--color-text)] mb-3 group-hover:text-indigo-400 transition-colors line-clamp-2">
        {task.title}
      </h4>

      {/* Badges row */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <Badge label={task.priority} color={priorityColor[task.priority]} />
        <Badge label={statusLabel[task.status]} color={statusColor[task.status]} />
        {overdue && <Badge label="Overdue" color="red" />}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs font-medium text-[var(--color-muted)] pt-3 border-t border-[var(--color-border)]/50">
        <span className="flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          {formatDate(task.due_date)}
        </span>
        {task.assigned_to && (
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center text-[11px] font-bold shadow-[0_0_10px_rgba(99,102,241,0.4)]">
            {getInitial(task.assigned_to)}
          </div>
        )}
      </div>
    </div>
  );
}
