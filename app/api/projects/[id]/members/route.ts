import { getSessionUser } from '@/lib/auth';
import { requireAdmin } from '@/lib/rbac';
import { createAdminClient } from '@/lib/supabase/server';
import { success, failure } from '@/lib/api';
import { NextRequest } from 'next/server';

type RouteContext = { params: Promise<{ id: string }> };

/**
 * POST /api/projects/[id]/members
 * Add a member to the project. Admin only.
 * Body: { email, role }
 */
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const user = await getSessionUser();
    const { id: projectId } = await context.params;

    await requireAdmin(user.id, projectId);

    const body = await request.json();
    const { email, role } = body;

    if (!email) {
      return failure('Missing required field: email', 400);
    }

    if (role && !['admin', 'member'].includes(role)) {
      return failure('Invalid role. Must be "admin" or "member"', 400);
    }

    const supabase = createAdminClient();

    // Look up the user by email in profiles
    const { data: targetUser, error: lookupError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single();

    if (lookupError || !targetUser) {
      return failure('User not found with this email', 404);
    }

    // Check if already a member
    const { data: existing } = await supabase
      .from('project_members')
      .select('id')
      .eq('project_id', projectId)
      .eq('user_id', targetUser.id)
      .single();

    if (existing) {
      return failure('User is already a member of this project', 409);
    }

    // Add member
    const { data: member, error: insertError } = await supabase
      .from('project_members')
      .insert({
        project_id: projectId,
        user_id: targetUser.id,
        role: role || 'member',
      })
      .select()
      .single();

    if (insertError) {
      return failure(insertError.message, 400);
    }

    return success(member, 201);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    if (message === 'UNAUTHORIZED') return failure('Unauthorized', 401);
    if (message === 'FORBIDDEN') return failure('Forbidden', 403);
    return failure(message, 500);
  }
}
