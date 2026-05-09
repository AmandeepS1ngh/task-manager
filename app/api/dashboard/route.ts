import { getSessionUser } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/server';
import { success, failure } from '@/lib/api';

/**
 * GET /api/dashboard
 * Returns dashboard data for the current user:
 * - total_tasks, completed_tasks, overdue_tasks, my_tasks, projects_count
 */
export async function GET() {
  try {
    const user = await getSessionUser();
    const supabase = createAdminClient();

    // Get all project IDs the user is a member of
    const { data: memberships, error: memError } = await supabase
      .from('project_members')
      .select('project_id')
      .eq('user_id', user.id);

    if (memError) {
      return failure(memError.message, 400);
    }

    if (!memberships || memberships.length === 0) {
      return success({
        total_tasks: 0,
        completed_tasks: 0,
        overdue_tasks: [],
        my_tasks: [],
        projects_count: 0,
      });
    }

    const projectIds = memberships.map((m) => m.project_id);

    // Get all tasks in the user's projects
    const { data: allTasks, error: taskError } = await supabase
      .from('tasks')
      .select('*, projects!inner(name)')
      .in('project_id', projectIds);

    if (taskError) {
      return failure(taskError.message, 400);
    }

    const tasks = allTasks || [];

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === 'done').length;

    // Overdue tasks: due_date < today AND status != 'done'
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const overdueTasks = tasks
      .filter(
        (t) =>
          t.due_date &&
          t.due_date < today &&
          t.status !== 'done'
      )
      .map((t) => ({
        ...t,
        project_name: (t.projects as { name: string })?.name || null,
        projects: undefined,
      }));

    // My tasks: assigned to the current user
    const myTasks = tasks
      .filter((t) => t.assigned_to === user.id)
      .map((t) => ({
        ...t,
        project_name: (t.projects as { name: string })?.name || null,
        projects: undefined,
      }));

    return success({
      total_tasks: totalTasks,
      completed_tasks: completedTasks,
      overdue_tasks: overdueTasks,
      my_tasks: myTasks,
      projects_count: projectIds.length,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    if (message === 'UNAUTHORIZED') return failure('Unauthorized', 401);
    return failure(message, 500);
  }
}
