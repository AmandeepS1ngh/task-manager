import { getSessionUser } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/server';
import { success, failure } from '@/lib/api';

/**
 * GET /api/projects
 * Returns all projects where the current user is a member.
 * Includes: member_count, task_count, user's role.
 */
export async function GET() {
  try {
    const user = await getSessionUser();
    const supabase = createAdminClient();

    // Get all project IDs the user is a member of, with their role
    const { data: memberships, error: memberError } = await supabase
      .from('project_members')
      .select('project_id, role')
      .eq('user_id', user.id);

    if (memberError) {
      return failure(memberError.message, 400);
    }

    if (!memberships || memberships.length === 0) {
      return success([]);
    }

    const projectIds = memberships.map((m) => m.project_id);
    const roleMap: Record<string, string> = {};
    memberships.forEach((m) => {
      roleMap[m.project_id] = m.role;
    });

    // Fetch projects
    const { data: projects, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .in('id', projectIds)
      .order('created_at', { ascending: false });

    if (projectError) {
      return failure(projectError.message, 400);
    }

    // Fetch member counts
    const { data: memberCounts, error: mcError } = await supabase
      .from('project_members')
      .select('project_id')
      .in('project_id', projectIds);

    if (mcError) {
      return failure(mcError.message, 400);
    }

    // Fetch task counts
    const { data: taskCounts, error: tcError } = await supabase
      .from('tasks')
      .select('project_id')
      .in('project_id', projectIds);

    if (tcError) {
      return failure(tcError.message, 400);
    }

    // Count members and tasks per project
    const memberCountMap: Record<string, number> = {};
    const taskCountMap: Record<string, number> = {};

    memberCounts?.forEach((m) => {
      memberCountMap[m.project_id] = (memberCountMap[m.project_id] || 0) + 1;
    });

    taskCounts?.forEach((t) => {
      taskCountMap[t.project_id] = (taskCountMap[t.project_id] || 0) + 1;
    });

    // Assemble response
    const result = projects?.map((p) => ({
      ...p,
      member_count: memberCountMap[p.id] || 0,
      task_count: taskCountMap[p.id] || 0,
      role: roleMap[p.id],
    }));

    return success(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    if (message === 'UNAUTHORIZED') return failure('Unauthorized', 401);
    return failure(message, 500);
  }
}

/**
 * POST /api/projects
 * Create a new project. The creator is auto-added as admin.
 */
export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    const body = await request.json();
    const { name, description } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return failure('Missing required field: name', 400);
    }

    const supabase = createAdminClient();

    // Create the project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({
        name: name.trim(),
        description: description || null,
        owner_id: user.id,
      })
      .select()
      .single();

    if (projectError) {
      return failure(projectError.message, 400);
    }

    // Auto-add creator as admin member
    const { error: memberError } = await supabase
      .from('project_members')
      .insert({
        project_id: project.id,
        user_id: user.id,
        role: 'admin',
      });

    if (memberError) {
      // Roll back: delete the project if adding the member fails
      await supabase.from('projects').delete().eq('id', project.id);
      return failure(memberError.message, 400);
    }

    return success(project, 201);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    if (message === 'UNAUTHORIZED') return failure('Unauthorized', 401);
    return failure(message, 500);
  }
}
