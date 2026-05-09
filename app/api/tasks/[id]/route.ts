import { getSessionUser } from '@/lib/auth';
import { requireAdmin, requireMember, getProjectRole } from '@/lib/rbac';
import { createAdminClient } from '@/lib/supabase/server';
import { success, failure } from '@/lib/api';
import { NextRequest } from 'next/server';

type RouteContext = { params: Promise<{ id: string }> };

/**
 * GET /api/tasks/[id]
 * Returns task details with assignee profile.
 */
export async function GET(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const user = await getSessionUser();
    const { id } = await context.params;

    const supabase = createAdminClient();

    // Fetch task
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', id)
      .single();

    if (taskError || !task) {
      return failure('Task not found', 404);
    }

    // Verify membership on the task's project
    await requireMember(user.id, task.project_id);

    // Fetch assignee profile if assigned
    let assignee = null;
    if (task.assigned_to) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', task.assigned_to)
        .single();

      assignee = profile;
    }

    return success({ ...task, assignee });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    if (message === 'UNAUTHORIZED') return failure('Unauthorized', 401);
    if (message === 'FORBIDDEN') return failure('Forbidden', 403);
    return failure(message, 500);
  }
}

/**
 * PATCH /api/tasks/[id]
 * Update a task. Members can only update status; admins can update all fields.
 */
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const user = await getSessionUser();
    const { id } = await context.params;

    const supabase = createAdminClient();

    // Fetch existing task
    const { data: task, error: fetchError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !task) {
      return failure('Task not found', 404);
    }

    // Check membership and get role
    const role = await getProjectRole(user.id, task.project_id);
    if (!role) {
      return failure('Forbidden', 403);
    }

    const body = await request.json();

    // Build updates based on role
    const updates: Record<string, unknown> = {};

    if (role === 'admin') {
      // Admins can update everything
      if (body.title !== undefined) updates.title = body.title;
      if (body.description !== undefined) updates.description = body.description;
      if (body.status !== undefined) {
        if (!['todo', 'in_progress', 'done'].includes(body.status)) {
          return failure('Invalid status', 400);
        }
        updates.status = body.status;
      }
      if (body.priority !== undefined) {
        if (!['low', 'medium', 'high'].includes(body.priority)) {
          return failure('Invalid priority', 400);
        }
        updates.priority = body.priority;
      }
      if (body.assigned_to !== undefined) updates.assigned_to = body.assigned_to;
      if (body.due_date !== undefined) updates.due_date = body.due_date;
    } else {
      // Members can only update status
      if (body.status !== undefined) {
        if (!['todo', 'in_progress', 'done'].includes(body.status)) {
          return failure('Invalid status', 400);
        }
        updates.status = body.status;
      }

      // Ignore all other fields silently for members
    }

    if (Object.keys(updates).length === 0) {
      return failure('No fields to update', 400);
    }

    const { data: updatedTask, error: updateError } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return failure(updateError.message, 400);
    }

    return success(updatedTask);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    if (message === 'UNAUTHORIZED') return failure('Unauthorized', 401);
    if (message === 'FORBIDDEN') return failure('Forbidden', 403);
    return failure(message, 500);
  }
}

/**
 * DELETE /api/tasks/[id]
 * Delete a task. Admin only.
 */
export async function DELETE(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const user = await getSessionUser();
    const { id } = await context.params;

    const supabase = createAdminClient();

    // Fetch task to get project_id
    const { data: task, error: fetchError } = await supabase
      .from('tasks')
      .select('project_id')
      .eq('id', id)
      .single();

    if (fetchError || !task) {
      return failure('Task not found', 404);
    }

    await requireAdmin(user.id, task.project_id);

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);

    if (error) {
      return failure(error.message, 400);
    }

    return success({ message: 'Task deleted' });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    if (message === 'UNAUTHORIZED') return failure('Unauthorized', 401);
    if (message === 'FORBIDDEN') return failure('Forbidden', 403);
    return failure(message, 500);
  }
}
