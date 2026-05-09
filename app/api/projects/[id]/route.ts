import { getSessionUser } from '@/lib/auth';
import { requireAdmin, requireMember } from '@/lib/rbac';
import { createAdminClient } from '@/lib/supabase/server';
import { success, failure } from '@/lib/api';
import { NextRequest } from 'next/server';

type RouteContext = { params: Promise<{ id: string }> };

/**
 * GET /api/projects/[id]
 * Returns project details + members (with profile info) + task counts.
 */
export async function GET(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const user = await getSessionUser();
    const { id } = await context.params;

    await requireMember(user.id, id);

    const supabase = createAdminClient();

    // Fetch project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();

    if (projectError) {
      return failure('Project not found', 404);
    }

    // Fetch members with profile info
    const { data: members, error: membersError } = await supabase
      .from('project_members')
      .select('*, profile:profiles(*)')
      .eq('project_id', id);

    if (membersError) {
      return failure(membersError.message, 400);
    }

    // Fetch tasks for counting
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('status')
      .eq('project_id', id);

    if (tasksError) {
      return failure(tasksError.message, 400);
    }

    const taskCounts = {
      todo: tasks?.filter((t) => t.status === 'todo').length || 0,
      in_progress: tasks?.filter((t) => t.status === 'in_progress').length || 0,
      done: tasks?.filter((t) => t.status === 'done').length || 0,
    };

    return success({
      project,
      members,
      task_counts: taskCounts,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    if (message === 'UNAUTHORIZED') return failure('Unauthorized', 401);
    if (message === 'FORBIDDEN') return failure('Forbidden', 403);
    return failure(message, 500);
  }
}

/**
 * PATCH /api/projects/[id]
 * Update project name/description. Admin only.
 */
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const user = await getSessionUser();
    const { id } = await context.params;

    await requireAdmin(user.id, id);

    const body = await request.json();
    const { name, description } = body;

    // Build update payload (only include provided fields)
    const updates: Record<string, string> = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;

    if (Object.keys(updates).length === 0) {
      return failure('No fields to update', 400);
    }

    const supabase = createAdminClient();

    const { data: project, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return failure(error.message, 400);
    }

    return success(project);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    if (message === 'UNAUTHORIZED') return failure('Unauthorized', 401);
    if (message === 'FORBIDDEN') return failure('Forbidden', 403);
    return failure(message, 500);
  }
}

/**
 * DELETE /api/projects/[id]
 * Delete a project. Admin only.
 */
export async function DELETE(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const user = await getSessionUser();
    const { id } = await context.params;

    await requireAdmin(user.id, id);

    const supabase = createAdminClient();

    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);

    if (error) {
      return failure(error.message, 400);
    }

    return success({ message: 'Project deleted' });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    if (message === 'UNAUTHORIZED') return failure('Unauthorized', 401);
    if (message === 'FORBIDDEN') return failure('Forbidden', 403);
    return failure(message, 500);
  }
}
