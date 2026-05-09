'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';
import { useToast } from '@/lib/context/ToastContext';
import { useUser } from '@/lib/context/UserContext';
import Badge from '@/components/Badge';
import TaskCard from '@/components/TaskCard';
import Modal from '@/components/Modal';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import type { Project, Task, Profile, Role, TaskStatus, Priority } from '@/lib/types';

interface MemberWithProfile {
  id: string;
  project_id: string;
  user_id: string;
  role: Role;
  joined_at: string;
  profile: Profile;
}

interface ProjectDetailData {
  project: Project;
  members: MemberWithProfile[];
  task_counts: { todo: number; in_progress: number; done: number };
}

const statusCols: { key: TaskStatus; label: string; color: 'slate' | 'amber' | 'green' }[] = [
  { key: 'todo', label: 'To Do', color: 'slate' },
  { key: 'in_progress', label: 'In Progress', color: 'amber' },
  { key: 'done', label: 'Done', color: 'green' },
];

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useUser();
  const { showToast } = useToast();

  const [detail, setDetail] = useState<ProjectDetailData | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [myRole, setMyRole] = useState<Role | null>(null);
  const [membersOpen, setMembersOpen] = useState(false);

  // Modal states
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [addTaskOpen, setAddTaskOpen] = useState(false);
  const [taskDetailOpen, setTaskDetailOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Form states
  const [memberEmail, setMemberEmail] = useState('');
  const [memberRole, setMemberRole] = useState<Role>('member');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskPriority, setTaskPriority] = useState<Priority>('medium');
  const [taskAssignee, setTaskAssignee] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Edit fields for task detail
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editStatus, setEditStatus] = useState<TaskStatus>('todo');
  const [editPriority, setEditPriority] = useState<Priority>('medium');
  const [editAssignee, setEditAssignee] = useState('');
  const [editDueDate, setEditDueDate] = useState('');

  const isAdmin = myRole === 'admin';

  const fetchAll = useCallback(async () => {
    const [detailRes, tasksRes] = await Promise.all([
      api.get<ProjectDetailData>(`/api/projects/${id}`),
      api.get<Task[]>(`/api/tasks?projectId=${id}`),
    ]);
    if (detailRes.error) { showToast(detailRes.error, 'error'); return; }
    if (tasksRes.error) { showToast(tasksRes.error, 'error'); return; }
    setDetail(detailRes.data);
    setTasks(tasksRes.data ?? []);
    const me = detailRes.data?.members.find((m) => m.user_id === user?.id);
    setMyRole((me?.role as Role) ?? null);
    setLoading(false);
  }, [id, user?.id, showToast]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Handlers ──────────────────────────────────
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberEmail.trim()) return;
    setSubmitting(true);
    const { error } = await api.post(`/api/projects/${id}/members`, { email: memberEmail.trim(), role: memberRole });
    setSubmitting(false);
    if (error) { showToast(error, 'error'); return; }
    showToast('Member added!', 'success');
    setAddMemberOpen(false);
    setMemberEmail('');
    fetchAll();
  };

  const handleRemoveMember = async (userId: string) => {
    const { error } = await api.delete(`/api/projects/${id}/members/${userId}`);
    if (error) { showToast(error, 'error'); return; }
    showToast('Member removed', 'success');
    fetchAll();
  };

  const handleDeleteProject = async () => {
    if (!confirm('Are you sure you want to delete this project?')) return;
    const { error } = await api.delete(`/api/projects/${id}`);
    if (error) { showToast(error, 'error'); return; }
    showToast('Project deleted', 'success');
    router.push('/projects');
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) { showToast('Title is required', 'error'); return; }
    setSubmitting(true);
    const { error } = await api.post('/api/tasks', {
      project_id: id, title: taskTitle.trim(), description: taskDesc || null,
      priority: taskPriority, assigned_to: taskAssignee || null, due_date: taskDueDate || null,
    });
    setSubmitting(false);
    if (error) { showToast(error, 'error'); return; }
    showToast('Task created!', 'success');
    setAddTaskOpen(false);
    setTaskTitle(''); setTaskDesc(''); setTaskPriority('medium'); setTaskAssignee(''); setTaskDueDate('');
    fetchAll();
  };

  const openTaskDetail = (task: Task) => {
    setSelectedTask(task);
    setEditTitle(task.title);
    setEditDesc(task.description ?? '');
    setEditStatus(task.status);
    setEditPriority(task.priority);
    setEditAssignee(task.assigned_to ?? '');
    setEditDueDate(task.due_date ?? '');
    setTaskDetailOpen(true);
  };

  const handleUpdateTask = async () => {
    if (!selectedTask) return;
    setSubmitting(true);
    const body = isAdmin
      ? { title: editTitle, description: editDesc || null, status: editStatus, priority: editPriority, assigned_to: editAssignee || null, due_date: editDueDate || null }
      : { status: editStatus };
    const { error } = await api.patch(`/api/tasks/${selectedTask.id}`, body);
    setSubmitting(false);
    if (error) { showToast(error, 'error'); return; }
    showToast('Task updated!', 'success');
    setTaskDetailOpen(false);
    fetchAll();
  };

  const handleDeleteTask = async () => {
    if (!selectedTask) return;
    const { error } = await api.delete(`/api/tasks/${selectedTask.id}`);
    if (error) { showToast(error, 'error'); return; }
    showToast('Task deleted', 'success');
    setTaskDetailOpen(false);
    fetchAll();
  };

  const inputCls = "w-full px-4 py-2.5 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] placeholder:text-[var(--color-border)] focus:border-[var(--color-primary)] transition-colors";
  const selectCls = inputCls + " appearance-none";
  const labelCls = "block text-sm font-medium text-[var(--color-muted)] mb-1.5";

  if (loading) return (
    <div className="space-y-6">
      <LoadingSkeleton variant="card" count={1} />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4"><LoadingSkeleton variant="card" count={3} /></div>
    </div>
  );

  const members = detail?.members ?? [];

  return (
    <div className="max-w-container-max mx-auto space-y-8">
      {/* ── Project Header Section ── */}
      <section className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-3">
            <span className="px-2 py-0.5 rounded bg-primary-container text-on-primary-container text-[10px] font-bold uppercase tracking-wider">
              {isAdmin ? 'Admin' : 'Member'}
            </span>
            <span className="text-on-surface-variant flex items-center gap-1 text-sm">
              <span className="material-symbols-outlined text-[16px]" data-icon="group">group</span> {members.length} Members
            </span>
          </div>
          <h1 className="text-4xl font-bold text-primary tracking-tight mb-2">{detail?.project.name}</h1>
          <p className="text-on-surface-variant text-base">
            {detail?.project.description || 'No project description provided.'}
          </p>
        </div>
        <div className="flex gap-3">
          {isAdmin && (
            <>
              <button onClick={() => setAddMemberOpen(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-container-high border border-outline-variant hover:border-primary transition-colors text-primary font-semibold">
                <span className="material-symbols-outlined" data-icon="person_add">person_add</span>
                + Member
              </button>
              <button onClick={handleDeleteProject} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-container-low text-error border border-error/20 hover:bg-error/10 transition-colors">
                <span className="material-symbols-outlined" data-icon="delete_outline">delete_outline</span>
                Delete Project
              </button>
            </>
          )}
        </div>
      </section>

      {/* ── Members Panel ── */}
      <section className="glass-panel rounded-2xl p-6 overflow-hidden">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary" data-icon="hub">hub</span>
            Active Contributors
          </h3>
        </div>
        <div className="flex gap-6 overflow-x-auto pb-2 custom-scrollbar">
          {members.map((m) => (
            <div key={m.id} className="flex-shrink-0 flex flex-col items-center gap-3 w-28 group cursor-pointer relative">
              <div className="relative">
                <div className="w-16 h-16 rounded-full object-cover border-2 border-outline-variant flex items-center justify-center bg-surface-container-highest text-xl font-bold transition-transform group-hover:scale-110 group-hover:border-primary">
                  {m.profile.full_name?.[0]?.toUpperCase() ?? '?'}
                </div>
                {m.role === 'admin' && (
                  <span className="absolute -top-1 -right-1 bg-primary text-on-primary text-[8px] px-1.5 py-0.5 rounded-full font-bold">ADMIN</span>
                )}
                {isAdmin && m.user_id !== user?.id && (
                  <button onClick={(e) => { e.stopPropagation(); handleRemoveMember(m.user_id); }} className="absolute -bottom-2 right-0 bg-error text-on-error rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="material-symbols-outlined text-[12px]">close</span>
                  </button>
                )}
              </div>
              <div className="text-center">
                <p className="text-xs font-bold text-on-surface truncate w-full">{m.profile.full_name}</p>
                <p className="text-[10px] text-on-surface-variant truncate w-full">{m.profile.email?.split('@')[0] ?? 'Unknown'}</p>
              </div>
            </div>
          ))}
          {isAdmin && (
            <div onClick={() => setAddMemberOpen(true)} className="flex-shrink-0 flex flex-col items-center gap-3 w-28 group cursor-pointer">
              <div className="w-16 h-16 rounded-full bg-surface-container-highest border-2 border-dashed border-outline-variant flex items-center justify-center text-outline transition-all group-hover:border-primary group-hover:text-primary">
                <span className="material-symbols-outlined" data-icon="add">add</span>
              </div>
              <p className="text-xs font-bold text-on-surface-variant group-hover:text-primary transition-colors">Invite</p>
            </div>
          )}
        </div>
      </section>

      {/* ── Kanban Task Board Header ── */}
      <div className="flex justify-between items-center mt-8">
        <h3 className="text-2xl font-bold text-on-surface flex items-center gap-2">
          <span className="material-symbols-outlined text-primary" data-icon="view_kanban">view_kanban</span>
          Project Board
        </h3>
        {isAdmin && (
          <button onClick={() => setAddTaskOpen(true)} className="bg-primary-container text-on-primary-container px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:brightness-105 transition-all shadow-lg active:scale-95">
            <span className="material-symbols-outlined" data-icon="add_task">add_task</span>
            + Add Task
          </button>
        )}
      </div>

      {/* ── Kanban Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start pb-8">
        {statusCols.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.key);
          return (
            <div key={col.key} className="space-y-4">
              {/* Column Header */}
              <div className="sticky top-24 z-10 bg-background/50 backdrop-blur-sm py-2 px-1 flex justify-between items-center border-b border-primary/20">
                <span className="font-bold text-sm tracking-widest text-on-surface uppercase flex items-center gap-2">
                  {col.key === 'todo' && <span className="w-2 h-2 rounded-full bg-outline"></span>}
                  {col.key === 'in_progress' && <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>}
                  {col.key === 'done' && <span className="w-2 h-2 rounded-full bg-green-500"></span>}
                  {col.label} ({colTasks.length})
                </span>
                <span className="material-symbols-outlined text-on-surface-variant cursor-pointer" data-icon="more_horiz">more_horiz</span>
              </div>
              
              {/* Task Cards */}
              <div className="space-y-4 min-h-[150px]">
                {colTasks.length === 0 ? (
                  <div className="h-24 flex items-center justify-center border-2 border-dashed border-outline-variant/30 rounded-xl text-on-surface-variant text-sm font-medium">
                    Empty
                  </div>
                ) : (
                  colTasks.map((task) => (
                    <div 
                      key={task.id} 
                      onClick={() => openTaskDetail(task)}
                      className={`glass-panel p-5 rounded-2xl cursor-pointer hover:-translate-y-1 hover:border-primary transition-all group ${col.key === 'done' ? 'opacity-60 grayscale hover:grayscale-0 hover:opacity-100' : ''}`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          task.priority === 'high' ? 'bg-error-container text-on-error-container' :
                          task.priority === 'medium' ? 'bg-secondary-container text-on-secondary-container' :
                          'bg-tertiary-container/20 text-tertiary-fixed'
                        }`}>
                          {task.priority}
                        </span>
                        {col.key === 'done' ? (
                          <span className="material-symbols-outlined text-green-500" data-icon="check_circle">check_circle</span>
                        ) : (
                          <span className="material-symbols-outlined text-outline group-hover:text-primary transition-colors" data-icon="drag_indicator">drag_indicator</span>
                        )}
                      </div>
                      <h4 className={`font-bold text-on-surface mb-4 ${col.key === 'done' ? 'line-through' : ''}`}>
                        {task.title}
                      </h4>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2 text-on-surface-variant text-xs">
                          {col.key === 'done' ? (
                            <><span className="material-symbols-outlined text-[16px]" data-icon="task_alt">task_alt</span> Completed</>
                          ) : (
                            <><span className="material-symbols-outlined text-[16px]" data-icon="calendar_today">calendar_today</span> {new Date(task.due_date || '').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</>
                          )}
                        </div>
                        {task.assigned_to && (
                          <div className="w-6 h-6 rounded-full bg-primary-container border border-outline-variant flex items-center justify-center text-[10px] font-bold text-on-primary-container">
                            {members.find(m => m.user_id === task.assigned_to)?.profile.full_name?.[0]?.toUpperCase() ?? '?'}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Add Member Modal ── */}
      <Modal isOpen={addMemberOpen} onClose={() => setAddMemberOpen(false)} title="Add Member">
        <form onSubmit={handleAddMember} className="space-y-4">
          <div><label className={labelCls}>Email *</label><input type="email" value={memberEmail} onChange={(e) => setMemberEmail(e.target.value)} placeholder="user@example.com" className={inputCls} autoFocus /></div>
          <div><label className={labelCls}>Role</label><select value={memberRole} onChange={(e) => setMemberRole(e.target.value as Role)} className={selectCls}><option value="member">Member</option><option value="admin">Admin</option></select></div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setAddMemberOpen(false)} className="px-4 py-2 text-sm text-[var(--color-muted)]">Cancel</button>
            <button type="submit" disabled={submitting} className="flex items-center gap-2 px-4 py-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
              {submitting && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}{submitting ? 'Adding...' : 'Add Member'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Add Task Modal ── */}
      <Modal isOpen={addTaskOpen} onClose={() => setAddTaskOpen(false)} title="Add Task">
        <form onSubmit={handleAddTask} className="space-y-4">
          <div><label className={labelCls}>Title *</label><input type="text" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} placeholder="Task title" className={inputCls} autoFocus /></div>
          <div><label className={labelCls}>Description</label><textarea value={taskDesc} onChange={(e) => setTaskDesc(e.target.value)} placeholder="Optional" rows={2} className={inputCls + " resize-none"} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className={labelCls}>Priority</label><select value={taskPriority} onChange={(e) => setTaskPriority(e.target.value as Priority)} className={selectCls}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></div>
            <div><label className={labelCls}>Due Date</label><input type="date" value={taskDueDate} onChange={(e) => setTaskDueDate(e.target.value)} className={inputCls} /></div>
          </div>
          <div><label className={labelCls}>Assign To</label><select value={taskAssignee} onChange={(e) => setTaskAssignee(e.target.value)} className={selectCls}><option value="">Unassigned</option>{members.map((m) => (<option key={m.user_id} value={m.user_id}>{m.profile.full_name}</option>))}</select></div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setAddTaskOpen(false)} className="px-4 py-2 text-sm text-[var(--color-muted)]">Cancel</button>
            <button type="submit" disabled={submitting} className="flex items-center gap-2 px-4 py-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
              {submitting && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}{submitting ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Task Detail Modal ── */}
      <Modal isOpen={taskDetailOpen} onClose={() => setTaskDetailOpen(false)} title="Task Details" maxWidth="max-w-lg">
        {selectedTask && (
          <div className="space-y-4">
            {isAdmin ? (
              <div><label className={labelCls}>Title</label><input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className={inputCls} /></div>
            ) : (
              <div><label className={labelCls}>Title</label><p className="text-[var(--color-text)]">{selectedTask.title}</p></div>
            )}
            {isAdmin ? (
              <div><label className={labelCls}>Description</label><textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} rows={2} className={inputCls + " resize-none"} /></div>
            ) : selectedTask.description ? (
              <div><label className={labelCls}>Description</label><p className="text-sm text-[var(--color-muted)]">{selectedTask.description}</p></div>
            ) : null}
            <div className="grid grid-cols-2 gap-4">
              <div><label className={labelCls}>Status</label><select value={editStatus} onChange={(e) => setEditStatus(e.target.value as TaskStatus)} className={selectCls}><option value="todo">To Do</option><option value="in_progress">In Progress</option><option value="done">Done</option></select></div>
              {isAdmin ? (
                <div><label className={labelCls}>Priority</label><select value={editPriority} onChange={(e) => setEditPriority(e.target.value as Priority)} className={selectCls}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></div>
              ) : (
                <div><label className={labelCls}>Priority</label><Badge label={selectedTask.priority} color={selectedTask.priority === 'high' ? 'red' : selectedTask.priority === 'medium' ? 'amber' : 'green'} /></div>
              )}
            </div>
            {isAdmin && (
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelCls}>Assign To</label><select value={editAssignee} onChange={(e) => setEditAssignee(e.target.value)} className={selectCls}><option value="">Unassigned</option>{members.map((m) => (<option key={m.user_id} value={m.user_id}>{m.profile.full_name}</option>))}</select></div>
                <div><label className={labelCls}>Due Date</label><input type="date" value={editDueDate} onChange={(e) => setEditDueDate(e.target.value)} className={inputCls} /></div>
              </div>
            )}
            <div className="flex items-center justify-between pt-4 border-t border-[var(--color-border)]">
              {isAdmin ? (<button onClick={handleDeleteTask} className="text-sm text-red-400 hover:text-red-300 transition-colors">Delete Task</button>) : <div />}
              <div className="flex gap-3">
                <button onClick={() => setTaskDetailOpen(false)} className="px-4 py-2 text-sm text-[var(--color-muted)]">Cancel</button>
                <button onClick={handleUpdateTask} disabled={submitting} className="flex items-center gap-2 px-4 py-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
                  {submitting && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}{submitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
