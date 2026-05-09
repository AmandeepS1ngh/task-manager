// ============================================================
// Type definitions for the Team Task Manager
// ============================================================

// --- Enums / Union Types ---

export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type Priority = 'low' | 'medium' | 'high';
export type Role = 'admin' | 'member';

// --- Table Types ---

export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  created_at: string;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  created_at: string;
}

export interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  role: Role;
  joined_at: string;
}

export interface Task {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: Priority;
  assigned_to: string | null;
  due_date: string | null;
  created_by: string | null;
  created_at: string;
}

// --- API Response Wrapper ---

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

// --- Extended Types for API Responses ---

export interface ProjectWithMeta extends Project {
  member_count: number;
  task_count: number;
  role: Role;
}

export interface ProjectDetail {
  project: Project;
  members: (ProjectMember & { profile: Profile })[];
  task_counts: {
    todo: number;
    in_progress: number;
    done: number;
  };
}

export interface TaskWithAssignee extends Task {
  assignee: Profile | null;
}

export interface TaskWithProject extends Task {
  project_name: string;
}

export interface DashboardData {
  total_tasks: number;
  completed_tasks: number;
  overdue_tasks: TaskWithProject[];
  my_tasks: TaskWithProject[];
  projects_count: number;
}
