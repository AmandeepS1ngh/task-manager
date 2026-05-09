'use client';

import Badge from './Badge';
import type { Role } from '@/lib/types';
import { useRouter } from 'next/navigation';

interface ProjectCardProps {
  project: {
    id: string;
    name: string;
    description: string | null;
    created_at: string;
  };
  memberCount: number;
  taskCount: number;
  userRole: Role;
}

export default function ProjectCard({
  project,
  memberCount,
  taskCount,
  userRole,
}: ProjectCardProps) {
  const router = useRouter();

  return (
    <div
      onClick={() => router.push(`/projects/${project.id}`)}
      className="
        bg-[var(--color-surface)] rounded-xl p-5
        border border-[var(--color-border)]
        hover:bg-[var(--color-surface-hover)] hover:border-[var(--color-primary)]/40
        transition-all duration-200 cursor-pointer group
        animate-fade-in
      "
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-base font-semibold text-[var(--color-text)] group-hover:text-[var(--color-primary-hover)] transition-colors truncate mr-2">
          {project.name}
        </h3>
        <Badge
          label={userRole === 'admin' ? 'Admin' : 'Member'}
          color={userRole === 'admin' ? 'indigo' : 'slate'}
        />
      </div>

      {/* Description */}
      <p className="text-sm text-[var(--color-muted)] mb-4 line-clamp-2 min-h-[40px]">
        {project.description || 'No description'}
      </p>

      {/* Stats */}
      <div className="flex items-center gap-4 text-xs text-[var(--color-muted)]">
        <span className="flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {memberCount} members
        </span>
        <span className="flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          {taskCount} tasks
        </span>
      </div>
    </div>
  );
}
