'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';
import { useToast } from '@/lib/context/ToastContext';
import { useUser } from '@/lib/context/UserContext';
import StatsCard from '@/components/StatsCard';
import Badge from '@/components/Badge';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import type { DashboardData, TaskWithProject } from '@/lib/types';

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
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

export default function DashboardPage() {
  const { user } = useUser();
  const { showToast } = useToast();
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      const { data: dashData, error } =
        await api.get<DashboardData>('/api/dashboard');

      if (error) {
        showToast(error, 'error');
      } else {
        setData(dashData);
      }
      setLoading(false);
    }
    fetchDashboard();
  }, [showToast]);

  return (
    <div className="pt-8 px-8 pb-12 w-full max-w-7xl mx-auto">
      {/* Top Welcome */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <span className="material-symbols-outlined text-primary text-3xl">grid_view</span>
          <h1 className="text-2xl font-bold text-primary">Welcome back, {user?.full_name?.split(' ')[0] || 'there'} 👋</h1>
        </div>
      </div>

      {/* Stats Row */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <LoadingSkeleton variant="stat" count={4} />
        </div>
      ) : (
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Card 1 */}
          <div className="glass-panel p-6 rounded-2xl hover:translate-y-[-4px] transition-transform group cursor-pointer">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-on-primary transition-colors">
                <span className="material-symbols-outlined">list_alt</span>
              </div>
            </div>
            <h3 className="text-on-surface-variant text-xs font-semibold tracking-wider uppercase mb-1">Total Tasks</h3>
            <p className="text-3xl font-bold text-on-surface">{data?.total_tasks ?? 0}</p>
          </div>
          {/* Card 2 */}
          <div className="glass-panel p-6 rounded-2xl hover:translate-y-[-4px] transition-transform group cursor-pointer">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 rounded-xl bg-tertiary/10 text-tertiary group-hover:bg-tertiary group-hover:text-on-tertiary transition-colors">
                <span className="material-symbols-outlined">check_circle</span>
              </div>
            </div>
            <h3 className="text-on-surface-variant text-xs font-semibold tracking-wider uppercase mb-1">Completed</h3>
            <p className="text-3xl font-bold text-on-surface">{data?.completed_tasks ?? 0}</p>
          </div>
          {/* Card 3 */}
          <div className="glass-panel p-6 rounded-2xl border-error/20 hover:translate-y-[-4px] transition-transform group cursor-pointer">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 rounded-xl bg-error/10 text-error group-hover:bg-error group-hover:text-on-error transition-colors">
                <span className="material-symbols-outlined">error_outline</span>
              </div>
              {data?.overdue_tasks && data.overdue_tasks.length > 0 && (
                <span className="text-xs text-error font-bold bg-error/10 px-2 py-1 rounded-full">Alert</span>
              )}
            </div>
            <h3 className="text-on-surface-variant text-xs font-semibold tracking-wider uppercase mb-1">Overdue</h3>
            <p className="text-3xl font-bold text-on-surface">{data?.overdue_tasks?.length ?? 0}</p>
          </div>
          {/* Card 4 */}
          <div className="glass-panel p-6 rounded-2xl hover:translate-y-[-4px] transition-transform group cursor-pointer">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 rounded-xl bg-primary-fixed-dim/10 text-primary-fixed-dim group-hover:bg-primary-fixed-dim group-hover:text-on-primary-fixed transition-colors">
                <span className="material-symbols-outlined">person</span>
              </div>
              <span className="text-xs text-on-surface-variant font-bold bg-white/5 border border-white/10 px-2 py-1 rounded-full">Active</span>
            </div>
            <h3 className="text-on-surface-variant text-xs font-semibold tracking-wider uppercase mb-1">My Tasks</h3>
            <p className="text-3xl font-bold text-on-surface">{data?.my_tasks?.length ?? 0}</p>
          </div>
        </section>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Overdue Tasks Table & Bento Stats */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-on-surface">Overdue Tasks</h2>
            <button className="text-primary text-sm font-semibold hover:underline">View All</button>
          </div>

          <div className="glass-panel rounded-2xl overflow-hidden min-h-[200px]">
            {loading ? (
              <div className="p-4"><LoadingSkeleton variant="row" count={3} /></div>
            ) : !data?.overdue_tasks || data.overdue_tasks.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center justify-center h-full">
                <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-2">task_alt</span>
                <p className="text-on-surface-variant text-sm">No overdue tasks. Great job!</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-high/50 text-on-surface-variant border-b border-outline-variant/20">
                    <th className="px-6 py-4 text-xs font-semibold tracking-wider uppercase">Task Title</th>
                    <th className="px-6 py-4 text-xs font-semibold tracking-wider uppercase">Project</th>
                    <th className="px-6 py-4 text-xs font-semibold tracking-wider uppercase">Due Date</th>
                    <th className="px-6 py-4 text-xs font-semibold tracking-wider uppercase">Priority</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10">
                  {data.overdue_tasks.map((task) => (
                    <tr 
                      key={task.id} 
                      onClick={() => router.push(`/projects/${task.project_id}`)}
                      className="hover:bg-surface-variant/30 transition-colors cursor-pointer group"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="w-2 h-2 rounded-full bg-error animate-pulse shadow-[0_0_8px_rgba(255,180,171,0.8)]"></span>
                          <span className="text-sm font-semibold text-on-surface group-hover:text-primary transition-colors">{task.title}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-on-surface-variant text-sm">{task.project_name}</td>
                      <td className="px-6 py-4 text-error text-sm font-bold">{formatDate(task.due_date)}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          task.priority === 'high' ? 'bg-error/10 text-error border border-error/20' : 
                          task.priority === 'medium' ? 'bg-tertiary/10 text-tertiary border border-tertiary/20' : 
                          'bg-secondary-container text-on-secondary-container'
                        }`}>
                          {task.priority}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right Column: My Tasks List */}
        <div className="lg:col-span-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-on-surface">My Tasks</h2>
            <span className="material-symbols-outlined text-on-surface-variant cursor-pointer hover:text-primary transition-colors">filter_list</span>
          </div>

          <div className="space-y-4">
            {loading ? (
               <div className="glass-panel p-4 rounded-xl"><LoadingSkeleton variant="row" count={3} /></div>
            ) : !data?.my_tasks || data.my_tasks.length === 0 ? (
               <div className="glass-panel p-8 text-center rounded-xl flex flex-col items-center justify-center min-h-[200px]">
                 <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-2">inbox</span>
                 <p className="text-on-surface-variant text-sm">Inbox Zero!</p>
               </div>
            ) : (
              data.my_tasks.map((task) => (
                <div 
                  key={task.id}
                  onClick={() => router.push(`/projects/${task.project_id}`)}
                  className="glass-panel p-4 rounded-xl hover:border-primary transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between mb-2 gap-2">
                    <h4 className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors leading-tight">{task.title}</h4>
                    <span className={`px-2 py-1 rounded text-[10px] font-bold whitespace-nowrap ${
                      task.status === 'todo' ? 'bg-surface-container-highest text-on-surface-variant' :
                      task.status === 'in_progress' ? 'bg-secondary-container text-on-secondary-container' :
                      'bg-primary-container text-on-primary-container'
                    }`}>
                      {statusLabel[task.status]}
                    </span>
                  </div>
                  <p className="text-xs text-on-surface-variant mb-4 font-medium">{task.project_name}</p>
                  <div className="flex items-center justify-between pt-3 border-t border-outline-variant/10">
                    <div className="flex items-center gap-2 text-on-surface-variant">
                      <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                      <span className="text-[12px] font-medium">{formatDate(task.due_date)}</span>
                    </div>
                    <div className="flex items-center gap-1 text-on-surface-variant group-hover:text-primary transition-colors">
                      <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
