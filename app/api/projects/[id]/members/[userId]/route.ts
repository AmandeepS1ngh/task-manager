import { getSessionUser } from '@/lib/auth';
import { requireAdmin } from '@/lib/rbac';
import { createAdminClient } from '@/lib/supabase/server';
import { success, failure } from '@/lib/api';
import { NextRequest } from 'next/server';

type RouteContext = { params: Promise<{ id: string; userId: string }> };

/**
 * PATCH /api/projects/[id]/members/[userId]
 * Update a member's role. Admin only.
 * Body: { role }
 */
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const user = await getSessionUser();
    const { id: projectId, userId: targetUserId } = await context.params;

    await requireAdmin(user.id, projectId);

    const body = await request.json();
    const { role } = body;

    if (!role || !['admin', 'member'].includes(role)) {
      return failure('Invalid role. Must be "admin" or "member"', 400);
    }

    const supabase = createAdminClient();

    const { data: member, error } = await supabase
      .from('project_members')
      .update({ role })
      .eq('project_id', projectId)
      .eq('user_id', targetUserId)
      .select()
      .single();

    if (error) {
      return failure(error.message, 400);
    }

    if (!member) {
      return failure('Member not found', 404);
    }

    return success(member);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    if (message === 'UNAUTHORIZED') return failure('Unauthorized', 401);
    if (message === 'FORBIDDEN') return failure('Forbidden', 403);
    return failure(message, 500);
  }
}

/**
 * DELETE /api/projects/[id]/members/[userId]
 * Remove a member from the project. Admin only.
 * Cannot remove yourself if you're the only admin.
 */
export async function DELETE(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const user = await getSessionUser();
    const { id: projectId, userId: targetUserId } = await context.params;

    await requireAdmin(user.id, projectId);

    const supabase = createAdminClient();

    // If removing yourself, check if you're the only admin
    if (user.id === targetUserId) {
      const { data: admins, error: countError } = await supabase
        .from('project_members')
        .select('id')
        .eq('project_id', projectId)
        .eq('role', 'admin');

      if (countError) {
        return failure(countError.message, 400);
      }

      if (!admins || admins.length <= 1) {
        return failure('Cannot remove the only admin from the project', 400);
      }
    }

    const { error } = await supabase
      .from('project_members')
      .delete()
      .eq('project_id', projectId)
      .eq('user_id', targetUserId);

    if (error) {
      return failure(error.message, 400);
    }

    return success({ message: 'Member removed' });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    if (message === 'UNAUTHORIZED') return failure('Unauthorized', 401);
    if (message === 'FORBIDDEN') return failure('Forbidden', 403);
    return failure(message, 500);
  }
}
