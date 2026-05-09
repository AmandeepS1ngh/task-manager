import { getSessionUser } from '@/lib/auth';
import { requireAdmin, requireMember } from '@/lib/rbac';
import { createAdminClient } from '@/lib/supabase/server';
import { success, failure } from '@/lib/api';
import { NextRequest } from 'next/server';

/**
 * GET /api/tasks?projectId=...&status=...&assignedTo=...
 * Lists tasks with optional filters. Requires membership on projectId.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser();
    const { searchParams } = new URL(request.url);

    const projectId = searchParams.get('projectId');
    const status = searchParams.get('status');
    const assignedTo = searchParams.get('assignedTo');

    const supabase = createAdminClient();

    // If projectId is provided, verify membership
    if (projectId) {
      await requireMember(user.id, projectId);
    }

    // Build query
    let query = supabase.from('tasks').select('*');

    if (projectId) {
      query = query.eq('project_id', projectId);
    } else {
      // Only fetch tasks from projects the user is a member of
      const { data: memberships } = await supabase
        .from('project_members')
        .select('project_id')
        .eq('user_id', user.id);

      if (!memberships || memberships.length === 0) {
        return success([]);
      }

      const ids = memberships.map((m) => m.project_id);
      query = query.in('project_id', ids);
    }

    if (status) {
      if (!['todo', 'in_progress', 'done'].includes(status)) {
        return failure('Invalid status filter. Must be: todo, in_progress, done', 400);
      }
      query = query.eq('status', status);
    }

    if (assignedTo) {
      query = query.eq('assigned_to', assignedTo);
    }

    const { data: tasks, error } = await query.order('created_at', { ascending: false });

    if (error) {
      return failure(error.message, 400);
    }

    return success(tasks);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    if (message === 'UNAUTHORIZED') return failure('Unauthorized', 401);
    if (message === 'FORBIDDEN') return failure('Forbidden', 403);
    return failure(message, 500);
  }
}

/**
 * POST /api/tasks
 * Create a new task. Admin only on the target project.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    const body = await request.json();
    const { project_id, title, description, status, priority, assigned_to, due_date } = body;

    if (!project_id) {
      return failure('Missing required field: project_id', 400);
    }

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return failure('Missing required field: title', 400);
    }

    // Validate enums if provided
    if (status && !['todo', 'in_progress', 'done'].includes(status)) {
      return failure('Invalid status. Must be: todo, in_progress, done', 400);
    }

    if (priority && !['low', 'medium', 'high'].includes(priority)) {
      return failure('Invalid priority. Must be: low, medium, high', 400);
    }

    await requireAdmin(user.id, project_id);

    const supabase = createAdminClient();

    // If assigned_to is provided, verify the user is a member of the project
    if (assigned_to) {
      const { data: isMember } = await supabase
        .from('project_members')
        .select('id')
        .eq('project_id', project_id)
        .eq('user_id', assigned_to)
        .single();

      if (!isMember) {
        return failure('Assigned user is not a member of this project', 400);
      }
    }

    const { data: task, error } = await supabase
      .from('tasks')
      .insert({
        project_id,
        title: title.trim(),
        description: description || null,
        status: status || 'todo',
        priority: priority || 'medium',
        assigned_to: assigned_to || null,
        due_date: due_date || null,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      return failure(error.message, 400);
    }

    return success(task, 201);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    if (message === 'UNAUTHORIZED') return failure('Unauthorized', 401);
    if (message === 'FORBIDDEN') return failure('Forbidden', 403);
    return failure(message, 500);
  }
}
